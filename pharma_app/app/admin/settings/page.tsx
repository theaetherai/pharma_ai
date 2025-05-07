import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Bell, Shield, Database, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  // Mock settings sections
  const settingsSections = [
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your admin account details and preferences',
      icon: User,
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      description: 'Configure system alerts and notification delivery methods',
      icon: Bell,
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Manage security settings, permissions and access controls',
      icon: Shield,
    },
    {
      id: 'database',
      title: 'Database Management',
      description: 'Configure database backup schedules and retention policies',
      icon: Database,
    },
    {
      id: 'localization',
      title: 'Localization',
      description: 'Configure regional settings, time zones and currency formats',
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your system preferences and configuration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="hover:border-primary/50 cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Version</span>
              <span className="text-muted-foreground">PharmaAI v1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Last Database Backup</span>
              <span className="text-muted-foreground">Today, 03:00 AM</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Server Status</span>
              <span className="text-green-500">Operational</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">License</span>
              <span className="text-muted-foreground">Commercial License</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Support Expiry</span>
              <span className="text-muted-foreground">December 31, 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 