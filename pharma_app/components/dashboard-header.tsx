"use client";

import { Bell, Menu, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserButton } from "@clerk/nextjs";
import { Notifications } from "@/components/notifications";
import { useCart } from "@/components/cart/cart-provider";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function DashboardHeader() {
  const { totalItems } = useCart();
  
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="md:hidden">
            {/* Mobile nav content */}
          </SheetContent>
        </Sheet>
        
        <div className="ml-auto flex items-center gap-4">
          <form className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] md:w-[300px] pl-8 bg-background"
            />
          </form>
          
          <Link href="/dashboard/pharmacy" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center p-0 text-[10px] font-medium"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </Badge>
              )}
            </Button>
          </Link>
          
          <Notifications />
          
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
} 