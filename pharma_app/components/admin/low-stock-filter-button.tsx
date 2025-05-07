"use client";

import { Button } from "@/components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface LowStockFilterButtonProps {
  lowStock: boolean;
}

export function LowStockFilterButton({ lowStock }: LowStockFilterButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (lowStock) {
      params.delete('lowStock');
    } else {
      params.set('lowStock', 'true');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };
  
  return (
    <Button
      variant={lowStock ? "default" : "outline"}
      onClick={handleClick}
    >
      Low Stock Only
    </Button>
  );
} 