"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Props = {
  agentId: string;
  agentName: string;
};

export function AgentSubscribeForm({ agentId, agentName }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Please enter your email.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("email_subscribers").insert({
      email: trimmed,
      agent_id: agentId,
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        toast.info("You are already subscribed.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("You are subscribed to new listings from this agent.");
    setEmail("");
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-medium text-slate-700 dark:text-gray-100">
        Subscribe to new listings from {agentName}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        We will email you when this agent publishes new properties. You can
        unsubscribe anytime.
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          autoComplete="email"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Subscribe"}
        </Button>
      </form>
    </div>
  );
}
