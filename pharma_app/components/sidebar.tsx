"use client";

import Link from "next/link";
import {
  Bot,
  Calendar,
  ClipboardList,
  Home,
  Pill,
  ShoppingCart,
  Stethoscope,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

export function Sidebar() {
  const pathname = usePathname();
  
  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };
  
  return (
    <motion.div 
      className="w-64 p-4 flex flex-col h-full"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <div className="flex items-center px-2 py-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mr-3">
          <Stethoscope className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-xl">PharmaAI</h1>
          <p className="text-xs text-muted-foreground">AI-powered healthcare</p>
        </div>
      </div>
      
      <nav className="space-y-1 flex-1">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">Main</h2>
          {mainNavItems.map((item, index) => (
            <NavItem 
              key={item.href} 
              item={item} 
              isActive={pathname === item.href}
              variants={itemVariants}
              index={index}
            />
          ))}
        </div>
        
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">Healthcare</h2>
          {secondaryNavItems.map((item, index) => (
            <NavItem 
              key={item.href} 
              item={item} 
              isActive={pathname === item.href}
              variants={itemVariants}
              index={index + mainNavItems.length}
            />
          ))}
        </div>
      </nav>
      
      <div className="mt-auto pt-4">
        <div className="rounded-xl bg-primary/10 p-4">
          <div className="flex items-center mb-2">
            <Stethoscope className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-medium text-sm">Need Help?</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Contact our healthcare professionals for personalized assistance.
          </p>
          <Button size="sm" className="w-full text-xs h-8">Contact Support</Button>
        </div>
      </div>
    </motion.div>
  );
}

function NavItem({ 
  item, 
  isActive, 
  variants,
  index
}: { 
  item: NavItem; 
  isActive: boolean;
  variants: any;
  index: number;
}) {
  return (
    <motion.div
      variants={variants}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Link href={item.href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 mb-1 rounded-lg transition-all font-normal",
            isActive
              ? "bg-primary/10 text-primary"
              : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
          )}
        >
          <span className={cn("mr-3", isActive && "text-primary")}>
            {item.icon}
          </span>
          {item.label}
          {isActive && (
            <motion.div
              layoutId="sidebar-indicator"
              className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary"
              transition={{ type: "spring", duration: 0.5 }}
            />
          )}
        </Button>
      </Link>
    </motion.div>
  );
} 