'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

type UserGrowthData = {
  date: string;
  count: number | bigint;
};

interface UserGrowthChartProps {
  data: UserGrowthData[];
  title?: string;
  description?: string;
}

function UserGrowthChartComponent({ 
  data = [], 
  title = "User Growth", 
  description = "Cumulative user growth over time" 
}: UserGrowthChartProps) {
  // Convert any potential BigInt values to Number
  const formattedData = data.map(item => ({
    date: item.date,
    count: Number(item.count)
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
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
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              strokeWidth={2}
              name="Total Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const UserGrowthChart = memo(UserGrowthChartComponent);

// Also export as default for lazy loading compatibility
export default UserGrowthChart; 