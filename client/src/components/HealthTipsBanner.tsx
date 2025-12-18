import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb,
  Sun,
  Moon,
  CloudRain,
  Leaf,
  Apple,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: string;
  weatherContext: string | null;
  season: string | null;
  priority: string;
  targetAudience: string;
  scheduledFor: string | null;
  generatedAt: string;
  isActive: boolean;
}

interface HealthTipsBannerProps {
  showGenerateButton?: boolean;
  compact?: boolean;
}

export default function HealthTipsBanner({ showGenerateButton = false, compact = false }: HealthTipsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [dismissed, setDismissed] = useState(false);
  const [realtimeTip, setRealtimeTip] = useState<HealthTip | null>(null);
  const { toast } = useToast();

  const { data: latestTip, isLoading, refetch } = useQuery<HealthTip | null>({
    queryKey: ["/api/health-tips/latest"],
  });

  const { data: allTips } = useQuery<HealthTip[]>({
    queryKey: ["/api/health-tips/active"],
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications?userId=health_tips_listener&userRole=LISTENER`;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "health_tip" && data.event === "new_health_tip") {
          setRealtimeTip(data.tip);
          setDismissed(false);
          toast({
            title: "New Health Tip!",
            description: data.tip.title,
            duration: 10000,
          });
          refetch();
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [toast, refetch]);

  const handleGenerate = async () => {
    try {
      const hour = new Date().getHours();
      const scheduledFor = hour < 12 ? "9AM" : "9PM";
      
      toast({
        title: "Generating Health Tip...",
        description: "AI is creating a personalized health tip for you.",
      });

      const response = await apiRequest("POST", "/api/health-tips/generate", { scheduledFor });
      const tip = await response.json();
      
      toast({
        title: "Health Tip Generated!",
        description: tip.title,
        duration: 5000,
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate health tip",
        variant: "destructive",
      });
    }
  };

  const displayTip = realtimeTip || latestTip;

  if (dismissed || (!displayTip && !isLoading)) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "weather":
        return <CloudRain className="h-4 w-4" />;
      case "climate":
        return <Sun className="h-4 w-4" />;
      case "diet":
        return <Apple className="h-4 w-4" />;
      case "seasonal":
        return <Leaf className="h-4 w-4" />;
      case "trending":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "weather":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "climate":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "diet":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "seasonal":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "trending":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    }
  };

  const getTimeIcon = (scheduledFor: string | null) => {
    return scheduledFor === "9PM" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-amber-50/80 to-yellow-50/60 dark:from-amber-900/20 dark:to-yellow-900/15 border-amber-200 dark:border-amber-800/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 animate-pulse">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-amber-200/50 dark:bg-amber-800/30 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!displayTip) {
    return null;
  }

  return (
    <Card 
      className="bg-gradient-to-r from-amber-50/80 via-yellow-50/60 to-orange-50/40 dark:from-amber-900/20 dark:via-yellow-900/15 dark:to-orange-900/10 border-amber-200 dark:border-amber-800/30 overflow-hidden"
      data-testid="card-health-tip"
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                AI Health Tip
                {realtimeTip && (
                  <Badge className="bg-green-500 text-white text-xs animate-pulse">NEW</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {getTimeIcon(displayTip.scheduledFor)}
                <span>{displayTip.scheduledFor || "Daily"} Edition</span>
                <span className="text-amber-400">|</span>
                <span>{new Date(displayTip.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showGenerateButton && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                className="h-8 text-xs border-amber-300 dark:border-amber-700"
                data-testid="button-generate-health-tip"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate New
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
              data-testid="button-toggle-health-tip"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              data-testid="button-dismiss-health-tip"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-2 pb-4 px-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getCategoryColor(displayTip.category)}>
                {getCategoryIcon(displayTip.category)}
                <span className="ml-1 capitalize">{displayTip.category}</span>
              </Badge>
              <Badge className={getPriorityColor(displayTip.priority)}>
                {displayTip.priority.charAt(0).toUpperCase() + displayTip.priority.slice(1)} Priority
              </Badge>
              {displayTip.season && (
                <Badge variant="outline" className="border-amber-300 dark:border-amber-700">
                  <Leaf className="h-3 w-3 mr-1" />
                  {displayTip.season.charAt(0).toUpperCase() + displayTip.season.slice(1)}
                </Badge>
              )}
            </div>

            <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/30">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                {displayTip.title}
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                {displayTip.content}
              </p>
            </div>

            {displayTip.weatherContext && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CloudRain className="h-3 w-3" />
                <span>Weather context: {displayTip.weatherContext}</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
