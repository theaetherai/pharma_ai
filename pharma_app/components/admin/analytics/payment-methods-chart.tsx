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

type PaymentMethodData = {
  paymentMethod: string;
  count: number | bigint;
  total: number | bigint;
};

interface PaymentMethodsChartProps {
  data: PaymentMethodData[];
  title?: string;
  description?: string;
}

// Payment method colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28AFD'];

function PaymentMethodsChartComponent({ 
  data = [], 
  title = "Payment Methods", 
  description = "Distribution of payment methods used" 
}: PaymentMethodsChartProps) {
  // Format data for chart display - explicitly convert BigInt to Number
  const chartData = data.map((item) => ({
    name: item.paymentMethod,
    value: Number(item.count),
    total: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(item.total))
  }));

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
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => {
                return [`${value} transactions (${props.payload.total})`, name];
              }}
            />
            <Legend 
              formatter={(value, entry, index) => {
                return (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload?.value || 0} transactions)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const PaymentMethodsChart = memo(PaymentMethodsChartComponent);

// Also export as default for lazy loading compatibility
export default PaymentMethodsChart; 