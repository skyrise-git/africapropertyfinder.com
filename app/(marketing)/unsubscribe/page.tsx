"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnsubscribePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "bad">(
    "idle"
  );

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) {
        setStatus("bad");
        return;
      }
      setStatus("loading");
      const supabase = createClient();
      const { data, error } = await supabase.rpc("unsubscribe_email_by_token", {
        p_token: token,
      });
      if (error) {
        setStatus("bad");
        return;
      }
      setStatus(data === true ? "ok" : "bad");
    };
    void run();
  }, []);

  return (
    <div className="container mx-auto max-w-lg py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-light">Email alerts</CardTitle>
          <CardDescription>
            {status === "loading" && "Processing…"}
            {status === "ok" && "You have been unsubscribed from listing alerts."}
            {status === "bad" &&
              "We could not process this link. It may be invalid or already used."}
            {status === "idle" && "Loading…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
