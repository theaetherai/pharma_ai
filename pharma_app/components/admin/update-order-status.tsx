"use client";

import { useState } from "react";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UpdateOrderStatusProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusUpdated: () => void;
}

export function UpdateOrderStatus({ 
  orderId, 
  currentStatus, 
  onStatusUpdated 
}: UpdateOrderStatusProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        return ["DELIVERED"]; // Can't change from delivered
      case "CANCELLED":
        return ["CANCELLED"]; // Can't change from cancelled
      default:
        return Object.values(OrderStatus);
    }
  };

  // The status options for the select dropdown
  const statusOptions = getNextStatusOptions(currentStatus);

  // Handle status update
  const handleUpdateStatus = async () => {
    if (status === currentStatus) {
      toast.info("No status change detected");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      toast.success(`Order status updated to ${status}`);
      onStatusUpdated();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-4">
      <h3 className="text-lg font-medium">Update Order Status</h3>
      
      <div className="space-y-2">
        <Label htmlFor="status">New Status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as OrderStatus)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select new status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((statusOption) => (
              <SelectItem key={statusOption} value={statusOption}>
                {statusOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add notes about this status change..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <Button 
        onClick={handleUpdateStatus} 
        disabled={isSubmitting || status === currentStatus}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Status'
        )}
      </Button>
    </div>
  );
} 