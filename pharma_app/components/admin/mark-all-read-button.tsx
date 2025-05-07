"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function MarkAllReadButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/notifications/mark-all-read", {
        method: "POST",
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to mark notifications as read",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleMarkAllRead}
      disabled={isLoading}
    >
      {isLoading ? "Processing..." : "Mark All as Read"}
    </Button>
  );
} 