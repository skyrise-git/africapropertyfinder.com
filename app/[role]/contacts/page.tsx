"use client";

import { useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { contactService } from "@/lib/services/contact.service";
import type { Contact, ContactStatus } from "@/lib/types/contact.type";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  Search,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAppStore } from "@/hooks/use-app-store";

const statusColors = {
  new: "bg-blue-500",
  read: "bg-yellow-500",
  replied: "bg-green-500",
  archived: "bg-gray-500",
};

const statusLabels = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

export default function ContactsPage() {
  const { user } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">(
    "all"
  );
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { data, loading, error } = useSupabaseRealtime<Contact>("contacts", {
    enabled: !!user,
  });

  const contacts = data ?? [];

  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Filter by search term
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (contact) =>
          contact.name.toLowerCase().includes(term) ||
          contact.email.toLowerCase().includes(term) ||
          contact.subject.toLowerCase().includes(term) ||
          contact.message.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((contact) => contact.status === statusFilter);
    }

    return result;
  }, [contacts, search, statusFilter]);

  const stats = {
    total: contacts.length,
    new: contacts.filter((c) => c.status === "new").length,
    read: contacts.filter((c) => c.status === "read").length,
    replied: contacts.filter((c) => c.status === "replied").length,
    archived: contacts.filter((c) => c.status === "archived").length,
  };

  const handleStatusChange = async (
    contactId: string,
    newStatus: ContactStatus
  ) => {
    setUpdatingStatus(contactId);
    try {
      await contactService.update(contactId, {
        status: newStatus,
        ...(newStatus === "replied" && {
          repliedAt: new Date().toISOString(),
          repliedBy: user?.uid,
        }),
      });
      toast.success("Contact status updated successfully");
    } catch (error) {
      console.error("Error updating contact status:", error);
      toast.error("Failed to update contact status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      await contactService.delete(contactId);
      toast.success("Contact deleted successfully");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error.message || "Failed to load contacts"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-light text-slate-700 dark:text-gray-100 tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">
          Manage and respond to contact form submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.read}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Replied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.replied}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Archived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.archived}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter contact submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, subject..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContactStatus | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Contact Submissions ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No contact submissions yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{contact.name}</h3>
                              <Badge
                                className={`${statusColors[contact.status]} text-white`}
                              >
                                {statusLabels[contact.status]}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(contact.createdAt), {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">
                            {contact.subject}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {contact.message}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={updatingStatus === contact.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {contact.status !== "read" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(contact.id, "read")
                              }
                              disabled={updatingStatus === contact.id}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          {contact.status !== "replied" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(contact.id, "replied")
                              }
                              disabled={updatingStatus === contact.id}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark as Replied
                            </DropdownMenuItem>
                          )}
                          {contact.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(contact.id, "archived")
                              }
                              disabled={updatingStatus === contact.id}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this contact
                                  submission? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(contact.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

