"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bot,
  Calendar,
  ClipboardList,
  Home,
  Menu,
  Pill,
  ShoppingCart,
  Stethoscope,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    href: "/dashboard/chat",
    label: "AI Consultation",
    icon: <Bot className="h-5 w-5" />,
  },
  {
    href: "/dashboard/appointments",
    label: "Appointments",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    href: "/dashboard/prescriptions",
    label: "Prescriptions",
    icon: <ClipboardList className="h-5 w-5" />,
  },
];

const secondaryNavItems: NavItem[] = [
  {
    href: "/dashboard/medications",
    label: "Medications",
    icon: <Pill className="h-5 w-5" />,
  },
  {
    href: "/dashboard/doctors",
    label: "Doctors",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    href: "/dashboard/pharmacy",
    label: "Pharmacy",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: <User className="h-5 w-5" />,
  },
];

export function SidebarMobile() {
  const pathname = usePathname();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mr-3">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <SheetTitle className="text-xl">PharmaAI</SheetTitle>
          </div>
        </SheetHeader>
        <div className="px-4 py-6">
          <AnimatePresence>
            <div className="space-y-6">
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
                  Main
                </h2>
                <div className="space-y-1">
                  {mainNavItems.map((item, i) => (
                    <MobileNavItem
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      index={i}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
                  Healthcare
                </h2>
                <div className="space-y-1">
                  {secondaryNavItems.map((item, i) => (
                    <MobileNavItem
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            </div>
          </AnimatePresence>
          
          <div className="mt-8 pt-4 border-t">
            <div className="rounded-xl bg-primary/10 p-4">
              <div className="flex items-center mb-2">
                <Stethoscope className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-medium text-sm">Need Help?</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Contact our healthcare professionals for assistance.
              </p>
              <Button size="sm" className="w-full text-xs h-8">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavItem({
  item,
  isActive,
  index,
}: {
  item: NavItem;
  isActive: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Link href={item.href}>
        <div
          className={cn(
            "flex items-center h-10 px-3 rounded-lg transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
          )}
        >
          <span className="mr-3">{item.icon}</span>
          <span className="font-medium text-sm">{item.label}</span>
          {isActive && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
} 