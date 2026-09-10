import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Inline result banner for a form driven by useActionState. Render it when the
 * action returns an `error` or `success` message.
 */
export function FormBanner({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;

  const isError = Boolean(error);

  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 ring-inset",
        isError
          ? "bg-danger-bg text-danger ring-danger/25"
          : "bg-status-good-bg text-status-good-fg ring-status-good/25",
      )}
    >
      {isError ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      ) : (
        <CircleCheck className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      )}
      {error || success}
    </p>
  );
}
