"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface AnalyticsRefreshProps {
  className?: string;
}

function AnalyticsRefreshComponent({ className = "" }: AnalyticsRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();

  // Handle manual refresh with useCallback to prevent recreation on re-renders
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    
    // Use Next.js router to refresh the current page
    router.refresh();
    
    // Reset countdown
    setCountdown(60);
    
    // Simulate refresh completion after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [router]);

  // Toggle auto-refresh with useCallback
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;
    
    if (autoRefresh) {
      // Reset countdown
      setCountdown(60);
      
      // Set up countdown timer
      countdownTimer = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      // Set up refresh timer
      timer = setInterval(refreshData, 60000); // Refresh every 60 seconds
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(countdownTimer);
    };
  }, [autoRefresh, refreshData]);

  // Computed progress value to avoid frequent recalculations
  const progressValue = (countdown / 60) * 100;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto refresh:</span>
                <button 
                  onClick={toggleAutoRefresh}
                  className={`w-8 h-4 rounded-full transition-colors flex items-center ${
                    autoRefresh ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="block w-3 h-3 bg-white rounded-full mx-0.5"></span>
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto refresh analytics every 60 seconds</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {autoRefresh && (
          <div className="flex items-center gap-1">
            <Progress value={progressValue} className="h-1 w-16" />
            <span className="text-xs text-muted-foreground">{countdown}s</span>
          </div>
        )}
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1" 
        onClick={refreshData}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AnalyticsRefreshComponent); 