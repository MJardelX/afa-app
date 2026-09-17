"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/ui/toast";

/**
 * Fires a success toast once when the URL carries `?saved=1` (how a Server
 * Action redirects back here after saving), then strips the param so a
 * refresh or back-navigation doesn't retrigger it. Plain `next/navigation`
 * router — this cleanup has no visible destination, so it shouldn't flash
 * the top-loader like a real navigation would.
 */
export function SavedToast({ message }: { message: string }) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (params.get("saved") !== "1" || fired.current) return;
    fired.current = true;
    toast(message);

    const next = new URLSearchParams(params);
    next.delete("saved");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return null;
}
