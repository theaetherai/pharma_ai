'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

type RevenueData = {
  date: string;
  revenue: number | bigint;
  transactions: number | bigint;
};

interface RevenueChartProps {
  data: RevenueData[];
  title?: string;
  description?: string;
}

function RevenueChartComponent({ 
  data = [], 
  title = "Revenue Trends", 
  description = "Daily revenue for the past 30 days" 
}: RevenueChartProps) {
  // Format data for better display and explicitly convert BigInt to Number
  const formattedData = data.map(item => ({
    date: item.date,
    revenue: Number(item.revenue),
    transactions: Number(item.transactions),
    formattedRevenue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(item.revenue))
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value),
                'Revenue'
              ]}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              fill="rgba(136, 132, 216, 0.6)"
              activeDot={{ r: 8 }}
              name="Revenue"
            />
            <Area
              type="monotone"
              dataKey="transactions"
              stroke="#82ca9d"
              fill="rgba(130, 202, 157, 0.6)"
              name="Transactions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const RevenueChart = memo(RevenueChartComponent);

// Also export as default for lazy loading compatibility
export default RevenueChart; 