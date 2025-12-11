import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Clock,
  HelpCircle,
  Shield,
  UserCheck,
  Phone,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: string;
  timestamp: Date;
}

export default function ChatbotService() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Gravity Hospital! I'm your AI assistant. I can help you with:\n\n• Hospital services and departments\n• Doctor availability and appointments\n• Insurance queries\n• Emergency information\n• General health inquiries\n\nHow can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
            <h1 className="text-2xl font-bold text-foreground">GRAVITY HOSPITAL AI ASSISTANCE</h1>
            <p className="text-muted-foreground">Your intelligent healthcare assistant</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="border-b bg-gradient-to-r from-violet-50/80 to-purple-50/60 dark:from-violet-900/20 dark:to-purple-900/15">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Bot className="h-5 w-5" />
              </div>
              GRAVITY HOSPITAL AI ASSISTANCE
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
    </div>
  );
}
