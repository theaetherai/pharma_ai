"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface NotificationFilterTabsProps {
  includeRead: boolean;
}

export function NotificationFilterTabs({ includeRead }: NotificationFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleAllClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('includeRead', 'true');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const handleUnreadClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('includeRead', 'false');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };
  
  return (
    <TabsList>
      <TabsTrigger 
        value="all"
        onClick={handleAllClick}
      >
        All
      </TabsTrigger>
      <TabsTrigger 
        value="unread"
        onClick={handleUnreadClick}
      >
        Unread
      </TabsTrigger>
    </TabsList>
  );
} 