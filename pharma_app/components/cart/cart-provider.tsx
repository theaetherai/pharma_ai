"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface Drug {
  id: string;
  name: string;
  dosage: string;
  form: string;
  price: number;
  stock_quantity: number;
}

interface CartItem {
  id: string;
  drugId: string;
  quantity: number;
  drug: Drug;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  currency: string;
  loading: boolean;
  addToCart: (drugId: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItem: (drugId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.drug.price * item.quantity), 0);
  const currency = "GHS";
  
  // Fetch cart on first load
  useEffect(() => {
    fetchCart();
  }, []);
  
  async function fetchCart() {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      const data = await response.json();
      
      if (data.success) {
        setItems(data.cartItems);
      } else {
        console.error('Failed to fetch cart:', data.message);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // Get a specific cart item by drugId
  function getCartItem(drugId: string): CartItem | undefined {
    return items.find(item => item.drugId === drugId);
  }
  
  async function addToCart(drugId: string, quantity: number) {
    try {
      setLoading(true);
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drugId, quantity }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Item added to cart');
        
        // For the placeholder implementation, manually update the cart state
        // Until the CartItem model is fully implemented
        const existingItemIndex = items.findIndex(item => item.drugId === drugId);
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          setItems(updatedItems);
        } else {
          // If we have item details from the response, add it
          if (data.cartItem) {
            setItems([...items, data.cartItem]);
          } else {
            // Otherwise, refresh the cart to get updated data
            fetchCart();
          }
        }
      } else {
        toast.error(data.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  }
  
  async function updateQuantity(cartItemId: string, quantity: number) {
    try {
      setLoading(true);
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (quantity === 0) {
          toast.success('Item removed from cart');
          // Remove item locally
          setItems(items.filter(item => item.id !== cartItemId));
        } else {
          toast.success('Cart updated');
          // Update item locally
          const updatedItems = items.map(item => 
            item.id === cartItemId 
              ? { ...item, quantity } 
              : item
          );
          setItems(updatedItems);
        }
      } else {
        toast.error(data.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    } finally {
      setLoading(false);
    }
  }
  
  async function removeFromCart(cartItemId: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/cart/remove?id=${cartItemId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Item removed from cart');
        // Remove item locally
        setItems(items.filter(item => item.id !== cartItemId));
      } else {
        toast.error(data.message || 'Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  }
  
  async function clearCart() {
    // For now, we'll just clear the local state
    setItems([]);
    toast.success('Cart cleared');
  }
  
  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        currency,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 