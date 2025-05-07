"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Check, Info, Bell, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Define the enum locally instead of importing from Prisma
enum NotificationType {
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  LOW_STOCK = "LOW_STOCK",
  ORDER_STATUS_CHANGE = "ORDER_STATUS_CHANGE",
  SYSTEM = "SYSTEM"
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType | string;
  read: boolean;
  createdAt: Date;
  metadata?: any;
}

interface PaginationInfo {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

interface NotificationListProps {
  initialNotifications: Notification[];
  pagination: PaginationInfo;
}

export function NotificationList({ initialNotifications, pagination }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Helper function to format notification type with icon and color
  const getNotificationDisplay = (type: NotificationType | string) => {
    switch (type) {
      case NotificationType.LOW_STOCK:
        return { 
          icon: AlertTriangle, 
          color: "text-yellow-500 bg-yellow-50"
        };
      case NotificationType.PAYMENT_SUCCESS:
        return { 
          icon: Check, 
          color: "text-green-500 bg-green-50"
        };
      case NotificationType.ORDER_STATUS_CHANGE:
        return { 
          icon: Bell, 
          color: "text-blue-500 bg-blue-50"
        };
      case NotificationType.SYSTEM:
      default:
        return { 
          icon: Info, 
          color: "text-gray-500 bg-gray-50"
        };
    }
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

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: [id],
        }),
      });

      if (response.ok) {
        // Update the local state to reflect the change
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
        toast({
          title: "Success",
          description: "Notification marked as read",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/notifications");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Error polling notifications:", error);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg mb-2">No Notifications</h3>
        <p className="text-muted-foreground">
          You don't have any notifications at the moment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {notifications.map((notification) => {
          const { icon: Icon, color } = getNotificationDisplay(notification.type);
          return (
            <div 
              key={notification.id} 
              className={`p-4 rounded-md border ${notification.read ? 'opacity-70' : 'border-l-4 border-l-primary'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  {notification.metadata && notification.type === NotificationType.ORDER_STATUS_CHANGE && (
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        asChild
                      >
                        <a href={`/admin/orders?id=${notification.metadata.orderId}`}>
                          View Order
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
                {!notification.read ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Trash className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Pagination Controls */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {notifications.length} of {pagination.totalRecords} notifications
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
      )}
    </div>
  );
} 