import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

export function CartIcon() {
  const { totalItems } = useCart();
  
  return (
    <Link href="/dashboard/pharmacy" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Link>
  );
} 