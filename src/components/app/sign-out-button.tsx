"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, LogOut } from "lucide-react";

/** Bespoke styling doesn't map to a Button variant, so this mirrors SubmitButton by hand. */
export function SignOutButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger-bg hover:text-danger disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" strokeWidth={1.7} />
      )}
      {label}
    </button>
  );
}
