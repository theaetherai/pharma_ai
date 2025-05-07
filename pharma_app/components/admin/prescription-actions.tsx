"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PrescriptionActionsProps {
  prescriptionId: string;
}

export function PrescriptionActions({ prescriptionId }: PrescriptionActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleApprove = async () => {
    if (confirm("Are you sure you want to approve this prescription?")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/prescriptions/${prescriptionId}/approve`, {
          method: 'POST',
        });
        
        if (response.ok) {
          router.refresh();
        } else {
          alert("Failed to approve prescription");
        }
      } catch (error) {
        console.error("Error approving prescription:", error);
        alert("An error occurred while approving the prescription");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleReject = async () => {
    if (confirm("Are you sure you want to reject this prescription?")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/prescriptions/${prescriptionId}/reject`, {
          method: 'POST',
        });
        
        if (response.ok) {
          router.refresh();
        } else {
          alert("Failed to reject prescription");
        }
      } catch (error) {
        console.error("Error rejecting prescription:", error);
        alert("An error occurred while rejecting the prescription");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="flex space-x-2">
      <button 
        className="text-green-500 hover:text-green-700 cursor-pointer disabled:opacity-50"
        onClick={handleApprove}
        disabled={isLoading}
      >
        <Check className="h-4 w-4" />
      </button>
      <button 
        className="text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50"
        onClick={handleReject}
        disabled={isLoading}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
} 