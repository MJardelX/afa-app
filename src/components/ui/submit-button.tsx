"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Submit button that shows a spinner while the enclosing <form>'s action runs.
 * Must be rendered inside a <form>.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
