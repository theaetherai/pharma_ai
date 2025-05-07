"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Download, Share2, Bell, Plus, History } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';

// Sample data generation
const generateVitalsData = () => {
  const now = new Date();
  const data = [];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bloodPressureSystolic: Math.floor(Math.random() * 30) + 110,
      bloodPressureDiastolic: Math.floor(Math.random() * 20) + 70,
      heartRate: Math.floor(Math.random() * 20) + 60,
      bloodSugar: Math.floor(Math.random() * 40) + 80,
      temperature: (Math.random() * 1.5 + 97).toFixed(1),
      oxygenLevel: Math.floor(Math.random() * 5) + 95,
      respiratoryRate: Math.floor(Math.random() * 6) + 12,
    });
  }
  
  return data;
};

export default function VitalsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const vitalsData = generateVitalsData();
  
  // Find min and max values for each metric
  const minMax = vitalsData.reduce((acc, item) => {
    Object.keys(item).forEach(key => {
      if (key !== 'date') {
        if (!acc[key]) acc[key] = { min: item[key], max: item[key] };
        else {
          acc[key].min = Math.min(acc[key].min, item[key]);
          acc[key].max = Math.max(acc[key].max, item[key]);
        }
      }
    });
    return acc;
  }, {});
  
  // Latest values
  const latestVitals = vitalsData[vitalsData.length - 1];
  
  const getStatusColor = (metric, value) => {
    const ranges = {
      bloodPressureSystolic: { normal: [90, 120], warning: [120, 140], danger: [140, 200] },
      bloodPressureDiastolic: { normal: [60, 80], warning: [80, 90], danger: [90, 120] },
      heartRate: { normal: [60, 100], warning: [100, 120], danger: [120, 160] },
      bloodSugar: { normal: [80, 120], warning: [120, 180], danger: [180, 250] },
      oxygenLevel: { normal: [95, 100], warning: [90, 95], danger: [0, 90] },
      temperature: { normal: [97, 99], warning: [99, 100.4], danger: [100.4, 104] },
      respiratoryRate: { normal: [12, 20], warning: [20, 25], danger: [25, 40] },
    };
    
    if (!ranges[metric]) return "text-gray-500";
    
    if (value >= ranges[metric].normal[0] && value <= ranges[metric].normal[1]) {
      return "text-green-500";
    } else if (value >= ranges[metric].warning[0] && value <= ranges[metric].warning[1]) {
      return "text-amber-500";
    } else {
      return "text-red-500";
    }
  };
  
  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6 p-6 pb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Vitals Monitoring</h1>
              <p className="text-muted-foreground">
                Track and monitor your key health metrics over time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Calendar className="h-4 w-4" />
                <span>Set Reminders</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Share2 className="h-4 w-4" />
                <span>Share with Doctor</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>
              
              <div className="flex justify-end py-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Latest Vitals Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <span className={getStatusColor('bloodPressureSystolic', latestVitals.bloodPressureSystolic)}>
                          {latestVitals.bloodPressureSystolic}
                        </span>
                        <span>/</span>
                        <span className={getStatusColor('bloodPressureDiastolic', latestVitals.bloodPressureDiastolic)}>
                          {latestVitals.bloodPressureDiastolic}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground ml-1">mmHg</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last updated today</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <span className={getStatusColor('heartRate', latestVitals.heartRate)}>
                          {latestVitals.heartRate}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground ml-1">bpm</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last updated today</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Blood Glucose</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <span className={getStatusColor('bloodSugar', latestVitals.bloodSugar)}>
                          {latestVitals.bloodSugar}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground ml-1">mg/dL</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last updated today</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Oxygen Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <span className={getStatusColor('oxygenLevel', latestVitals.oxygenLevel)}>
                          {latestVitals.oxygenLevel}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last updated today</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <span className={getStatusColor('temperature', latestVitals.temperature)}>
                          {latestVitals.temperature}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground ml-1">°F</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last updated today</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Respiratory Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <span className={getStatusColor('respiratoryRate', latestVitals.respiratoryRate)}>
                          {latestVitals.respiratoryRate}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground ml-1">breaths/min</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last updated today</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="flex flex-col justify-center items-center">
                    <CardContent className="flex flex-col items-center justify-center h-full py-6">
                      <Button variant="outline" className="h-10 w-10 rounded-full p-0 mb-2">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <p className="text-sm font-medium">Log New Vitals</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="flex flex-col justify-center items-center">
                    <CardContent className="flex flex-col items-center justify-center h-full py-6">
                      <Button variant="outline" className="h-10 w-10 rounded-full p-0 mb-2">
                        <Bell className="h-4 w-4" />
                      </Button>
                      <p className="text-sm font-medium">Set Reminders</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Blood Pressure</CardTitle>
                      <CardDescription>Systolic and diastolic readings over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vitalsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} />
                            <YAxis tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="bloodPressureSystolic" stroke="#f43f5e" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="bloodPressureDiastolic" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-rose-500 mr-1"></div>
                          <span>Systolic</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-sky-500 mr-1"></div>
                          <span>Diastolic</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Heart Rate</CardTitle>
                      <CardDescription>Beats per minute over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={vitalsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} />
                            <YAxis tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip />
                            <Area type="monotone" dataKey="heartRate" stroke="#8b5cf6" fill="#c4b5fd" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="text-sm text-muted-foreground">
                        Average: {Math.round(vitalsData.reduce((sum, item) => sum + item.heartRate, 0) / vitalsData.length)} bpm
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Blood Glucose</CardTitle>
                      <CardDescription>Blood sugar levels over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vitalsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} />
                            <YAxis tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="bloodSugar" stroke="#10b981" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Normal: 80-120 mg/dL</Badge>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Oxygen Level</CardTitle>
                      <CardDescription>Blood oxygen saturation over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vitalsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} />
                            <YAxis tickLine={false} domain={[90, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="oxygenLevel" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="text-sm text-muted-foreground">
                        Healthy Range: 95-100%
                      </div>
                    </CardFooter>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Summary & Recommendations</CardTitle>
                    <CardDescription>Based on your recent vitals</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                        <h3 className="font-medium text-amber-800 mb-1">Blood Pressure Alert</h3>
                        <p className="text-sm text-amber-700">Your systolic blood pressure has been slightly elevated in the past week. Consider reducing salt intake and increasing physical activity.</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <h3 className="font-medium text-green-800 mb-1">Heart Rate Normal</h3>
                        <p className="text-sm text-green-700">Your resting heart rate is within healthy range. Continue with your current exercise routine.</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <h3 className="font-medium text-blue-800 mb-1">Healthy Tip</h3>
                        <p className="text-sm text-blue-700">Taking your vitals at the same time each day can help identify patterns more accurately. Consider setting a reminder for consistent monitoring.</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Report with Doctor
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Measurement History</CardTitle>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-7 p-4 border-b bg-muted/50 font-medium text-sm">
                        <div>Date</div>
                        <div>BP (mmHg)</div>
                        <div>Heart Rate</div>
                        <div>Blood Sugar</div>
                        <div>O₂ Level</div>
                        <div>Temp (°F)</div>
                        <div>Resp. Rate</div>
                      </div>
                      <div className="divide-y">
                        {vitalsData.slice().reverse().map((reading, index) => (
                          <div key={index} className="grid grid-cols-7 p-4 text-sm">
                            <div>{reading.date}</div>
                            <div>{reading.bloodPressureSystolic}/{reading.bloodPressureDiastolic}</div>
                            <div>{reading.heartRate} bpm</div>
                            <div>{reading.bloodSugar} mg/dL</div>
                            <div>{reading.oxygenLevel}%</div>
                            <div>{reading.temperature}°F</div>
                            <div>{reading.respiratoryRate}/min</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Blood Pressure Trends</CardTitle>
                      <CardDescription>Monthly averages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { month: 'Jan', systolic: 118, diastolic: 78 },
                            { month: 'Feb', systolic: 120, diastolic: 80 },
                            { month: 'Mar', systolic: 123, diastolic: 82 },
                            { month: 'Apr', systolic: 125, diastolic: 83 },
                            { month: 'May', systolic: 122, diastolic: 81 },
                            { month: 'Jun', systolic: 119, diastolic: 79 },
                          ]} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} />
                            <YAxis tickLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} />
                            <Line type="monotone" dataKey="diastolic" stroke="#0ea5e9" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Heart Rate Variability</CardTitle>
                      <CardDescription>Weekly min, max and average</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { week: 'Week 1', min: 58, max: 100, avg: 72 },
                            { week: 'Week 2', min: 60, max: 110, avg: 75 },
                            { week: 'Week 3', min: 55, max: 105, avg: 73 },
                            { week: 'Week 4', min: 57, max: 98, avg: 70 },
                          ]} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="week" tickLine={false} />
                            <YAxis tickLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="min" stroke="#0ea5e9" strokeWidth={2} />
                            <Line type="monotone" dataKey="max" stroke="#f43f5e" strokeWidth={2} />
                            <Line type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Long-term Health Analysis</CardTitle>
                    <CardDescription>Yearly trends based on your vitals history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Blood Pressure Analysis</h3>
                        <p>Your average blood pressure shows a slight upward trend over the past 6 months. While still within normal range, this trend suggests monitoring more closely.</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Heart Health</h3>
                        <p>Your resting heart rate has remained stable, indicating good cardiovascular fitness. Continuing with regular exercise will help maintain this trend.</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Blood Glucose Patterns</h3>
                        <p>Morning blood sugar readings show consistent levels, but there are occasional spikes after dinner. Consider reviewing your evening meal composition.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 