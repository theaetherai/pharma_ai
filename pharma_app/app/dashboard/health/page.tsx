"use client";

import { useState } from "react";
import { 
  ChartCard, 
  BloodPressureChart, 
  HeartRateChart, 
  SleepChart, 
  ActivityChart, 
  NutritionChart, 
  HealthScoreChart, 
  generateSampleData 
} from "@/components/health-charts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, Printer, Share2 } from "lucide-react";

export default function HealthPage() {
  const [timeRange, setTimeRange] = useState("week");
  const chartData = generateSampleData();
  
  const nutritionColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];
  
  return (
    <div className="w-full flex flex-col gap-4 px-0 sm:px-2 md:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Health Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your health metrics and track progress over time
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2">
          <ChartCard 
            title="Health Score"
            description="Your overall health score based on all metrics"
            infoTooltip="Calculated from vitals, activity, nutrition, and sleep patterns"
            footerContent={
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">Tip:</span> Increasing daily activity by 2000 steps could improve your score by 3 points.
              </div>
            }
          >
            <HealthScoreChart data={chartData.healthScore} />
          </ChartCard>
        </div>
        
        <div>
          <ChartCard
            title="Daily Activity"
            description="Progress towards your daily health goals"
          >
            <ActivityChart data={chartData.activity} />
          </ChartCard>
        </div>
      </div>
      
      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard 
              title="Blood Pressure"
              description="Systolic and diastolic readings over time"
              infoTooltip="Normal range: 90-120/60-80 mmHg"
              footerContent={
                <div className="flex justify-between w-full">
                  <span className="text-sm">Average: 121/81</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Printer className="h-4 w-4 mr-1" /> Print
                    </Button>
                  </div>
                </div>
              }
            >
              <BloodPressureChart data={chartData.bloodPressure} />
            </ChartCard>
            
            <ChartCard 
              title="Heart Rate"
              description="Average beats per minute (BPM)"
              infoTooltip="Normal resting heart rate: 60-100 BPM"
            >
              <HeartRateChart data={chartData.heartRate} />
            </ChartCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Oxygen Saturation" description="Average: 98%">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground mt-2">Optimal Range (95-100%)</div>
              </div>
            </ChartCard>
            
            <ChartCard title="Body Temperature" description="Average: 98.6°F">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-primary">98.6°F</div>
                <div className="text-sm text-muted-foreground mt-2">Normal Range (97-99°F)</div>
              </div>
            </ChartCard>
            
            <ChartCard title="Respiratory Rate" description="Average: 16 breaths/min">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-primary">16</div>
                <div className="text-sm text-muted-foreground mt-2">Normal Range (12-20 breaths/min)</div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard 
              title="Daily Steps"
              description="Steps taken each day against your goal"
            >
              <div className="h-[300px] flex flex-col items-center justify-center">
                <div className="text-6xl font-bold text-primary">8,532</div>
                <div className="text-xl text-muted-foreground mt-2">of 10,000 daily goal</div>
                <div className="w-full max-w-xs bg-muted rounded-full h-4 mt-4">
                  <div className="bg-primary rounded-full h-4" style={{ width: '85%' }}></div>
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  1,468 more steps to reach your daily goal
                </div>
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Active Minutes"
              description="Time spent in different activity zones"
            >
              <div className="h-[300px] flex flex-col items-center justify-center">
                <div className="grid grid-cols-3 w-full max-w-md gap-4">
                  <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-primary">15</div>
                    <div className="text-xs text-center text-muted-foreground mt-1">Vigorous Minutes</div>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-primary">30</div>
                    <div className="text-xs text-center text-muted-foreground mt-1">Moderate Minutes</div>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-primary">120</div>
                    <div className="text-xs text-center text-muted-foreground mt-1">Light Minutes</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-6">
                  You've achieved 75% of your daily active minute goal
                </div>
              </div>
            </ChartCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Distance" description="5.2 mi today">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-primary">5.2 mi</div>
                <div className="text-sm text-muted-foreground mt-2">Goal: 8 mi</div>
              </div>
            </ChartCard>
            
            <ChartCard title="Calories" description="2,250 kcal burned">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-primary">2,250</div>
                <div className="text-sm text-muted-foreground mt-2">Goal: 2,500 kcal</div>
              </div>
            </ChartCard>
            
            <ChartCard title="Floors Climbed" description="12 floors today">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground mt-2">Goal: 15 floors</div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="nutrition" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard 
              title="Macronutrient Distribution"
              description="Daily breakdown of protein, carbs, and fat"
            >
              <NutritionChart 
                data={chartData.nutrition} 
                colors={nutritionColors} 
              />
            </ChartCard>
            
            <ChartCard 
              title="Calorie Balance"
              description="Calories consumed vs. calories burned"
            >
              <div className="h-[300px] flex flex-col items-center justify-center">
                <div className="grid grid-cols-2 w-full max-w-md gap-6">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold text-primary">2,450</div>
                    <div className="text-sm text-muted-foreground mt-1">Calories In</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold text-primary">2,250</div>
                    <div className="text-sm text-muted-foreground mt-1">Calories Out</div>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <div className="text-lg font-medium">Net: </div>
                  <div className="text-xl font-bold text-amber-500">+200 calories</div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  You're slightly over your daily calorie goal
                </div>
              </div>
            </ChartCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ChartCard title="Protein" description="92g consumed">
              <div className="flex flex-col items-center justify-center h-[150px]">
                <div className="text-4xl font-bold text-primary">92g</div>
                <div className="text-sm text-muted-foreground mt-2">Goal: 120g</div>
                <div className="w-full max-w-xs bg-muted rounded-full h-3 mt-3">
                  <div className="bg-primary rounded-full h-3" style={{ width: '77%' }}></div>
                </div>
              </div>
            </ChartCard>
            
            <ChartCard title="Carbs" description="230g consumed">
              <div className="flex flex-col items-center justify-center h-[150px]">
                <div className="text-4xl font-bold text-primary">230g</div>
                <div className="text-sm text-muted-foreground mt-2">Goal: 225g</div>
                <div className="w-full max-w-xs bg-muted rounded-full h-3 mt-3">
                  <div className="bg-amber-500 rounded-full h-3" style={{ width: '102%' }}></div>
                </div>
              </div>
            </ChartCard>
            
            <ChartCard title="Fat" description="65g consumed">
              <div className="flex flex-col items-center justify-center h-[150px]">
                <div className="text-4xl font-bold text-primary">65g</div>
                <div className="text-sm text-muted-foreground mt-2">Goal: 70g</div>
                <div className="w-full max-w-xs bg-muted rounded-full h-3 mt-3">
                  <div className="bg-primary rounded-full h-3" style={{ width: '93%' }}></div>
                </div>
              </div>
            </ChartCard>
            
            <ChartCard title="Fiber" description="24g consumed">
              <div className="flex flex-col items-center justify-center h-[150px]">
                <div className="text-4xl font-bold text-primary">24g</div>
                <div className="text-sm text-muted-foreground mt-2">Goal: 35g</div>
                <div className="w-full max-w-xs bg-muted rounded-full h-3 mt-3">
                  <div className="bg-primary rounded-full h-3" style={{ width: '69%' }}></div>
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="sleep" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard 
              title="Sleep Cycle Analysis"
              description="Time spent in each sleep stage"
            >
              <SleepChart data={chartData.sleep} />
            </ChartCard>
            
            <ChartCard 
              title="Sleep Duration"
              description="Hours of sleep per night"
            >
              <div className="h-[300px] flex flex-col items-center justify-center">
                <div className="text-6xl font-bold text-primary">7.2</div>
                <div className="text-xl text-muted-foreground mt-2">hours last night</div>
                <div className="flex gap-2 items-center mt-4">
                  <div className="text-sm text-muted-foreground">Weekly average: </div>
                  <div className="text-md font-medium">7.5 hours</div>
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  <span className="text-amber-500 font-medium">Recommendation:</span> Aim for 7.5-8 hours of sleep
                </div>
              </div>
            </ChartCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Sleep Quality" description="Sleep efficiency score">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-primary">84%</div>
                <div className="text-sm text-muted-foreground mt-2">Good (80-89%)</div>
                <div className="w-full max-w-xs bg-muted rounded-full h-3 mt-4">
                  <div className="bg-primary rounded-full h-3" style={{ width: '84%' }}></div>
                </div>
              </div>
            </ChartCard>
            
            <ChartCard title="Sleep Schedule" description="Sleep and wake times">
              <div className="flex flex-col items-center justify-center h-[200px] gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Bedtime</div>
                  <div className="text-3xl font-bold text-primary">11:30 PM</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Wake time</div>
                  <div className="text-3xl font-bold text-primary">6:45 AM</div>
                </div>
              </div>
            </ChartCard>
            
            <ChartCard title="Sleep Consistency" description="Variation in sleep schedule">
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-amber-500">±45</div>
                <div className="text-sm text-muted-foreground mt-2">minutes variation</div>
                <div className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
                  Try to keep your sleep schedule consistent to improve sleep quality
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" /> Export Report
        </Button>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" /> Share with Doctor
        </Button>
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>
    </div>
  );
} 