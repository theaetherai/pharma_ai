import { db } from "@/lib/db";
import { OrderStatus, NotificationType } from "@prisma/client";
import { invalidateAnalyticsCache } from "@/lib/analytics-service";

interface OrderItem {
  drugId: string;
  quantity: number;
  price: number;
}

interface CreateOrderParams {
  userId: string;
  addressId: string;
  items: OrderItem[];
}

interface PaymentConfirmParams {
  orderId: string;
  paymentReference: string;
  amount: number;
  paymentMethod: string;
  currency: string;
  paymentId?: string;
}

interface UpdateOrderStatusParams {
  orderId: string;
  status: OrderStatus;
  notes?: string;
}

/**
 * Create a new order
 */
export async function createOrder(params: CreateOrderParams) {
  const { userId, addressId, items } = params;
  
  // Calculate order total
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Create order in database with increased timeout (15 seconds)
  return await db.$transaction(async (tx) => {
    // Create the order
    const order = await tx.order.create({
      data: {
        userId,
        addressId,
        total,
        items: {
          create: items.map(item => ({
            drugId: item.drugId,
            quantity: item.quantity,
            price: item.price
          }))
        },
        statusLogs: {
          create: {
            status: OrderStatus.PENDING,
            notes: "Order created"
          }
        }
      },
      include: {
        items: true,
        address: true
      }
    });
    
    // Create notification for new order
    await tx.notification.create({
      data: {
        title: "New Order Placed",
        message: `Order #${order.id} has been created and is pending payment.`,
        type: NotificationType.ORDER_STATUS_CHANGE,
        metadata: { orderId: order.id }
      }
    });
    
    return order;
  }, {
    maxWait: 10000, // 10 seconds max wait time for lock
    timeout: 15000   // 15 seconds transaction timeout
  });
}

/**
 * Confirm payment for an order
 */
