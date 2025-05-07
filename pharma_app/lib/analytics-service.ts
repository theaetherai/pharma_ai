import { db } from '@/lib/db';
import { getOrFetchCached, invalidateCachePattern } from '@/lib/cache';
import { Prisma } from '@prisma/client';
import { formatISO, subDays, startOfDay, endOfDay, format } from 'date-fns';

// Cache keys
const CACHE_KEYS = {
  DASHBOARD_ANALYTICS: 'dashboard:analytics',
  REVENUE_TRENDS: (days: number) => `analytics:revenue:${days}days`,
  TOP_SELLING_DRUGS: 'analytics:top_selling_drugs',
  ORDER_STATUS_DISTRIBUTION: 'analytics:order_status_distribution',
  USER_GROWTH: (days: number) => `analytics:user_growth:${days}days`,
  RECENT_TRANSACTIONS: 'analytics:recent_transactions',
  PAYMENT_METHODS_DISTRIBUTION: 'analytics:payment_methods',
  DRUG_CATEGORY_DISTRIBUTION: 'analytics:drug_category_distribution',
};

// Invalidate analytics cache
export function invalidateAnalyticsCache() {
  invalidateCachePattern(/^analytics:|^dashboard:/);
}

// Error handling wrapper
async function safeDbQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Database query failed:', error);
    return fallback;
  }
}

/**
 * Get dashboard overview analytics
 */
export async function getDashboardAnalytics() {
  return getOrFetchCached(
    CACHE_KEYS.DASHBOARD_ANALYTICS,
    async () => {
      // Get counts
      const [
        totalUsers,
        totalDrugs,
        totalOrders,
        totalRevenue,
        lowStockDrugs,
        pendingOrders,
      ] = await Promise.all([
        safeDbQuery(() => db.user.count(), 0),
        safeDbQuery(() => db.drug.count(), 0),
        safeDbQuery(() => db.order.count(), 0),
        safeDbQuery(
          () => db.payment.aggregate({
            _sum: { amount: true },
          }),
          { _sum: { amount: 0 } }
        ),
        safeDbQuery(
          () => db.drug.count({
            where: {
              stock_quantity: { lt: 10 },
            },
          }),
          0
        ),
        safeDbQuery(
          () => db.order.count({
            where: {
              status: 'PENDING',
            },
          }),
          0
        ),
      ]);

      return {
        totalUsers,
        totalDrugs,
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
        lowStockDrugs,
        pendingOrders,
      };
    },
    60 // 1 minute cache - reduced from 5 minutes
  );
}

/**
 * Get revenue trends for a specified number of days
 */
export async function getRevenueTrends(days: number = 30) {
  return getOrFetchCached(
    CACHE_KEYS.REVENUE_TRENDS(days),
    async () => {
      const startDate = subDays(new Date(), days);
      
      // Get payments grouped by day
      const dailyRevenue = await safeDbQuery(
        async () => {
          const results = await db.$queryRaw`
            SELECT 
              DATE(p."transactionDate") as date,
              SUM(p.amount) as revenue,
              COUNT(*) as transactions
            FROM "Payment" p
            WHERE p."transactionDate" >= ${startDate}
            GROUP BY DATE(p."transactionDate")
            ORDER BY date ASC
          `;
          
          return results as Array<{
            date: Date;
            revenue: number;
            transactions: number;
          }>;
        },
        []
      );

      // Fill in missing dates
      const filledData = [];
      for (let i = 0; i < days; i++) {
        const currentDate = subDays(new Date(), days - i - 1);
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        
        const existingData = dailyRevenue.find(
          item => format(new Date(item.date), 'yyyy-MM-dd') === formattedDate
        );
        
        filledData.push({
          date: formattedDate,
          revenue: existingData ? Number(existingData.revenue) : 0,
          transactions: existingData ? Number(existingData.transactions) : 0,
        });
      }

      return filledData;
    },
    120 // 2 minutes cache - reduced from 10 minutes
  );
}

/**
 * Get top selling drugs
 */
export async function getTopSellingDrugs(limit: number = 5) {
  return getOrFetchCached(
    CACHE_KEYS.TOP_SELLING_DRUGS,
    async () => {
      return safeDbQuery(
        () => db.drug.findMany({
          orderBy: {
            total_sold: 'desc',
          } as Prisma.DrugOrderByWithRelationInput,
          take: limit,
          select: {
            id: true,
            name: true,
            dosage: true,
            form: true,
            total_sold: true,
            revenue: true,
          },
        }),
        []
      );
    },
    120 // 2 minutes cache - reduced from 10 minutes
  );
}

/**
 * Get order status distribution
 */
export async function getOrderStatusDistribution() {
  return getOrFetchCached(
    CACHE_KEYS.ORDER_STATUS_DISTRIBUTION,
    async () => {
      // Define all possible order statuses
      const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      
      const statusCounts = await Promise.all(
        statuses.map(status =>
          safeDbQuery(
            () => db.order.count({
              where: { status: status as any },
            }),
            0
          ).then(count => ({ status, count }))
        )
      );
      
      return statusCounts.filter(item => item.count > 0);
    },
    60 // 1 minute cache - reduced from 10 minutes
  );
}

/**
 * Get user growth over time
 */
