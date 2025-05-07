"use client";

import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@prisma/client";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StatusUpdateButtonProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusUpdated: () => void;
}

export function StatusUpdateButton({
  orderId,
  currentStatus,
  onStatusUpdated
}: StatusUpdateButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Get the next logical status options based on current status
  const getNextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case "PENDING":
        return ["CONFIRMED", "CANCELLED"];
      case "CONFIRMED":
        return ["PROCESSING", "CANCELLED"];
      case "PROCESSING":
        return ["SHIPPED", "CANCELLED"];
      case "SHIPPED":
        return ["DELIVERED", "CANCELLED"];
      case "DELIVERED":
        return []; // Can't change from delivered
      case "CANCELLED":
        return []; // Can't change from cancelled
      default:
        return Object.values(OrderStatus);
    }
  };

  // The available status options
  const statusOptions = getNextStatusOptions(currentStatus);

  // Status colors for visual indication
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 hover:bg-yellow-50";
      case "CONFIRMED":
        return "text-blue-600 hover:bg-blue-50";
      case "PROCESSING":
        return "text-purple-600 hover:bg-purple-50";
      case "SHIPPED":
        return "text-indigo-600 hover:bg-indigo-50";
      case "DELIVERED":
        return "text-green-600 hover:bg-green-50";
      case "CANCELLED":
        return "text-red-600 hover:bg-red-50";
      default:
        return "";
    }
  };

  // Handle status update
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);

    try {
      const response = await fetch("/api/admin/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          notes: `Status updated to ${newStatus} via quick action`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      toast.success(`Order status updated to ${newStatus}`);
      onStatusUpdated();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isUpdating || statusOptions.length === 0}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              Status
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          disabled
          className="text-xs text-muted-foreground"
        >
          Update to:
        </DropdownMenuItem>
        
        {statusOptions.length === 0 ? (
          <DropdownMenuItem disabled>
            No status changes available
          </DropdownMenuItem>
        ) : (
          statusOptions.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleUpdateStatus(status)}
              className={getStatusColor(status)}
            >
              {status}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 