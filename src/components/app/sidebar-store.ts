"use client";

import { useSyncExternalStore } from "react";

/**
 * Desktop sidebar open/closed state. Lives in `<html data-sidebar>` (set by the
 * inline boot script, so there is no flash) and in localStorage. Read with
 * useSyncExternalStore — same pattern as the theme toggle — so the header
 * button and the sidebar itself stay in sync without a context provider.
 */
const KEY = "afa-sidebar";
const EVENT = "afa-sidebar-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.dataset.sidebar !== "closed";
}

const readOnServer = () => true;

export function useSidebarOpen() {
  return useSyncExternalStore(subscribe, read, readOnServer);
}

export function setSidebarOpen(open: boolean) {
  try {
    localStorage.setItem(KEY, open ? "open" : "closed");
  } catch {
    // Private mode: the state still applies for this session via the attribute.
  }
  document.documentElement.dataset.sidebar = open ? "open" : "closed";
  window.dispatchEvent(new Event(EVENT));
}

export function toggleSidebar() {
  setSidebarOpen(!read());
}