export async function getUserGrowth(days: number = 30) {
  return getOrFetchCached(
    CACHE_KEYS.USER_GROWTH(days),
    async () => {
      const startDate = subDays(new Date(), days);
      
      const usersByDay = await safeDbQuery(
        async () => {
          const results = await db.$queryRaw`
            SELECT 
              DATE(u."createdAt") as date,
              COUNT(*) as count
            FROM "User" u
            WHERE u."createdAt" >= ${startDate}
            GROUP BY DATE(u."createdAt")
            ORDER BY date ASC
          `;
          
          return results as Array<{
            date: Date;
            count: number;
          }>;
        },
        []
      );

      // Fill in missing dates with cumulative totals
      const filledData = [];
      let cumulativeCount = await safeDbQuery(
        () => db.user.count({
          where: {
            createdAt: {
              lt: startDate,
            },
          },
        }),
        0
      );
      
      for (let i = 0; i < days; i++) {
        const currentDate = subDays(new Date(), days - i - 1);
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        
        const dayData = usersByDay.find(
          item => format(new Date(item.date), 'yyyy-MM-dd') === formattedDate
        );
        
        if (dayData) {
          cumulativeCount += Number(dayData.count);
        }
        
        filledData.push({
          date: formattedDate,
          count: cumulativeCount,
        });
      }

      return filledData;
    },
    600 // 10 minutes cache
  );
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(limit: number = 5) {
  return getOrFetchCached(
    CACHE_KEYS.RECENT_TRANSACTIONS,
    async () => {
      const transactions = await safeDbQuery(
        () => db.payment.findMany({
          where: {
            status: 'completed',
          },
          orderBy: {
            transactionDate: 'desc',
          },
          take: limit,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            order: {
              include: {
                items: {
                  include: {
                    drug: {
                      select: {
                        name: true,
                        dosage: true,
                      },
                    },
                  },
                },
              },
            },
          } as Prisma.PaymentInclude,
        }),
        []
      );

      // Convert transactionDate from Date to string to match the expected type
      return transactions.map(transaction => ({
        ...transaction,
        transactionDate: transaction.transactionDate.toISOString(),
      }));
    },
    30 // 30 seconds cache - reduced from 5 minutes
  );
}

/**
 * Get payment methods distribution
 */
export async function getPaymentMethodsDistribution() {
  return getOrFetchCached(
    CACHE_KEYS.PAYMENT_METHODS_DISTRIBUTION,
    async () => {
      const paymentMethods = await safeDbQuery(
        async () => {
          const results = await db.$queryRaw`
            SELECT 
              "paymentMethod",
              COUNT(*) as count,
              SUM(amount) as total
            FROM "Payment"
            WHERE status = 'completed'
            GROUP BY "paymentMethod"
            ORDER BY count DESC
          `;
          
          return results as Array<{
            paymentMethod: string;
            count: number;
            total: number;
          }>;
        },
        []
      );
      
      return paymentMethods;
    },
    600 // 10 minutes cache
  );
}

/**
 * Get drug category distribution
 */
export async function getDrugCategoryDistribution() {
  return getOrFetchCached(
    CACHE_KEYS.DRUG_CATEGORY_DISTRIBUTION,
    async () => {
      const categoryData = await safeDbQuery(
        async () => {
          const results = await db.$queryRaw`
            SELECT 
              COALESCE(category, 'uncategorized') as category,
              COUNT(*) as count,
              SUM(total_sold) as total_sold,
              SUM(revenue) as revenue
            FROM "Drug"
            GROUP BY category
            ORDER BY total_sold DESC
          `;
          
          return results as Array<{
            category: string;
            count: number;
            total_sold: number;
            revenue: number;
          }>;
        },
        []
      );
      
      // Format data and make category labels more human-readable
      return categoryData.map(item => ({
        ...item,
        category: item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, ' '),
      }));
    },
    600 // 10 minutes cache
  );
}

/**
 * Get comprehensive analytics data for admin dashboard
 */
export async function getComprehensiveAnalytics() {
  try {
    const [
      dashboardAnalytics,
      revenueTrends, 
      topSellingDrugs,
      orderStatusDistribution,
      userGrowth,
      recentTransactions,
      paymentMethodsDistribution,
      drugCategoryDistribution
    ] = await Promise.all([
      getDashboardAnalytics(),
      getRevenueTrends(),
      getTopSellingDrugs(),
      getOrderStatusDistribution(),
      getUserGrowth(),
      getRecentTransactions(),
      getPaymentMethodsDistribution(),
      getDrugCategoryDistribution()
    ]);
    
    return {
      dashboardAnalytics,
      revenueTrends,
      topSellingDrugs,
      orderStatusDistribution,
      userGrowth,
      recentTransactions,
      paymentMethodsDistribution,
      drugCategoryDistribution
    };
  } catch (error) {
    console.error('Failed to get comprehensive analytics:', error);
    // Return default structure with empty data to avoid UI errors
    return {
      dashboardAnalytics: {
        totalUsers: 0,
        totalDrugs: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lowStockDrugs: 0,
        pendingOrders: 0
      },
      revenueTrends: [],
      topSellingDrugs: [],
      orderStatusDistribution: [],
      userGrowth: [],
      recentTransactions: [],
      paymentMethodsDistribution: [],
      drugCategoryDistribution: []
    };
  }
} 