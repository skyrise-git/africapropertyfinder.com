"use client";

import { ArrowRight, CalendarClock, User2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Property } from "@/lib/types/property.type";
import type { User } from "@/lib/types/user.type";

type PropertyWithExtras = Property & {
  status?: string;
  isBooked?: boolean;
};

type UserWithExtras = User & {
  status?: string;
};

interface RecentSalesTableProps {
  loading: boolean;
  properties: PropertyWithExtras[];
}

export function RecentSalesTable({
  loading,
  properties,
}: RecentSalesTableProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Recent Sale Properties
        </CardTitle>
        <CalendarClock className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sale properties recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[140px] truncate text-xs">
                    {p.title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.city}
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.price ? `₹${p.price.toLocaleString()}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentUsersTableProps {
  loading: boolean;
  users: UserWithExtras[];
}

export function RecentUsersTable({ loading, users }: RecentUsersTableProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
        <User2 className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No users found yet. New signups will appear here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell className="max-w-[120px] truncate text-xs">
                    {u.name}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-xs capitalize">{u.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface BookedPropertiesTableProps {
  loading: boolean;
  properties: PropertyWithExtras[];
}

export function BookedPropertiesTable({
  loading,
  properties,
}: BookedPropertiesTableProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Already Booked Properties
        </CardTitle>
        <ArrowRight className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No booked properties tracked yet. Once you start marking bookings in
            the data (e.g. with an <code>isBooked</code> flag), they&apos;ll
            show up here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[140px] truncate text-xs">
                    {p.title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.city}
                  </TableCell>
                  <TableCell className="text-xs capitalize">
                    {p.status || "booked"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
