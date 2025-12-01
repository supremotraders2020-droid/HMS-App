import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  History, 
  BarChart3,
  FileText,
  Clock,
  HelpCircle,
  Shield,
  UserCheck,
  Phone,
  AlertTriangle,
  Loader2
} from "lucide-react";
import type { ConversationLog } from "@shared/schema";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: string;
  timestamp: Date;
}

interface ChatbotStats {
  totalQueries: number;
  byCategory: Record<string, number>;
}

export default function ChatbotService() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Galaxy Multi Specialty Hospital! I'm your AI assistant. I can help you with:\n\n• Hospital services and departments\n• Doctor availability and appointments\n• Insurance queries\n• Emergency information\n• General health inquiries\n\nHow can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: logs = [], isLoading: logsLoading } = useQuery<ConversationLog[]>({
    queryKey: ["/api/chatbot/logs"],
  });

  const { data: stats } = useQuery<ChatbotStats>({
    queryKey: ["/api/chatbot/stats"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/chatbot/message", { query });
      return response.json() as Promise<{ response: string; category: string; logId: string }>;
    },
    onSuccess: (data: { response: string; category: string; logId: string }) => {
      const assistantMessage: ChatMessage = {
        id: data.logId,
        role: "assistant",
        content: data.response,
        category: data.category,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "insurance": return <Shield className="h-3 w-3" />;
      case "doctor_availability": return <UserCheck className="h-3 w-3" />;
      case "contact": return <Phone className="h-3 w-3" />;
      case "emergency": return <AlertTriangle className="h-3 w-3" />;
      case "services": return <HelpCircle className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      insurance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      doctor_availability: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      contact: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      emergency: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      services: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      general: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return styles[category] || styles.general;
  };

  const formatCategoryName = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const quickQuestions = [
    "What are your hospital timings?",
    "Which insurance providers do you accept?",
    "How can I book an appointment?",
    "What departments are available?",
    "What is your emergency contact?",
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Chatbot Service</h1>
            <p className="text-muted-foreground">Intelligent assistant for hospital queries</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="chat" className="flex items-center gap-2" data-testid="tab-chat">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2" data-testid="tab-logs">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2" data-testid="tab-stats">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2" data-testid="tab-docs">
            <FileText className="h-4 w-4" />
            API Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Hospital AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className={`flex flex-col gap-1 max-w-[80%] ${message.role === "user" ? "items-end" : ""}`}>
                          <div className={`rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}>
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {message.timestamp.toLocaleTimeString()}
                            {message.category && (
                              <Badge className={`${getCategoryBadge(message.category)} text-xs`}>
                                {getCategoryIcon(message.category)}
                                <span className="ml-1">{formatCategoryName(message.category)}</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {sendMessageMutation.isPending && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={sendMessageMutation.isPending}
                      data-testid="input-chat-message"
                    />
                    <Button 
                      type="submit" 
                      disabled={sendMessageMutation.isPending || !inputMessage.trim()}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto py-2 text-xs"
                      onClick={() => {
                        setInputMessage(question);
                      }}
                      data-testid={`button-quick-question-${index}`}
                    >
                      {question}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {["general", "insurance", "doctor_availability", "services", "contact", "emergency"].map((category) => (
                    <div key={category} className="flex items-center gap-2">
                      <Badge className={getCategoryBadge(category)}>
                        {getCategoryIcon(category)}
                        <span className="ml-1">{formatCategoryName(category)}</span>
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Conversation Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversation logs yet</p>
                  <p className="text-sm">Start chatting to see logs here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <p className="font-medium text-sm">{log.query}</p>
                          </div>
                          <div className="flex items-start gap-2 pl-6">
                            <Bot className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-muted-foreground line-clamp-2">{log.response}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {log.category && (
                            <Badge className={getCategoryBadge(log.category)}>
                              {formatCategoryName(log.category)}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalQueries || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Queries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats?.byCategory && Object.entries(stats.byCategory).slice(0, 3).map(([category, count]) => (
              <Card key={category}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count as number}</p>
                      <p className="text-sm text-muted-foreground">{formatCategoryName(category)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Query Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.byCategory && Object.keys(stats.byCategory).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.byCategory).map(([category, count]) => {
                    const percentage = stats.totalQueries > 0 
                      ? Math.round((count as number / stats.totalQueries) * 100) 
                      : 0;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            <span className="font-medium">{formatCategoryName(category)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{count as number} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No statistics available yet</p>
                  <p className="text-sm">Chat with the assistant to generate data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chatbot Service API Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endpoints</h3>
                
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">POST</Badge>
                    <code className="text-sm font-mono">/api/chatbot/message</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Send a message to the chatbot and get a response</p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs font-medium mb-1">Request Body:</p>
                    <pre className="text-xs overflow-auto">{`{
  "query": "What are your hospital timings?",
  "userId": "optional-user-id"
}`}</pre>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">GET</Badge>
                    <code className="text-sm font-mono">/api/chatbot/logs</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Get conversation logs with optional filtering</p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs font-medium mb-1">Query Parameters:</p>
                    <pre className="text-xs overflow-auto">{`?userId=user-id&limit=50`}</pre>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">GET</Badge>
                    <code className="text-sm font-mono">/api/chatbot/logs/category/:category</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get logs filtered by category (insurance, doctor_availability, etc.)</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">GET</Badge>
                    <code className="text-sm font-mono">/api/chatbot/stats</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get chatbot usage statistics</p>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["general", "insurance", "doctor_availability", "services", "contact", "emergency"].map((category) => (
                    <div key={category} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      {getCategoryIcon(category)}
                      <code className="text-xs">{category}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Features</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>AI-powered responses using OpenAI GPT-4o</li>
                  <li>Automatic query categorization</li>
                  <li>Conversation logging for analytics</li>
                  <li>Fallback responses when AI is unavailable</li>
                  <li>Hospital-specific knowledge base</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