export async function confirmOrderPayment(params: PaymentConfirmParams) {
  const { orderId, paymentReference, amount, paymentMethod, currency, paymentId } = params;
  
  return await db.$transaction(async (tx) => {
    // Get the order with items
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { 
        items: {
          include: {
            drug: true
          }
        },
        user: true
      }
    });
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Check if payment record already exists (by reference or id)
    let payment;
    if (paymentId) {
      // Use existing payment if ID is provided
      payment = await tx.payment.findUnique({
        where: { id: paymentId }
      });
      
      if (payment) {
        // Update the payment to link it to this order if needed
        if (!payment.orderId || payment.orderId !== orderId) {
          payment = await tx.payment.update({
            where: { id: paymentId },
            data: { 
              orderId,
              status: 'completed'
            }
          });
        }
      }
    }
    
    // If no existing payment found by ID, check by reference
    if (!payment && paymentReference) {
      payment = await tx.payment.findUnique({
        where: { reference: paymentReference }
      });
      
      if (payment) {
        // Update the payment to link it to this order if needed
        if (!payment.orderId || payment.orderId !== orderId) {
          payment = await tx.payment.update({
            where: { id: payment.id },
            data: { 
              orderId,
              status: 'completed'
            }
          });
        }
      }
    }
    
    // If no existing payment is found, create a new one
    if (!payment) {
      try {
        payment = await tx.payment.create({
          data: {
            userId: order.userId,
            orderId,
            reference: paymentReference,
            amount,
            status: 'completed',
            transactionDate: new Date(),
            paymentMethod,
            currency
          }
        });
      } catch (error: any) {
        // If there's a unique constraint error on reference, try to find and update instead
        if (error.code === 'P2002' && error.meta?.target?.includes('reference')) {
          console.warn(`Payment with reference ${paymentReference} already exists, using existing payment`);
          payment = await tx.payment.findUnique({
            where: { reference: paymentReference }
          });
          
          if (payment) {
            payment = await tx.payment.update({
              where: { id: payment.id },
              data: { 
                orderId,
                status: 'completed'
              }
            });
          } else {
            throw new Error(`Cannot find or create payment for reference ${paymentReference}`);
          }
        } else {
          throw error;
        }
      }
    }
    
    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        statusLogs: {
          create: {
            status: OrderStatus.CONFIRMED,
            notes: `Payment confirmed: ${paymentReference}`
          }
        }
      }
    });
    
    // Update drug inventory for each item
    for (const item of order.items) {
      // Update drug quantity and sales stats
      await tx.drug.update({
        where: { id: item.drugId },
        data: {
          stock_quantity: { decrement: item.quantity },
          total_sold: { increment: item.quantity },
          revenue: { increment: item.price * item.quantity }
        }
      });
      
      // Check if drug is low in stock after update (less than 10 items)
      const updatedDrug = await tx.drug.findUnique({
        where: { id: item.drugId }
      });
      
      if (updatedDrug && updatedDrug.stock_quantity < 10) {
        // Create low stock notification
        await tx.notification.create({
          data: {
            title: "Low Stock Alert",
            message: `${updatedDrug.name} ${updatedDrug.dosage} is running low (${updatedDrug.stock_quantity} remaining)`,
            type: NotificationType.LOW_STOCK,
            metadata: { drugId: updatedDrug.id }
          }
        });
      }
    }
    
    // Create payment confirmation notification
    await tx.notification.create({
      data: {
        title: "Payment Successful",
        message: `Payment for order #${orderId} has been successfully processed (${currency} ${amount}).`,
        type: NotificationType.PAYMENT_SUCCESS,
        metadata: { 
          orderId,
          paymentId: payment.id
        }
      }
    });
    
    // Update analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find or create today's analytics record
    const existingAnalytics = await tx.analytics.findUnique({
      where: { date: today }
    });
    
    if (existingAnalytics) {
      await tx.analytics.update({
        where: { date: today },
        data: {
          totalRevenue: { increment: amount },
          totalOrders: { increment: 1 },
          totalDrugsSold: { 
            increment: order.items.reduce((sum, item) => sum + item.quantity, 0) 
          },
          updatedAt: new Date()
        }
      });
    } else {
      await tx.analytics.create({
        data: {
          date: today,
          totalRevenue: amount,
          totalOrders: 1,
          totalDrugsSold: order.items.reduce((sum, item) => sum + item.quantity, 0),
          dailyData: {
            orders: [orderId],
            drugs: order.items.map(item => ({
              drugId: item.drugId,
              name: item.drug.name,
              quantity: item.quantity,
              revenue: item.price * item.quantity
            }))
          }
        }
      });
    }
    
    // After the transaction completes, invalidate the analytics cache
    // to ensure real-time updates in the admin dashboard
    setTimeout(() => {
      invalidateAnalyticsCache();
    }, 500);
    
    return { order, payment };
  }, {
    maxWait: 10000, // 10 seconds max wait time for lock
    timeout: 15000   // 15 seconds transaction timeout
  });
}

/**
 * Update order status
 */
