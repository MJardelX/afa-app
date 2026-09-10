import {
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  LayoutGrid,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Sidebar section a nav item belongs to. Items with no group are primary. */
export type NavGroup = "manage" | "operate" | "system";

export type NavItem = {
  href: string;
  /** Key under the `nav` messages namespace: `nav.<key>` and `nav.short<Key>`. */
  key:
    | "dashboard"
    | "players"
    | "teams"
    | "attendance"
    | "assessment"
    | "reports"
    | "settings";
  ready: boolean;
  Icon: LucideIcon;
  group?: NavGroup;
};

/** Order the section labels appear in the sidebar. */
export const NAV_GROUPS: NavGroup[] = ["manage", "operate", "system"];

/**
 * Single source for the menu: used by the sidebar and the mobile bottom bar.
 * Guardians and "by category" are tabs inside Players; the audit log is a tab
 * inside Settings — none of them earn a top-level slot.
 */
export const NAVIGATION: NavItem[] = [
  { href: "/", key: "dashboard", ready: true, Icon: LayoutGrid },
  { href: "/players", key: "players", ready: true, Icon: Users, group: "manage" },
  { href: "/teams", key: "teams", ready: true, Icon: Shield, group: "manage" },
  {
    href: "/attendance",
    key: "attendance",
    ready: true,
    Icon: CalendarCheck,
    group: "operate",
  },
  {
    href: "/assessment",
    key: "assessment",
    ready: true,
    Icon: ClipboardList,
    group: "operate",
  },
  {
    href: "/reports",
    key: "reports",
    ready: true,
    Icon: FileBarChart,
    group: "operate",
  },
  {
    href: "/settings",
    key: "settings",
    ready: true,
    Icon: Settings,
    group: "system",
  },
];
