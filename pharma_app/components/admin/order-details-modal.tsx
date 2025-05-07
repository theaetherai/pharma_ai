"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { OrderStatus } from "@prisma/client";
import { PackageCheck, MapPin, CreditCard, Truck, ClipboardList, RefreshCw } from "lucide-react";
import { UpdateOrderStatus } from "./update-order-status";
import { getOrderDetails } from "@/lib/order-service";
import { Button } from "@/components/ui/button";

interface OrderDetailsProps {
  order: {
    id: string;
    status: OrderStatus;
    total: number;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
    } | null;
    payments: {
      reference: string;
      amount: number;
      currency: string;
      transactionDate?: Date;
      paymentMethod?: string;
    }[];
    items: {
      id: string;
      quantity: number;
      price: number;
      drug: {
        name: string;
        dosage: string;
        form: string;
      };
    }[];
    address: {
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    statusLogs?: {
      id: string;
      status: OrderStatus;
      notes?: string | null;
      createdAt: Date;
    }[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order: initialOrder, isOpen, onClose }: OrderDetailsProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("items");

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Refresh order data
  const refreshOrderData = async () => {
    setIsRefreshing(true);
    try {
      const updatedOrder = await getOrderDetails(order.id);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Error refreshing order:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshOrderData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4">
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-medium">{order.id}</p>
              <p className="text-sm text-muted-foreground mt-2">Date</p>
              <p className="font-medium">
                {format(new Date(order.createdAt), "PPP")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{order.status}</p>
              <p className="text-sm text-muted-foreground mt-2">Customer</p>
              <p className="font-medium">{order.user?.name || "Unknown"}</p>
              <p className="text-sm">{order.user?.email}</p>
            </div>
          </div>

          <Tabs defaultValue="items" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="items">
                <PackageCheck className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Items</span>
              </TabsTrigger>
              <TabsTrigger value="address">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Address</span>
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Payment</span>
              </TabsTrigger>
              <TabsTrigger value="history">
                <ClipboardList className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="status">
                <Truck className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Update</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="pt-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-3 px-3 text-left text-sm font-medium">Product</th>
                      <th className="py-3 px-3 text-left text-sm font-medium">Quantity</th>
                      <th className="py-3 px-3 text-right text-sm font-medium">Price</th>
                      <th className="py-3 px-3 text-right text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <div className="font-medium">{item.drug.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.drug.dosage} {item.drug.form}
                          </div>
                        </td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20">
                      <td colSpan={3} className="p-3 text-right font-medium">
                        Order Total:
                      </td>
                      <td className="p-3 font-bold">
                        {formatCurrency(
                          order.total,
                          order.payments[0]?.currency || "USD"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="address" className="pt-4">
              <div className="rounded-md border p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    Shipping Address
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p>{order.user?.name}</p>
                    <p>{order.address.addressLine1}</p>
                    {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                    <p>
                      {order.address.city}, {order.address.state} {order.address.postalCode}
                    </p>
                    <p>{order.address.country}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-primary" />
                    Delivery Status
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                    <p className="font-medium">{order.status}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="payment" className="pt-4">
              <div className="rounded-md border p-4 space-y-4">
                {order.payments.length > 0 ? (
                  order.payments.map((payment) => (
                    <div key={payment.reference}>
                      <h3 className="text-lg font-medium flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-primary" />
                        Payment Information
                      </h3>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Reference:</span>
                          <span className="font-mono">{payment.reference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount:</span>
                          <span>{formatCurrency(payment.amount, payment.currency)}</span>
                        </div>
                        {payment.paymentMethod && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Method:</span>
                            <span>{payment.paymentMethod}</span>
                          </div>
                        )}
                        {payment.transactionDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Date:</span>
                            <span>{format(new Date(payment.transactionDate), "PPP")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment information available
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <ClipboardList className="h-5 w-5 mr-2 text-primary" />
                  Order Status History
                </h3>
                {order.statusLogs && order.statusLogs.length > 0 ? (
                  <div className="space-y-4">
                    {order.statusLogs.map((log) => (
                      <div key={log.id} className="flex">
                        <div className="mr-4 h-full">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          {/* Line connecting to next item */}
                          <div className="w-0.5 h-full bg-border mx-auto"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex justify-between">
                            <p className="font-medium">{log.status}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(log.createdAt), "PPp")}
                            </p>
                          </div>
                          {log.notes && <p className="text-sm mt-1">{log.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No status history available
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="status" className="pt-4">
              <UpdateOrderStatus 
                orderId={order.id}
                currentStatus={order.status}
                onStatusUpdated={refreshOrderData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 