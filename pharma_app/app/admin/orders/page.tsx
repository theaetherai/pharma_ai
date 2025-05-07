import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Info, Eye } from "lucide-react";
import Link from "next/link";
import { OrdersTable } from "@/components/admin/orders-table";
import { getOrdersWithPagination } from "@/lib/order-service";

// Making the page dynamic to refresh data on each request
export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable caching completely

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; status?: string };
}) {
  // Parse pagination parameters
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const status = searchParams.status;
  
  // Get orders with pagination using the service function
  const { orders, pagination } = await getOrdersWithPagination({
    page,
    limit,
    status,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Get order statistics
  const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: 'PENDING' } }),
    db.order.count({ where: { status: 'DELIVERED' } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">
          View and manage customer orders
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Orders
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>
      </div>

      <OrdersTable orders={orders} pagination={pagination} />
    </div>
  );
} 