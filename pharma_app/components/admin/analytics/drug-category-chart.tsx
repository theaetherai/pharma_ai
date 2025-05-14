'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

type DrugCategoryData = {
  category: string;
  count: number | bigint;
  total_sold: number | bigint;
  revenue: number | bigint;
};

interface DrugCategoryChartProps {
  data: DrugCategoryData[];
  title?: string;
  description?: string;
}

// Colors for the chart
const COLORS = {
  count: "#8884d8",
  total_sold: "#82ca9d",
  revenue: "#ffc658"
};

function DrugCategoryChartComponent({ 
  data = [], 
  title = "Drug Categories", 
  description = "Distribution of drugs by category" 
}: DrugCategoryChartProps) {
  // Format the data for better display and explicitly convert BigInt to Number
  const formattedData = data.map(item => ({
    category: item.category,
    count: Number(item.count),
    total_sold: Number(item.total_sold),
    revenue: Number(item.revenue),
    formattedRevenue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(item.revenue))
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{
              top: 20,
              right: 30,
              left: 100,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="category" 
              type="category" 
              tick={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'revenue') {
                  return [
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(value),
                    'Revenue'
                  ];
                }
                return [value, name === 'count' ? 'Drug Count' : 'Total Sold'];
              }}
              labelFormatter={(value) => `Category: ${value}`}
            />
            <Legend 
              formatter={(value) => {
                switch(value) {
                  case 'count': return 'Drug Count';
                  case 'total_sold': return 'Units Sold';
                  case 'revenue': return 'Revenue';
                  default: return value;
                }
              }}
            />
            <Bar 
              dataKey="count" 
              fill={COLORS.count} 
              name="count"
            />
            <Bar 
              dataKey="total_sold"
              fill={COLORS.total_sold} 
              name="total_sold"
            />
            <Bar 
              dataKey="revenue" 
              fill={COLORS.revenue} 
              name="revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const DrugCategoryChart = memo(DrugCategoryChartComponent);

// Also export as default for lazy loading compatibility
export default DrugCategoryChart; 