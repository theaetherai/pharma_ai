"use client";

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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PharmacyPage() {
  // Sample order data
  const orderHistory = [
    {
      id: "ORD-123456",
      date: "Jul 12, 2025",
      total: 29.99,
      status: "delivered",
      items: [
        { name: "Amoxicillin", quantity: 1, price: 14.99 },
        { name: "Ibuprofen", quantity: 2, price: 7.50 },
      ],
      deliveryAddress: "123 Main St, Apt 4B, New York, NY 10001",
      trackingNumber: "TRK-987654",
    },
    {
      id: "ORD-123457",
      date: "Jun 28, 2025",
      total: 42.50,
      status: "delivered",
      items: [
        { name: "Lisinopril", quantity: 1, price: 12.50 },
        { name: "Cetirizine", quantity: 3, price: 9.99 },
      ],
      deliveryAddress: "123 Main St, Apt 4B, New York, NY 10001",
      trackingNumber: "TRK-876543",
    },
    {
      id: "ORD-123458",
      date: "Aug 05, 2025",
      total: 34.75,
      status: "processing",
      items: [
        { name: "Metformin", quantity: 1, price: 16.75 },
        { name: "Vitamin D", quantity: 2, price: 8.99 },
      ],
      deliveryAddress: "123 Main St, Apt 4B, New York, NY 10001",
      trackingNumber: "TRK-765432",
    },
  ];

  // Sample cart data
  const cart = [
    { name: "Vitamin C", quantity: 1, price: 12.99, prescription: false },
    { name: "Multivitamin", quantity: 1, price: 16.50, prescription: false },
  ];

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
              <TabsTrigger value="cart">Cart ({cart.length})</TabsTrigger>
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
              
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="cart" className="space-y-8">
              {cart.length === 0 ? (
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
                        {cart.map((item, index) => (
                          <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Pill className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </div>
                                {item.prescription && (
                                  <Badge variant="outline" className="mt-1">
                                    Prescription Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${item.price.toFixed(2)}</div>
                              <Button variant="ghost" size="sm" className="text-red-500 h-7 px-2 text-xs">
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
                          ${cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <Button variant="outline">Continue Shopping</Button>
                        <Button>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Checkout
                        </Button>
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
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
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
                ${order.total.toFixed(2)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-medium mb-2">Items:</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>{item.name} x{item.quantity}</div>
                    <div>${item.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t mt-3">
                <div className="flex items-start text-sm">
                  <Truck className="h-4 w-4 mr-2 text-muted-foreground mt-1" />
                  <div>
                    <div className="font-medium">Delivery Address:</div>
                    <div className="text-muted-foreground">{order.deliveryAddress}</div>
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
            <Button variant="outline" size="sm">
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