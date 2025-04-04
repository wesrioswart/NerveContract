import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { ChatMessage } from "@shared/schema";

type ChatInterfaceProps = {
  projectId: number;
  userId: number;
};

export default function ChatInterface({ projectId, userId }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: chatMessages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/projects/${projectId}/chat-messages`],
    staleTime: 10000, // 10 seconds
  });
  
  // Ensure type safety
  const messages: ChatMessage[] = chatMessages as ChatMessage[];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Convert the date to ISO string format for consistent handling
      const timestamp = new Date().toISOString();
      console.log("Sending chat message with timestamp:", timestamp);
      
      return apiRequest("POST", "/api/chat-messages", {
        projectId,
        userId,
        role: "user",
        content,
        timestamp,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/chat-messages`] });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const tempMessage = message;
    setMessage("");
    
    try {
      await sendMessageMutation.mutateAsync(tempMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If there are no messages yet, show welcome message
  const showWelcomeMessage = messages.length === 0 && !isLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">AI Contract Assistant</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4 h-80 overflow-y-auto">
        {showWelcomeMessage && (
          <div className="flex mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3 flex-shrink-0">
              <span className="material-icons text-sm">smart_toy</span>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 max-w-3xl break-words">
              <p className="text-sm">
                Hello! I'm your NEC4 Assistant. I can help with contract queries, summarize events, or explain clauses. How can I help you today?
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="material-icons animate-spin text-primary">refresh</span>
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <div 
              key={msg.id} 
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3 flex-shrink-0">
                  <span className="material-icons text-sm">smart_toy</span>
                </div>
              )}
              
              <div className={`${
                msg.role === 'user' 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100'
              } rounded-lg p-3 max-w-[70%] break-words`}>
                <p className="text-sm whitespace-pre-wrap selection:bg-blue-200 selection:text-blue-800">{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(msg.timestamp, "h:mm a")}
                </p>
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-3 flex-shrink-0">
                  <span className="material-icons text-sm text-gray-500">person</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about NEC4 clauses, CE status, or project queries..."
          className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className="bg-primary hover:bg-blue-800 text-white px-4 rounded-r-lg flex items-center"
        >
          {sendMessageMutation.isPending ? (
            <span className="material-icons animate-spin mr-1">refresh</span>
          ) : (
            <span className="material-icons mr-1">send</span>
          )}
          Ask
        </Button>
      </div>
    </div>
  );
}
