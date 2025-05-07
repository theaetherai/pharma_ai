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

type DrugData = {
  id: string;
  name: string;
  dosage: string;
  form: string;
  total_sold: number;
  revenue: number;
};

interface TopSellingDrugsProps {
  data: DrugData[];
  title?: string;
  description?: string;
}

function TopSellingDrugsComponent({ 
  data = [], 
  title = "Top Selling Drugs", 
  description = "Highest selling products by quantity" 
}: TopSellingDrugsProps) {
  // Format data for chart display
  const chartData = data.map(drug => ({
    name: `${drug.name} ${drug.dosage}`,
    quantity: drug.total_sold,
    revenue: drug.revenue,
    formattedRevenue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(drug.revenue)
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
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 80,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              width={80}
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
                return [value, name === 'quantity' ? 'Units Sold' : name];
              }}
            />
            <Legend />
            <Bar 
              dataKey="quantity" 
              fill="#8884d8" 
              name="Units Sold" 
              barSize={20}
            />
            <Bar 
              dataKey="revenue" 
              fill="#82ca9d" 
              name="Revenue" 
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const TopSellingDrugs = memo(TopSellingDrugsComponent);

// Also export as default for lazy loading compatibility
export default TopSellingDrugs; 