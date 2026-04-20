"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/hooks/use-app-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Download, Send } from "lucide-react";

type SubRow = {
  id: string;
  email: string;
  agent_id: string | null;
  verified: boolean;
  createdAt: string;
};

export default function SubscribersAdminPage() {
  const { user } = useAppStore();
  const [rows, setRows] = useState<SubRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [allAgents, setAllAgents] = useState<{ id: string; label: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newScope, setNewScope] = useState<"global" | "agent">("global");
  const [newAgentId, setNewAgentId] = useState<string>("");

  const [campSubject, setCampSubject] = useState("");
  const [campBody, setCampBody] = useState("");
  const [campFilter, setCampFilter] = useState<"all" | "global" | "agent">(
    "all"
  );
  const [campAgentId, setCampAgentId] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("email_subscribers")
      .select("id,email,agent_id,verified,createdAt")
      .order("createdAt", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as SubRow[]);
      const agentIds = [
        ...new Set(
          (data ?? [])
            .map((r) => r.agent_id)
            .filter((id): id is string => !!id)
        ),
      ];
      if (agentIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,name,email")
          .in("id", agentIds);
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p) => {
          map[p.id as string] =
            (p.name as string) || (p.email as string) || p.id;
        });
        setProfiles(map);
      } else {
        setProfiles({});
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) return;
    void load();
  }, [user, load]);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) return;
    const supabase = createClient();
    void supabase
      .from("profiles")
      .select("id,name,email")
      .eq("role", "agent")
      .order("name")
      .then(({ data }) => {
        setAllAgents(
          (data ?? []).map((p) => ({
            id: p.id as string,
            label: (p.name as string) || (p.email as string) || (p.id as string),
          }))
        );
      });
  }, [user]);

  const agentOptions = useMemo(() => {
    const fromRows = [
      ...new Set(rows.map((r) => r.agent_id).filter(Boolean)),
    ] as string[];
    const map = new Map<string, string>();
    fromRows.forEach((id) => map.set(id, profiles[id] ?? id));
    allAgents.forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, a.label);
    });
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [rows, profiles, allAgents]);

  const exportCsv = () => {
    const header = ["email", "scope", "agent_name", "verified", "createdAt"];
    const lines = rows.map((r) =>
      [
        r.email,
        r.agent_id ? "agent" : "global",
        r.agent_id ? (profiles[r.agent_id] ?? "") : "",
        String(r.verified),
        r.createdAt,
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addSubscriber = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Email required");
      return;
    }
    if (newScope === "agent" && !newAgentId) {
      toast.error("Select an agent for agent-scoped subscribers.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("email_subscribers").insert({
      email,
      agent_id:
        newScope === "agent" && newAgentId ? newAgentId : null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Subscriber added");
    setNewEmail("");
    void load();
  };

  const remove = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("email_subscribers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
    setDeleteId(null);
  };

  const saveCampaignDraft = async () => {
    if (!user?.uid) return;
    if (!campSubject.trim() || !campBody.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("email_campaigns").insert({
      subject: campSubject.trim(),
      body: campBody.trim(),
      recipient_filter: campFilter,
      filter_agent_id:
        campFilter === "agent" && campAgentId ? campAgentId : null,
      createdBy: user.uid,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Campaign draft saved. Connect an email provider to send messages."
    );
    setCampSubject("");
    setCampBody("");
  };

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have access to this page.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-light tracking-tight">Subscribers</h1>
        <p className="text-sm text-muted-foreground">
          Newsletter and listing-alert emails captured from the site and agent
          micro-sites.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Add subscriber</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label>Email</Label>
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2 w-full sm:w-48">
            <Label>Scope</Label>
            <Select
              value={newScope}
              onValueChange={(v) => setNewScope(v as "global" | "agent")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Site-wide alerts</SelectItem>
                <SelectItem value="agent">Specific agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newScope === "agent" && (
            <div className="space-y-2 w-full sm:w-64">
              <Label>Agent</Label>
              <Select value={newAgentId} onValueChange={setNewAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agentOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {newScope === "agent" && !newAgentId && agentOptions.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No agents found in the database yet.
            </p>
          )}
          <Button type="button" onClick={() => void addSubscriber()}>
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-light">All subscribers</CardTitle>
            <CardDescription>{rows.length} total</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        No subscribers yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>
                          {r.agent_id
                            ? profiles[r.agent_id] ?? r.agent_id
                            : "Site-wide"}
                        </TableCell>
                        <TableCell>{r.verified ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Bulk email (draft)</CardTitle>
          <CardDescription>
            Saves a message for future sending when SMTP or Resend is connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Select
              value={campFilter}
              onValueChange={(v) =>
                setCampFilter(v as "all" | "global" | "agent")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subscribers</SelectItem>
                <SelectItem value="global">Site-wide only</SelectItem>
                <SelectItem value="agent">One agent&apos;s subscribers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {campFilter === "agent" && (
            <div className="space-y-2">
              <Label>Agent</Label>
              <Select value={campAgentId} onValueChange={setCampAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agentOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={campSubject}
              onChange={(e) => setCampSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              rows={6}
              value={campBody}
              onChange={(e) => setCampBody(e.target.value)}
            />
          </div>
          <Button type="button" onClick={() => void saveCampaignDraft()}>
            <Send className="mr-2 size-4" />
            Save draft
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscriber?</AlertDialogTitle>
            <AlertDialogDescription>
              They will stop receiving alerts from this scope.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && void remove(deleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
