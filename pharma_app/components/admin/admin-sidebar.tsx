"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  FileText,
  Settings,
  Bell,
} from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Manage Drugs",
    icon: Pill,
    href: "/admin/drugs",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    href: "/admin/orders",
  },
  {
    label: "Prescriptions",
    icon: FileText,
    href: "/admin/prescriptions",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/admin/notifications",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 py-2">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <div className="flex-1 space-y-1 px-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === route.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent/10"
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  );
} 