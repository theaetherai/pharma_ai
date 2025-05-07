'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";

interface SyncAdminButtonProps {
  userId: string | null;
}

/**
 * Client component that syncs JWT claims with database role
 * This helps fix issues where a user is admin in the database but not in JWT
 */
export default function SyncAdminButton({ userId }: SyncAdminButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const syncAdminRole = async () => {
    if (!userId) return;
    
    try {
      setIsSyncing(true);
      
      // Call our API to check and update admin status
      const response = await fetch('/api/admin-check');
      const data = await response.json();
      
      if (data.syncedJwt) {
        setMessage("Admin role synced. Refreshing page...");
        // Wait a moment to show the message before refreshing
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else if (data.isAdmin) {
        setMessage("Admin role already in sync.");
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("You don't have admin role in the database.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error syncing admin role:", error);
      setMessage("Error syncing admin role");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={syncAdminRole}
        disabled={isSyncing}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? "Syncing..." : "Sync Admin Role"}
      </Button>
      
      {/* Simple toast message */}
      {message && (
        <div className="absolute right-0 mt-2 p-2 bg-black text-white text-sm rounded shadow-lg z-50 min-w-[200px]">
          {message}
        </div>
      )}
    </div>
  );
} 