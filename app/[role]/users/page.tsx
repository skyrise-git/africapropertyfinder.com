"use client";

import {
  Building2,
  CheckCircle,
  Clock,
  Plus,
  Shield,
  Upload,
  Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getArrFromObj } from "@ashirbad/js-core";
import { mutate } from "@atechhub/firebase";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { User } from "@/lib/types/user.type";

async function fetchAllUsers(): Promise<User[]> {
  const data = await mutate({
    action: "get",
    path: "users",
  });
  const allUsers = getArrFromObj(data || {}) as unknown as User[];
  return allUsers;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<
    "active" | "inactive" | null
  >(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter((u) => u.status === "active").length,
    pending: filteredUsers.filter((u) => u.status === "pending").length,
    inactive: filteredUsers.filter((u) => u.status === "inactive").length,
  };

  const allVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedIds.has(u.uid));

  const handleToggleAll = (checked: boolean | string) => {
    const next = new Set(selectedIds);
    if (checked) {
      filteredUsers.forEach((u) => next.add(u.uid));
    } else {
      filteredUsers.forEach((u) => next.delete(u.uid));
    }
    setSelectedIds(next);
  };

  const handleToggleOne = (id: string, checked: boolean | string) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const selectedUsers = filteredUsers.filter((u) => selectedIds.has(u.uid));
  const selectedCounts = {
    total: selectedUsers.length,
    active: selectedUsers.filter((u) => u.status === "active").length,
    inactive: selectedUsers.filter((u) => u.status === "inactive").length,
  };

  const handleBulkStatusChange = async (status: "active" | "inactive") => {
    if (selectedIds.size === 0) return;
    setUpdatingStatus(status);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          mutate({
            action: "update",
            path: `users/${id}`,
            data: { status },
            actionBy: "admin",
          })
        )
      );

      setUsers((prev) =>
        prev.map((user) =>
          selectedIds.has(user.uid) ? { ...user, status } : user
        )
      );
    } catch (err) {
      console.error("Error updating user status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full sm:w-96" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={loadUsers}
              className="text-blue-600 underline hover:text-blue-800"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="flex h-24 flex-col justify-between rounded-2xl border-border/60 bg-muted/40 px-3 py-2 sm:h-28 sm:px-4 sm:py-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Total Users
            </CardTitle>
            <Building2 className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="text-xl font-bold sm:text-2xl">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All user accounts</p>
          </CardContent>
        </Card>

        <Card className="flex h-24 flex-col justify-between rounded-2xl border-transparent bg-emerald-50 px-3 py-2 sm:h-28 sm:px-4 sm:py-3 dark:bg-emerald-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Active
            </CardTitle>
            <CheckCircle className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="text-xl font-bold text-green-600 sm:text-2xl">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="flex h-24 flex-col justify-between rounded-2xl border-transparent bg-yellow-50 px-3 py-2 sm:h-28 sm:px-4 sm:py-3 dark:bg-yellow-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Pending
            </CardTitle>
            <Clock className="h-3 w-3 text-yellow-600 sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="text-xl font-bold text-yellow-600 sm:text-2xl">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="flex h-24 flex-col justify-between rounded-2xl border-transparent bg-slate-50 px-3 py-2 sm:h-28 sm:px-4 sm:py-3 dark:bg-slate-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Inactive
            </CardTitle>
            <Shield className="h-3 w-3 text-gray-600 sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="text-xl font-bold text-gray-600 sm:text-2xl">
              {stats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">Disabled accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Search bar */}
      <Card className="border-border/70">
        <CardContent className="p-3 sm:p-4">
          <Input
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />
        </CardContent>
      </Card>

      {/* Selection toolbar */}
      {selectedCounts.total > 0 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border/70 bg-background px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center">
          <span className="font-medium">{selectedCounts.total} selected</span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
              disabled={updatingStatus !== null}
              onClick={() => handleBulkStatusChange("active")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
            <Button
              size="sm"
              className="bg-rose-500 text-white hover:bg-rose-600"
              disabled={updatingStatus !== null}
              onClick={() => handleBulkStatusChange("inactive")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                {stats.total} of {users.length} users
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add user
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">
                    <Checkbox
                      aria-label="Select all users"
                      checked={allVisibleSelected}
                      onCheckedChange={handleToggleAll}
                    />
                  </th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Checkbox
                        aria-label={`Select ${user.name}`}
                        checked={selectedIds.has(user.uid)}
                        onCheckedChange={(checked) =>
                          handleToggleOne(user.uid, checked)
                        }
                      />
                    </td>
                    <td className="py-2 pr-4">{user.name}</td>
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4 capitalize">{user.role}</td>
                    <td className="py-2 pr-4 capitalize">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
