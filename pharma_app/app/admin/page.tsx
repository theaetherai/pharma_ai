import { Suspense, lazy } from "react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
} from "lucide-react";
import { getComprehensiveAnalytics } from "@/lib/analytics-service";
import { Skeleton } from "@/components/ui/skeleton";
import AnalyticsRefresh from "@/components/admin/analytics-refresh";

// Lazy load chart components to improve initial load time
const RevenueChart = lazy(() => import("@/components/admin/analytics/revenue-chart").then(mod => ({ default: mod.RevenueChart })));
const TopSellingDrugs = lazy(() => import("@/components/admin/analytics/top-selling-drugs").then(mod => ({ default: mod.TopSellingDrugs })));
const OrderStatusChart = lazy(() => import("@/components/admin/analytics/order-status-chart").then(mod => ({ default: mod.OrderStatusChart })));
const UserGrowthChart = lazy(() => import("@/components/admin/analytics/user-growth-chart").then(mod => ({ default: mod.UserGrowthChart })));
const RecentTransactions = lazy(() => import("@/components/admin/analytics/recent-transactions").then(mod => ({ default: mod.RecentTransactions })));
const PaymentMethodsChart = lazy(() => import("@/components/admin/analytics/payment-methods-chart").then(mod => ({ default: mod.PaymentMethodsChart })));
const DrugCategoryChart = lazy(() => import("@/components/admin/analytics/drug-category-chart").then(mod => ({ default: mod.DrugCategoryChart })));

// Component loading fallbacks
const ChartFallback = () => <div className="h-80 w-full rounded-md border border-dashed flex items-center justify-center"><Skeleton className="h-64 w-full rounded-md" /></div>;
const CardFallback = () => <div className="h-full w-full rounded-md border border-dashed flex items-center justify-center"><Skeleton className="h-16 w-full rounded-md" /></div>;

// Making the page dynamic to refresh data on each request
export const dynamic = "force-dynamic";

// Loading fallback for analytics section
function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-80 col-span-2" />
        <Skeleton className="h-80" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

// Analytics section
async function AnalyticsSection() {
  try {
    // Get comprehensive analytics data
    const analytics = await getComprehensiveAnalytics();
    
    // Destructure the data
    const {
      dashboardAnalytics,
      revenueTrends,
      topSellingDrugs,
      orderStatusDistribution,
      userGrowth,
      recentTransactions,
      paymentMethodsDistribution,
      drugCategoryDistribution
    } = analytics;

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardAnalytics.totalUsers.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(dashboardAnalytics.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardAnalytics.pendingOrders.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Drugs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardAnalytics.lowStockDrugs.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue and Transactions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<ChartFallback />}>
            <RevenueChart data={revenueTrends} />
          </Suspense>
          <Suspense fallback={<ChartFallback />}>
            <TopSellingDrugs data={topSellingDrugs} />
          </Suspense>
        </div>

        {/* Categories, Orders, Users, and Payments */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          <Suspense fallback={<ChartFallback />}>
            <DrugCategoryChart data={drugCategoryDistribution} />
          </Suspense>
          <div className="grid gap-4 lg:grid-cols-2 lg:col-span-2">
            <Suspense fallback={<ChartFallback />}>
              <OrderStatusChart data={orderStatusDistribution} />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
              <UserGrowthChart data={userGrowth} />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
              <PaymentMethodsChart data={paymentMethodsDistribution} />
            </Suspense>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="grid gap-4">
          <Suspense fallback={<ChartFallback />}>
            <RecentTransactions data={recentTransactions} />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering analytics section:', error);
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h3 className="font-bold">Error Loading Analytics</h3>
        <p>There was a problem loading the analytics dashboard. Please try again later or contact support if the issue persists.</p>
      </div>
    );
  }
}

export default async function AdminDashboard() {
  try {
    // Fetch basic dashboard data for overview cards
    const [
      totalDrugs,
      totalOrders,
      totalPrescriptions,
      lowStockDrugs,
    ] = await Promise.all([
      db.drug.count().catch(() => 0),
      db.order.count().catch(() => 0),
      db.prescription.count().catch(() => 0),
      db.drug.findMany({
        where: {
          stock_quantity: {
            lt: 10, // Low stock threshold
          },
        },
        take: 5,
      }).catch(() => []),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your pharmacy management
            </p>
          </div>
          
          {/* Add refresh component */}
          <AnalyticsRefresh />
        </div>

        {/* Overview Cards Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDrugs}</div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPrescriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Drugs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockDrugs.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Drugs Table */}
        {lowStockDrugs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-4 text-left">Drug Name</th>
                      <th className="p-4 text-left">Current Stock</th>
                      <th className="p-4 text-left">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockDrugs.map((drug) => (
                      <tr key={drug.id} className="border-b">
                        <td className="p-4">{drug.name} {drug.dosage}</td>
                        <td className="p-4">{drug.stock_quantity}</td>
                        <td className="p-4">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(drug.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Analytics Section */}
        <div className="pt-6">
          <h3 className="text-2xl font-bold mb-4">Advanced Analytics</h3>
          <Suspense fallback={<AnalyticsLoading />}>
            <AnalyticsSection />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering admin dashboard:', error);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your pharmacy management
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          <h3 className="font-bold">Error Loading Dashboard</h3>
          <p>There was a problem loading the dashboard data. Basic functionality may still be available.</p>
        </div>
      </div>
    );
  }
} 