export async function updateOrderStatus(params: UpdateOrderStatusParams) {
  const { orderId, status, notes } = params;
  
  try {
    // First, get the current order to get user ID
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { userId: true }
    });
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Update order status without transaction to avoid timeouts
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status,
      },
      include: {
        user: true,
        items: true
      }
    });
    
    // Create status log in a separate query
    await db.orderStatusLog.create({
      data: {
        orderId,
        status,
        notes: notes || `Order status updated to ${status}`
      }
    });
    
    // Create notification for status change in a separate query
    await db.notification.create({
      data: {
        title: "Order Status Updated",
        message: `Order #${orderId} status has been updated to ${status}`,
        type: NotificationType.ORDER_STATUS_CHANGE,
        userId: order.userId,
        metadata: { 
          orderId,
          status
        }
      }
    });
    
    // Invalidate analytics cache to ensure fresh data
    invalidateAnalyticsCache();
    
    return updatedOrder;
  } catch (error) {
    console.error(`Error updating order status for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get order details with all related information
 */
export async function getOrderDetails(orderId: string) {
  return await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      address: true,
      items: {
        include: {
          drug: true
        }
      },
      payments: true,
      statusLogs: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
}

/**
 * Get all unread notifications
 */
export async function getUnreadNotifications() {
  return await db.notification.findMany({
    where: {
      read: false
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Get notifications with pagination
 */
export async function getNotificationsWithPagination(params: {
  page?: number;
  limit?: number;
  includeRead?: boolean;
}) {
  const { page = 1, limit = 20, includeRead = true } = params;
  
  // Validate pagination parameters
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;
  const skip = (validPage - 1) * validLimit;
  
  // Build where clause
  const where: any = {};
  if (!includeRead) {
    where.read = false;
  }
  
  // Get total count for pagination
  const totalNotifications = await db.notification.count({ where });
  
  // Get notifications with pagination
  const notifications = await db.notification.findMany({
    where,
    orderBy: [
      { read: 'asc' },
      { createdAt: 'desc' }
    ],
    skip,
    take: validLimit
  });
  
  return {
    notifications,
    pagination: {
      totalRecords: totalNotifications,
      currentPage: validPage,
      pageSize: validLimit,
      totalPages: Math.ceil(totalNotifications / validLimit)
    }
  };
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]) {
  return await db.notification.updateMany({
    where: {
      id: { in: notificationIds }
    },
    data: {
      read: true
    }
  });
}

/**
 * Get orders with pagination
 */
export async function getOrdersWithPagination(params: {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = params;
  
  // Validate pagination parameters
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;
  const skip = (validPage - 1) * validLimit;
  
  // Build where clause for filters
  const where: any = {};
  if (status) {
    where.status = status;
  }
  
  // Get total count for pagination
  const totalOrders = await db.order.count({ where });
  
  // Build orderBy clause
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;
  
  // Get orders with pagination
  const orders = await db.order.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      payments: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      },
      items: {
        include: {
          drug: true
        }
      },
      address: true
    },
    orderBy,
    skip,
    take: validLimit
  });
  
  return {
    orders,
    pagination: {
      totalRecords: totalOrders,
      currentPage: validPage,
      pageSize: validLimit,
      totalPages: Math.ceil(totalOrders / validLimit)
    }
  };
}

/**
 * Get analytics data
 */
export async function getAnalyticsData() {
  // Default values if analytics are not available
  const defaultStats = {
    totals: {
      revenue: 0,
      orders: 0,
      drugsSold: 0
    },
    topSellingDrugs: [] as Array<{
      id: string;
      name: string;
      dosage: string;
      form: string;
      total_sold: number;
      revenue: number;
    }>,
    recentAnalytics: [] as Array<{
      date: Date;
      totalRevenue: number;
      totalOrders: number;
      totalDrugsSold: number;
    }>
  };

  try {
    // Check if analytics table exists by attempting a simple operation
    let analyticsExist = true;
    try {
      // This will throw an error if the analytics table doesn't exist
      await db.analytics?.findFirst();
    } catch (error) {
      console.warn("Analytics table may not exist:", error);
      analyticsExist = false;
    }

    if (!analyticsExist) {
      return defaultStats;
    }

    // Get overall totals
    let totalStats;
    try {
      totalStats = await db.analytics.aggregate({
        _sum: {
          totalRevenue: true,
          totalOrders: true,
          totalDrugsSold: true
        }
      });
    } catch (error) {
      console.warn("Failed to aggregate analytics:", error);
      totalStats = { _sum: { totalRevenue: null, totalOrders: null, totalDrugsSold: null } };
    }

    // Get top selling drugs
    let topSellingDrugs: Array<{
      id: string;
      name: string;
      dosage: string;
      form: string;
      total_sold: number;
      revenue: number;
    }> = [];
    try {
      topSellingDrugs = await db.drug.findMany({
        orderBy: {
          total_sold: 'desc'
        },
        take: 5
      });
    } catch (error) {
      console.warn("Failed to get top selling drugs:", error);
    }

    // Get recent analytics records for trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let recentAnalytics: Array<{
      date: Date;
      totalRevenue: number;
      totalOrders: number;
      totalDrugsSold: number;
    }> = [];
    try {
      recentAnalytics = await db.analytics.findMany({
        where: {
          date: {
            gte: sevenDaysAgo
          }
        },
        orderBy: {
          date: 'asc'
        }
      });
    } catch (error) {
      console.warn("Failed to get recent analytics:", error);
    }

    return {
      totals: {
        revenue: totalStats._sum?.totalRevenue || 0,
        orders: totalStats._sum?.totalOrders || 0,
        drugsSold: totalStats._sum?.totalDrugsSold || 0
      },
      topSellingDrugs,
      recentAnalytics
    };
  } catch (error) {
    console.error("Error getting analytics data:", error);
    return defaultStats;
  }
} 