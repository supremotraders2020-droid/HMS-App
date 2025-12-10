import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface FloatingChatButtonProps {
  onNavigate?: (path: string) => void;
}

export default function FloatingChatButton({ onNavigate }: FloatingChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate("/chatbot-service");
    } else {
      setLocation("/chatbot-service");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="floating-chat-container">
      <div className="relative">
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-3 whitespace-nowrap animate-fade-in">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg shadow-violet-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                GRAVITY HOSPITAL AI ASSISTANCE
              </div>
              <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-purple-600"></div>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            group relative overflow-visible
            h-14 w-14 rounded-full p-0
            bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500
            hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600
            shadow-lg shadow-violet-500/40
            hover:shadow-xl hover:shadow-violet-500/50
            transition-all duration-500 ease-out
            hover:scale-110
            border-2 border-white/20
          `}
          data-testid="button-floating-chat"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex items-center justify-center">
            <MessageCircle 
              className={`
                h-6 w-6 text-white
                transition-all duration-300
                ${isHovered ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}
              `} 
            />
            <Sparkles 
              className={`
                absolute h-6 w-6 text-white
                transition-all duration-300
                ${isHovered ? 'scale-100 rotate-0' : 'scale-0 -rotate-180'}
              `}
            />
          </div>

          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        </Button>

        <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
      </div>
    </div>
  );
}
