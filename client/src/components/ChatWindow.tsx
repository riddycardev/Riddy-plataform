import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface ChatWindowProps {
  conversationId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  onClose?: () => void;
}

export default function ChatWindow({
  conversationId,
  otherUserName,
  otherUserAvatar,
  onClose,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messagesData, isLoading: isLoadingMessages } = trpc.message.getMessages.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  );

  // Send message mutation
  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setInputValue("");
      // Refetch messages
      trpc.useUtils().message.getMessages.invalidate({ conversationId });
    },
  });

  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: inputValue,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-cyan-500/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback>{otherUserName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{otherUserName}</h3>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Nenhuma mensagem ainda. Comece a conversa!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.senderId === user?.id
                      ? "bg-cyan-500 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-cyan-500/30">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="border-cyan-500/50"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
