"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Contact, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function AgentLeadsPage() {
  const { user } = useAppStore();
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    const supabase = createClient();

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((contacts ?? []) as LeadRow[]);
    }
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(t) ||
        r.email.toLowerCase().includes(t) ||
        r.subject.toLowerCase().includes(t)
    );
  }, [rows, search]);

  const statusColor = (s: string) => {
    switch (s) {
      case "new":
        return "default";
      case "read":
        return "secondary";
      case "replied":
        return "outline";
      case "archived":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Contact className="size-6 text-primary" />
            <div>
              <CardTitle className="font-light tracking-tight">
                My Leads
              </CardTitle>
              <CardDescription>
                Inquiries and contacts received through your listings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center">
                        No leads yet. Share your listings to start receiving
                        inquiries.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.email}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {r.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColor(r.status)} className="capitalize">
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
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
    </div>
  );
}
