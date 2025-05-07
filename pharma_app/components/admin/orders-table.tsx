"use client";

import { useState, useEffect } from "react";
import { Eye, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatus } from "@prisma/client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import OrderDetailsModal from "./order-details-modal";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusUpdateButton } from "./status-update-button";
import { Tooltip } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Order {
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
}

interface PaginationInfo {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

interface OrdersTableProps {
  orders: Order[];
  pagination: PaginationInfo;
}

export function OrdersTable({ orders, pagination }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-refresh functionality
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;
    
    if (autoRefresh) {
      // Reset countdown
      setCountdown(30);
      
      // Set up countdown timer
      countdownTimer = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      // Set up refresh timer
      timer = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(countdownTimer);
    };
  }, [autoRefresh, refreshTrigger]);

  // Handle manual refresh
  const refreshData = () => {
    setIsRefreshing(true);
    router.refresh();
    
    // Reset countdown
    setCountdown(30);
    
    // Simulate refresh completion after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', newSize);
    params.set('page', '1'); // Reset to first page when changing page size
    router.push(`${pathname}?${params.toString()}`);
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-purple-100 text-purple-800";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Open order details modal
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  
  // Handle order status update
  const handleStatusUpdated = () => {
    // Refresh the table by causing a re-render
    setRefreshTrigger(prev => prev + 1);
    
    // Reload the page to get fresh data from the server
    router.refresh();
  };

  return (
    <div className="rounded-md border">
      {/* Table controls */}
      <div className="p-4 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium">Orders List</h3>
          <div className="text-xs text-muted-foreground">
            {pagination.totalRecords} total
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Auto refresh:</span>
                    <button 
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`w-8 h-4 rounded-full transition-colors flex items-center ${
                        autoRefresh ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <span className="block w-3 h-3 bg-white rounded-full mx-0.5"></span>
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto refresh data every 30 seconds</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {autoRefresh && (
              <div className="flex items-center gap-1">
                <Progress value={(countdown / 30) * 100} className="h-1 w-16" />
                <span className="text-xs text-muted-foreground">{countdown}s</span>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1" 
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  {order.user?.name || "Anonymous"}
                  <div className="text-xs text-muted-foreground">{order.user?.email}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {order.payments.length > 0
                    ? formatCurrency(order.payments[0].amount, order.payments[0].currency)
                    : formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2">
                  <StatusUpdateButton 
                    orderId={order.id} 
                    currentStatus={order.status}
                    onStatusUpdated={handleStatusUpdated}
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => viewOrderDetails(order)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {orders.length} of {pagination.totalRecords} orders
          </p>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // Refresh data when modal is closed to show any updates
            router.refresh();
          }}
        />
      )}
    </div>
  );
} 