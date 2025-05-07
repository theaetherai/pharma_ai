import { NotificationList } from "@/components/admin/notification-list";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { getNotificationsWithPagination } from "@/lib/order-service";
import { NotificationFilterTabs } from "@/components/admin/notification-filter-tabs";
import { MarkAllReadButton } from "@/components/admin/mark-all-read-button";

// Making the page dynamic to refresh data on each request
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; includeRead?: string; };
}) {
  // Parse pagination parameters
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const includeRead = searchParams.includeRead !== 'false';
  
  // Get notifications with pagination
  const { notifications, pagination } = await getNotificationsWithPagination({
    page,
    limit,
    includeRead
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Notifications</h2>
        <p className="text-muted-foreground">
          View and manage system notifications
        </p>
      </div>
      
      <Tabs defaultValue={includeRead ? "all" : "unread"}>
        <div className="flex justify-between items-center mb-4">
          <NotificationFilterTabs includeRead={includeRead} />
          <MarkAllReadButton />
        </div>
        
        <TabsContent value="all" className="mt-0">
          <NotificationList initialNotifications={notifications} pagination={pagination} />
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          <NotificationList initialNotifications={notifications} pagination={pagination} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 