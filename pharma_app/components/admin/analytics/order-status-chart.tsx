'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from "recharts";

type OrderStatusData = {
  status: string;
  count: number | bigint;
};

interface OrderStatusChartProps {
  data: OrderStatusData[];
  title?: string;
  description?: string;
}

// Status colors
const STATUS_COLORS = {
  PENDING: "#fbbf24",    // Amber
  CONFIRMED: "#60a5fa",  // Blue
  PROCESSING: "#818cf8", // Indigo
  SHIPPED: "#34d399",    // Emerald
  DELIVERED: "#10b981",  // Green
  CANCELLED: "#f87171",  // Red
};

// Get color for a status
const getStatusColor = (status: string) => {
  return (STATUS_COLORS as any)[status] || "#6b7280"; // Gray as fallback
};

function OrderStatusChartComponent({ 
  data = [], 
  title = "Order Status Distribution", 
  description = "Distribution of orders by status" 
}: OrderStatusChartProps) {
  // Convert any potential BigInt values to Number and sort data by count
  const sortedData = [...data]
    .map(item => ({
      status: item.status,
      count: Number(item.count)
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getStatusColor(entry.status)} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} orders`, 'Count']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const OrderStatusChart = memo(OrderStatusChartComponent);

// Also export as default for lazy loading compatibility
export default OrderStatusChart; 