"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  CreditCard,
  Home,
  Package,
  Pill,
  Search,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Loader2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/components/cart/cart-provider";
import { useUser } from "@clerk/nextjs";
import { PaystackButton } from "@/components/paystack-button";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Define interfaces for OrderItem and Order
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  prescription?: boolean;
}

// Define the Address type based on what getFullAddress expects and what backend provides
interface Address {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  // Add any other fields that might come from order.address
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
  address?: Address | null; // Changed from deliveryAddress: string
  trackingNumber?: string;
  currency?: string;
}

// Helper function to construct full address string - moved to PharmacyPage scope
const getFullAddress = (address: Address | null | undefined) => {
  if (!address) return "No address provided";
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean); // Filter out null/undefined/empty strings
  return parts.join(", ") || "No address details";
};

export default function PharmacyPage() {
  // Use cart provider instead of hardcoded data
  const { items, totalItems, totalPrice, currency, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useUser();
  
  // State for address and checkout
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);
  const [orderPaymentComplete, setOrderPaymentComplete] = useState(false);
  const [orderIdempotencyKey, setOrderIdempotencyKey] = useState<string | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  
  // State for orders
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Shipping cost
  const SHIPPING_COST = 5.00;
  
  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        setOrderError(null);
        
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error(`Error fetching orders: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.orders) {
          // Format the orders to match our display format
          const formattedOrders = data.orders.map((order: any) => ({
            id: order.id,
            date: new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric', 
              year: 'numeric'
            }),
            total: order.total,
            status: order.status.toLowerCase(),
            items: order.items.map((item: any) => ({
              name: item.drug.name,
              quantity: item.quantity,
              price: item.price
            })),
            address: order.address, // Pass the whole address object
            trackingNumber: order.trackingNumber || `TRK-${order.id.substring(0, 6)}`,
            currency: order.currency || "GHS"
          }));
          
          setOrderHistory(formattedOrders);
        } else {
          // If no orders, set empty array
          setOrderHistory([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrderError('Failed to load your order history. Please try again later.');
        // Set fallback empty array
        setOrderHistory([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  // Check for existing payment session on mount
  useEffect(() => {
    const storedOrderId = sessionStorage.getItem('pharma-order-id');
    const storedIdempotencyKey = sessionStorage.getItem('pharma-idempotency-key');
    const storedPaymentComplete = sessionStorage.getItem('pharma-payment-complete');
    
    if (storedOrderId) {
      setLatestOrderId(storedOrderId);
      setOrderPlaced(true);
    }
    
    if (storedIdempotencyKey) {
      setOrderIdempotencyKey(storedIdempotencyKey);
    }
    
    if (storedPaymentComplete === 'true') {
      setOrderPaymentComplete(true);
    }
  }, []);
  
  // Validate address when it changes
  useEffect(() => {
    setIsAddressValid(deliveryAddress.trim().length > 0);
  }, [deliveryAddress]);
  
  // Open checkout modal
  const openCheckoutModal = () => {
    // Don't allow opening checkout if payment is already complete
    if (orderPaymentComplete) {
      toast.info("Your order has already been paid for. You can view order details instead.");
      viewOrderDetails();
      return;
    }
    
    // Generate idempotency key for this order if none exists
    if (!orderIdempotencyKey) {
      // Create a UUID-like string for idempotency
      const newKey = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setOrderIdempotencyKey(newKey);
      sessionStorage.setItem('pharma-idempotency-key', newKey);
    }
    
    setCheckoutOpen(true);
  };
  
  // View order details for the most RECENTLY PLACED order (uses latestOrderId)
  const viewOrderDetails = () => {
    if (!latestOrderId) {
      toast.error("Order details not available for the most recent order.");
      return;
    }
    setSelectedOrderForDetails(null); // Clear any individually selected order
    setCheckoutOpen(true);
  };

  // Handler for when 'View Details' is clicked on an individual OrderCard
  const handleViewOrderDetailsFromCard = (orderToView: Order) => {
    setSelectedOrderForDetails(orderToView);
    setCheckoutOpen(true);
  };
  
  // Handle payment success
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Check if this was an offline payment that was queued
      if (paymentData.isOffline) {
        toast.success("Your payment will be processed when your connection is restored.");
        setCheckoutOpen(false);
        return;
      }
      
      // For successfully processed payments, continue with normal flow
      console.log('Payment successful:', paymentData);
      
      // Save the order ID for later use
      if (paymentData.order?.id) {
        setLatestOrderId(paymentData.order.id);
        // Store order ID in sessionStorage to prevent duplicate payments
        sessionStorage.setItem('pharma-order-id', paymentData.order.id);
      }
      
      // Update status
      setOrderPlaced(true);
      setOrderPaymentComplete(true);
      
      // Store payment completion in sessionStorage
      sessionStorage.setItem('pharma-payment-complete', 'true');
      
      // Close checkout
      setCheckoutOpen(false);
      
      // Clear cart after successful payment
      clearCart();
      
      // Show success notification
      toast.success(`Order #${paymentData.order?.id || 'pending'} has been successfully placed!`);
      
      // Refresh orders to show the new order
      window.location.reload();
      
    } catch (error) {
      console.error('Error handling payment success:', error);
      toast.error("There was an error processing your payment result. Please contact support.");
    }
  };

  return (
    <div className="w-full h-full dashboard-scroll-content">
      <div className="dashboard-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Pharmacy</h1>
              <p className="text-muted-foreground">
                Order medications and view your order history
              </p>
            </div>
            <Button asChild>
              <a href="/dashboard/medications">
                <Pill className="mr-2 h-4 w-4" />
                Browse Medications
              </a>
            </Button>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="mb-4">
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="cart">Cart ({totalItems})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="space-y-8">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading your orders...</span>
                </div>
              ) : orderError ? (
                <div className="text-center py-12">
                  <p className="text-destructive mb-4">{orderError}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't placed any orders yet. Browse medications to get started.
                  </p>
                  <Button asChild>
                    <a href="/dashboard/medications">Browse Medications</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <OrderCard key={order.id} order={order} onViewDetails={handleViewOrderDetailsFromCard} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cart" className="space-y-8">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse our medications and add items to your cart.
                  </p>
                  <Button asChild>
                    <a href="/dashboard/medications">
                      Browse Medications
                    </a>
                  </Button>
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Cart</CardTitle>
                      <CardDescription>Review your items before checkout</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Pill className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{item.drug.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.drug.dosage}, {item.drug.form}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">GH₵{(item.drug.price * item.quantity).toFixed(2)}</div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 h-7 px-2 text-xs"
                                onClick={() => removeFromCart(item.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <div className="w-full flex justify-between items-center pb-4 border-b">
                        <div className="font-medium">Subtotal</div>
                        <div className="font-medium">
                          GH₵{totalPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <Button variant="outline" asChild>
                          <a href="/dashboard/medications">Continue Shopping</a>
                        </Button>
                        <PaystackButton
                          amount={totalPrice + SHIPPING_COST}
                          email={user?.primaryEmailAddress?.emailAddress || ""}
                          className="w-auto"
                          disabled={items.length === 0 || loading}
                          cart={items.map(item => ({
                            drugId: item.drugId,
                            quantity: item.quantity,
                            price: item.drug.price,
                            name: item.drug.name,
                            dosage: item.drug.dosage,
                            form: item.drug.form
                          }))}
                          deliveryAddress=""
                          idempotencyKey={orderIdempotencyKey}
                          onSuccess={handlePaymentSuccess}
                          onCancel={() => {
                            toast.error('Payment cancelled');
                          }}
                        >
                          <Button disabled={items.length === 0 || loading}>
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Checkout (GH₵{(totalPrice + SHIPPING_COST).toFixed(2)})
                              </>
                            )}
                          </Button>
                        </PaystackButton>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Delivery Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3 p-3 border rounded-md bg-muted/20">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Home Delivery</div>
                          <div className="text-sm text-muted-foreground">
                            123 Main St, Apt 4B, New York, NY 10001
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          2-3 Days
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 border rounded-md">
                        <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Pharmacy Pickup</div>
                          <div className="text-sm text-muted-foreground">
                            PharmaAI Store, 456 Health St, New York, NY 10002
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          Same Day
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      
      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={(isOpen) => { setCheckoutOpen(isOpen); if (!isOpen) setSelectedOrderForDetails(null); /* Clear selected order when dialog closes */ }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-primary/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="text-lg flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                {selectedOrderForDetails
                  ? `Order #${selectedOrderForDetails.id} Details`
                  : orderPlaced
                  ? `Order #${latestOrderId} Details`
                  : 'Checkout'}
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => { setCheckoutOpen(false); setSelectedOrderForDetails(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {selectedOrderForDetails
                ? `Details for your order placed on ${selectedOrderForDetails.date}`
                : "Complete your purchase of medications"}
            </DialogDescription>
          </div>

          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-medium mb-3">Order Summary</h3>
            
            <div className="border rounded-md divide-y mb-6">
              {(selectedOrderForDetails ? selectedOrderForDetails.items : items).map((item: any, index: number) => (
                <div key={selectedOrderForDetails ? item.name + index : item.id} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{selectedOrderForDetails ? item.name : item.drug.name}</div>
                    {selectedOrderForDetails ? (
                      <div className="text-xs text-muted-foreground">
                        Price: GH₵{item.price?.toFixed(2)}, Quantity: {item.quantity}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {item.drug.dosage}, {item.drug.form} <br />
                        Quantity: {item.quantity}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">GH₵{(selectedOrderForDetails ? (item.price * item.quantity) : (item.drug.price * item.quantity)).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">GH₵{selectedOrderForDetails ? selectedOrderForDetails.total.toFixed(2) : totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping:</span>
                {/* Assuming shipping is constant or part of selectedOrderForDetails.total if it was applied */}
                <span className="font-medium">GH₵{SHIPPING_COST.toFixed(2)}</span> 
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>Total:</span>
                {/* For selectedOrder, total already includes everything. For cart, we add shipping. */}
                <span>GH₵{selectedOrderForDetails ? selectedOrderForDetails.total.toFixed(2) : (totalPrice + SHIPPING_COST).toFixed(2)}</span>
              </div>
            </div>
            
            {/* Delivery Address Section */}
            {selectedOrderForDetails ? (
              <div className="space-y-2 mb-6">
                <Label>Delivery Address</Label>
                <div className="p-3 border rounded-md bg-muted/10 text-sm text-muted-foreground">
                  {getFullAddress(selectedOrderForDetails.address)}
                </div>
              </div>
            ) : (
              // Show input field only if it's a new checkout
              <div className="space-y-2 mb-6">
                <Label htmlFor="delivery-address">Delivery Address</Label>
                <Input
                  id="delivery-address"
                  placeholder="Enter your delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full" 
                />
                {!isAddressValid && deliveryAddress.length > 0 && (
                  <p className="text-xs text-destructive">Please enter a valid delivery address</p>
                )}
              </div>
            )}

            {/* Action Buttons: Show only if NOT viewing details of an existing order AND payment is not complete */}
            {!selectedOrderForDetails && (
              <div className="flex flex-col sm:flex-row gap-3">
                <PaystackButton
                  amount={totalPrice + SHIPPING_COST}
                  email={user?.primaryEmailAddress?.emailAddress || ""}
                  className="flex-1"
                  disabled={!isAddressValid || orderPaymentComplete || loading}
                  cart={items.map(item => ({
                    drugId: item.drugId,
                    quantity: item.quantity,
                    price: item.drug.price,
                    name: item.drug.name,
                    dosage: item.drug.dosage,
                    form: item.drug.form
                  }))}
                  deliveryAddress={deliveryAddress}
                  idempotencyKey={orderIdempotencyKey}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => {
                    setCheckoutOpen(false);
                    toast.error('Payment cancelled');
                  }}
                  onCloseCheckout={() => {setCheckoutOpen(false); setSelectedOrderForDetails(null);}}
                >
                  <Button
                    className="w-full"
                    disabled={!isAddressValid || orderPaymentComplete || loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </div>
                    ) : orderPaymentComplete ? (
                      "Payment Complete"
                    ) : (
                      `Pay GH₵${(totalPrice + SHIPPING_COST).toFixed(2)}`
                    )}
                  </Button>
                </PaystackButton>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({ order, onViewDetails }: { order: Order; onViewDetails: (order: Order) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border shadow-sm overflow-hidden">
        <div className="relative">
          <div className={`absolute top-0 left-0 w-full h-1 ${
            order.status === "delivered" 
              ? "bg-gradient-to-r from-green-400 to-teal-500" 
              : "bg-gradient-to-r from-yellow-400 to-orange-500"
          }`} />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">{order.id}</CardTitle>
                  <Badge variant={order.status === "delivered" ? "outline" : "default"} className={
                    order.status === "delivered" 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : ""
                  }>
                    {order.status === "delivered" ? "Delivered" : "Processing"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {order.date}
                </CardDescription>
              </div>
              <div className="text-lg font-semibold text-primary">
                GH₵{order.total.toFixed(2)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-medium mb-2">Items:</h4>
              <div className="space-y-2">
                {order.items.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>{item.name} x{item.quantity}</div>
                    <div>GH₵{item.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t mt-3">
                <div className="flex items-start text-sm">
                  <Truck className="h-4 w-4 mr-2 text-muted-foreground mt-1" />
                  <div>
                    <div className="font-medium">Delivery Address:</div>
                    <div className="text-muted-foreground">{getFullAddress(order.address)}</div>
                  </div>
                </div>
                
                {order.status === "delivered" && (
                  <div className="flex items-center text-sm mt-2">
                    <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Tracking: {order.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>
              View Details
            </Button>
            {order.status === "delivered" && (
              <Button size="sm">
                Reorder
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
} 