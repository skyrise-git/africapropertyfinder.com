"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PropertyDetailErrorProps = {
  message?: string;
};

export function PropertyDetailError({ message }: PropertyDetailErrorProps) {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-destructive">
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {message || "Property not found"}
          </p>
          <Link href="/properties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}


