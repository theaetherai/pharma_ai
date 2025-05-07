"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Heart, 
  Info, 
  RefreshCw, 
  Share2, 
  Utensils, 
  FileQuestion,
  Brain,
  Smile
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";

export default function HealthScorePage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Sample health score data
  const healthScore = {
    overall: 82,
    components: [
      { name: "Cardiovascular", score: 85, icon: <Heart className="h-5 w-5" /> },
      { name: "Respiratory", score: 88, icon: <Smile className="h-5 w-5" /> },
      { name: "Metabolic", score: 72, icon: <Utensils className="h-5 w-5" /> },
      { name: "Activity", score: 76, icon: <Activity className="h-5 w-5" /> },
      { name: "Mental", score: 89, icon: <Brain className="h-5 w-5" /> }
    ],
    history: [
      { month: "Jan", score: 76 },
      { month: "Feb", score: 78 },
      { month: "Mar", score: 75 },
      { month: "Apr", score: 80 },
      { month: "May", score: 79 },
      { month: "Jun", score: 81 },
      { month: "Jul", score: 82 }
    ],
    insights: [
      "Your cardiovascular health has improved by 5% since last month",
      "Consider increasing daily hydration for better metabolic health",
      "Your mental wellness score is excellent - keep up your routine!",
      "Try to increase daily steps from 7,000 to 8,000 for improved activity score"
    ]
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Health Score</h1>
            <p className="text-muted-foreground">Comprehensive analysis of your overall health</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Score
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share with Doctor
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle>Overall Health Score</CardTitle>
                  <CardDescription>Based on all health factors</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Score", value: healthScore.overall },
                              { name: "Remaining", value: 100 - healthScore.overall }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell key={`cell-0`} fill="#4ade80" />
                            <Cell key={`cell-1`} fill="#f3f4f6" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-4xl font-bold">{healthScore.overall}</div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-sm text-muted-foreground">
                      {healthScore.overall >= 80 ? "Excellent" : 
                       healthScore.overall >= 70 ? "Good" : 
                       healthScore.overall >= 60 ? "Fair" : "Needs Attention"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Health History</CardTitle>
                  <CardDescription>Six month trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={healthScore.history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[50, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Insights</CardTitle>
                <CardDescription>Areas to focus on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {healthScore.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-primary mt-0.5" />
                      <p>{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle>Score Breakdown</CardTitle>
                  <CardDescription>Individual health components</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={healthScore.components}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="score"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {healthScore.components.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Component Details</CardTitle>
                  <CardDescription>Detailed breakdown by health area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthScore.components.map((component, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          {component.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{component.name}</span>
                            <span className="font-bold">{component.score}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full" 
                              style={{ 
                                width: `${component.score}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Score History</CardTitle>
                <CardDescription>See how your health has changed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={healthScore.history}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[50, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" name="Health Score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5" />
                  Health Recommendations
                </CardTitle>
                <CardDescription>Personalized advice based on your health data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Cardiovascular Health</h3>
                    <p>Your cardiovascular score is good. Consider adding more omega-3 rich foods to your diet and maintain your current exercise routine.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Metabolic Health</h3>
                    <p>Your metabolic score has room for improvement. Consider reducing processed sugar intake and increasing fiber-rich foods in your diet.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Physical Activity</h3>
                    <p>You're on the right track with your activity levels. Try to incorporate more strength training to complement your cardio exercises.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Mental Wellness</h3>
                    <p>Your mental wellness score is excellent. Continue your current stress management practices and consider adding more mindfulness exercises.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
} 