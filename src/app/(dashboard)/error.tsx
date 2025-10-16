"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Oops, something went wrong!</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        An unexpected error occurred in the dashboard. You can try to refresh the
        page or contact support if the problem persists.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
