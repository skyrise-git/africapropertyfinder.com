import { AlertTriangle } from "lucide-react";

interface PropertyErrorViewProps {
  error: Error | null;
}

export function PropertyErrorView({ error }: PropertyErrorViewProps) {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">
            Something went wrong
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {error?.message || "Failed to load properties. Please try again."}
        </p>
      </div>
    </div>
  );
}

