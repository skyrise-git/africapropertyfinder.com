import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface PolicyCardProps {
  title: string;
  children: React.ReactNode;
}

export function PolicyCard({ title, children }: PolicyCardProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
