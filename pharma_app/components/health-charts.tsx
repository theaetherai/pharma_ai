"use client";

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Info } from "lucide-react";
import { HealthMetrics } from "@/types/pharma-types";

// Type definitions for the chart components
interface ChartCardProps {
  title: string;
  description?: string;
  infoTooltip?: string;
  footerContent?: React.ReactNode;
  children: React.ReactNode;
}

interface BloodPressureChartProps {
  data: Array<{ date: string; systolic: number; diastolic: number }>;
  height?: number;
}

interface HeartRateChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
}

interface SleepChartProps {
  data: Array<{ date: string; deep: number; light: number; rem: number }>;
  height?: number;
}

interface ActivityChartProps {
  data: Array<{ name: string; value: number; goal: number }>;
  height?: number;
}

interface NutritionChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
  height?: number;
}

// Wrapper component for chart cards
export function ChartCard({ 
  title, 
  description, 
  infoTooltip, 
  footerContent, 
  children 
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {infoTooltip && (
            <span className="text-sm text-muted-foreground hover:text-primary cursor-help" title={infoTooltip}>
              <Info className="h-4 w-4" />
            </span>
          )}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-1 pb-1">
        {children}
      </CardContent>
      {footerContent && (
        <CardFooter className="border-t pt-4">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}

// Blood Pressure Chart Component
export function BloodPressureChart({ data, height = 300 }: BloodPressureChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              `${value} mmHg`, 
              name === "systolic" ? "Systolic" : "Diastolic"
            ]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="systolic" 
            name="Systolic"
            stroke="#8884d8" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
          />
          <Line 
            type="monotone" 
            dataKey="diastolic" 
            name="Diastolic"
            stroke="#82ca9d" 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Heart Rate Chart Component
export function HeartRateChart({ data, height = 300 }: HeartRateChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} bpm`, "Heart Rate"]} />
          <Area 
            type="monotone" 
            dataKey="value" 
            name="Heart Rate"
            stroke="#ff7070" 
            fill="#ff7070" 
            fillOpacity={0.2} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sleep Chart Component
export function SleepChart({ data, height = 300 }: SleepChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          stackOffset="expand"
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} hours`, ""]} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="deep" 
            stackId="1"
            stroke="#82ca9d" 
            fill="#82ca9d" 
            name="Deep Sleep"
          />
          <Area 
            type="monotone" 
            dataKey="light" 
            stackId="1"
            stroke="#8884d8" 
            fill="#8884d8" 
            name="Light Sleep"
          />
          <Area 
            type="monotone" 
            dataKey="rem" 
            stackId="1"
            stroke="#ffc658" 
            fill="#ffc658" 
            name="REM Sleep"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Activity Chart Component
export function ActivityChart({ data, height = 300 }: ActivityChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" name="Current" />
          <Bar dataKey="goal" fill="#82ca9d" name="Goal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Nutrition Pie Chart Component
export function NutritionChart({ data, colors, height = 300 }: NutritionChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}g`, ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Health Score Chart Component
export function HealthScoreChart({ 
  data, 
  height = 300 
}: { 
  data: Array<{ month: string; score: number }>;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="month" />
          <YAxis domain={[70, 100]} />
          <Tooltip formatter={(value) => [`${value} points`, "Health Score"]} />
          <Line
            type="monotone"
            dataKey="score"
            name="Health Score"
            stroke="#8884d8"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Utility function to generate sample chart data
export function generateSampleData() {
  return {
    bloodPressure: [
      { date: "Jan", systolic: 120, diastolic: 80 },
      { date: "Feb", systolic: 125, diastolic: 82 },
      { date: "Mar", systolic: 118, diastolic: 78 },
      { date: "Apr", systolic: 130, diastolic: 85 },
      { date: "May", systolic: 122, diastolic: 79 },
      { date: "Jun", systolic: 119, diastolic: 77 },
    ],
    heartRate: [
      { date: "Mon", value: 72 },
      { date: "Tue", value: 75 },
      { date: "Wed", value: 69 },
      { date: "Thu", value: 78 },
      { date: "Fri", value: 82 },
      { date: "Sat", value: 68 },
      { date: "Sun", value: 70 },
    ],
    sleep: [
      { date: "Mon", deep: 2.5, light: 4.5, rem: 1.5 },
      { date: "Tue", deep: 3.0, light: 4.0, rem: 1.2 },
      { date: "Wed", deep: 2.0, light: 5.0, rem: 1.8 },
      { date: "Thu", deep: 2.8, light: 3.8, rem: 1.3 },
      { date: "Fri", deep: 2.2, light: 4.2, rem: 1.6 },
      { date: "Sat", deep: 3.5, light: 5.0, rem: 2.0 },
      { date: "Sun", deep: 3.2, light: 4.8, rem: 1.9 },
    ],
    activity: [
      { name: "Steps", value: 8532, goal: 10000 },
      { name: "Active Min", value: 45, goal: 60 },
      { name: "Calories", value: 2250, goal: 2500 },
      { name: "Floors", value: 12, goal: 15 },
      { name: "Distance", value: 5.2, goal: 8 },
    ],
    nutrition: [
      { name: "Protein", value: 92 },
      { name: "Carbs", value: 230 },
      { name: "Fat", value: 65 },
      { name: "Fiber", value: 24 },
    ],
    healthScore: [
      { month: "Jan", score: 78 },
      { month: "Feb", score: 76 },
      { month: "Mar", score: 80 },
      { month: "Apr", score: 82 },
      { month: "May", score: 84 },
      { month: "Jun", score: 85 },
    ],
  };
}

// Health metrics conversion utility
export function convertHealthMetricsToChartData(metrics: HealthMetrics) {
  // This function would convert health metrics from the API/database format
  // to the chart data format used by the chart components
  
  // This is just a placeholder implementation
  // In a real application, you would process the actual metrics data
  
  // Return sample data for now
  return generateSampleData();
} 