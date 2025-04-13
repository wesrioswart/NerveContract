import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { ChatMessage } from "@shared/schema";
import { Bot, User, Send, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

type ChatInterfaceProps = {
  projectId: number;
  userId: number;
};

export default function ChatInterface({ projectId, userId }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: chatMessages = [], isLoading, isError } = useQuery<ChatMessage[]>({
    queryKey: [`/api/projects/${projectId}/chat-messages`],
    staleTime: 10000, // 10 seconds
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Ensure type safety
  const messages: ChatMessage[] = chatMessages as ChatMessage[];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
        // Convert the date to ISO string format for consistent handling
        const timestamp = new Date().toISOString();
        console.log("Sending chat message with timestamp:", timestamp);
        
        const response = await apiRequest("POST", "/api/chat-messages", {
          projectId,
          userId,
          role: "user",
          content,
          timestamp,
        });
        
        return await response.json();
      } catch (error) {
        console.error("Error in mutation function:", error);
        throw error; // Re-throw for the mutation to handle
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/chat-messages`] });
    },
    onError: (error: unknown) => {
      console.error("Mutation error:", error);
      // Could add a toast notification here in a future update
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const tempMessage = message;
    setMessage("");
    
    try {
      await sendMessageMutation.mutateAsync(tempMessage);
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      // Show an error message to the user - in a production app, we would use a toast notification
      setMessage(tempMessage); // Restore the original message so the user can try again
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
  
  const welcomeMessage = `## Welcome to NEC4 Contract Consultant

I'm your expert NEC4 contract consultant. I can help with:

* **Contract interpretation** and clause explanations
* **Process guidance** for compensation events, early warnings and PMIs
* **Risk management** strategies under NEC4 provisions
* **Programme compliance** with contract requirements

How can I assist with your NEC4 contract today?`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">AI Contract Assistant</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4 h-80 overflow-y-auto">
        {showWelcomeMessage && (
          <div className="flex mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3 max-w-3xl break-words prose prose-sm prose-blue prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ul:pl-4 prose-li:my-0">
              <div className="text-sm">
                <ReactMarkdown>{welcomeMessage}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
            <span>Loading messages...</span>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <div 
              key={msg.id} 
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3 flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              
              <div className={`${
                msg.role === 'user' 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100'
              } rounded-lg p-3 max-w-[70%] break-words prose prose-sm prose-blue prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ul:pl-4 prose-li:my-0`}>
                {msg.role === 'assistant' ? (
                  <div className="text-sm selection:bg-blue-200 selection:text-blue-800">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap selection:bg-blue-200 selection:text-blue-800">{msg.content}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(msg.timestamp, "h:mm a")}
                </p>
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-3 flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
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
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Ask
        </Button>
      </div>
    </div>
  );
}
