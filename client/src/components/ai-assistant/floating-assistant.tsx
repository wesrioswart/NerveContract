import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@shared/schema";
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  Send,
  Loader2,
  FileText,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/contexts/project-context";

interface FloatingAssistantProps {
  userId: number;
  currentForm?: string; // Optional form context to give AI context about current page
  currentData?: Record<string, any>; // Optional current form data for context
}

export default function FloatingAssistant({ 
  userId,
  currentForm,
  currentData
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { projectId } = useProject();
  const queryClient = useQueryClient();

  // Get chat history with improved caching
  const queryKey = `/api/projects/${projectId}/chat-messages`;
  const fetchChatMessages = useQuery<ChatMessage[]>({
    queryKey: [queryKey],
    enabled: projectId > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });
  
  const chatMessages = fetchChatMessages.data || [];
  const messagesLoading = fetchChatMessages.isLoading;

  // Optimistic UI: Show user message immediately while waiting for response
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  
  // Auto-scroll to latest messages when chat is opened or messages are updated
  useEffect(() => {
    if (!isMinimized && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      
      // Focus the textarea when opening the chat
      if (isOpen && textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [chatMessages, optimisticMessages, isMinimized, isOpen]);
  
  // Pre-fetch messages silently before opening the chat
  useEffect(() => {
    if (projectId > 0 && !isOpen) {
      // Using prefetchQuery to load messages in the background
      void fetchChatMessages.refetch();
    }
  }, [projectId, isOpen, fetchChatMessages]);

  // Create a new message with optimistic UI
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        projectId,
        userId,
        role: "user",
        content,
        timestamp: new Date().toISOString()
      };
      
      // Add optimistic user message to UI immediately
      const optimisticUserMsg = {
        id: Date.now(), // Temporary ID
        projectId,
        userId,
        role: "user" as const,
        content,
        timestamp: new Date() // Use Date object to match type
      } as ChatMessage;
      setOptimisticMessages(prev => [...prev, optimisticUserMsg]);
      
      const response = await apiRequest("POST", "/api/chat-messages", messageData);
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Reset message input and refresh chat messages
      setMessage("");
      setOptimisticMessages([]); // Clear optimistic messages since we'll get real ones
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      
      // Focus the textarea for the next message
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    onError: (error: Error) => {
      // Clear optimistic messages on error
      setOptimisticMessages([]);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form auto-population
  const populateFormMutation = useMutation({
    mutationFn: async (formType: string) => {
      const requestData = {
        projectId,
        formType,
        currentData: currentData || {}
      };
      
      const response = await apiRequest("POST", "/api/ai-assistant/populate-form", requestData);
      
      if (!response.ok) {
        throw new Error("Failed to generate form data");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Form populated",
        description: "AI has suggested form values based on your project context",
      });
      // Return the populated form data via callback or event
      if (window) {
        const event = new CustomEvent('ai-form-populated', { 
          detail: { formData: data.formData }
        });
        window.dispatchEvent(event);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error populating form",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  // Auto-populate the current form
  const handlePopulateForm = () => {
    if (!currentForm) {
      toast({
        title: "No form detected",
        description: "Unable to detect a form to populate on this page",
        variant: "destructive"
      });
      return;
    }
    
    populateFormMutation.mutate(currentForm);
  };

  // Toggle chat interface open/closed
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  // Toggle minimized state
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Format relative time for messages
  const formatRelativeTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <>
      {/* Chat button (always visible) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          className={`rounded-full w-14 h-14 p-0 shadow-lg ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </Button>
      </div>

      {/* Chat interface */}
      {isOpen && (
        <div 
          className={`fixed z-40 transition-all duration-300 ease-in-out shadow-xl rounded-lg ${
            isMinimized 
              ? 'bottom-20 right-6 w-72 h-16' 
              : 'bottom-24 right-6 w-96 h-[500px] max-h-[80vh]'
          }`}
        >
          <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium">NEC4 AI Assistant</h3>
              <div className="flex space-x-2">
                <button onClick={toggleMinimize} className="text-white hover:text-blue-100">
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
              </div>
            </div>

            {/* Minimized view */}
            {isMinimized && (
              <div className="flex-1 p-3 flex items-center justify-between bg-white">
                <span className="text-sm font-medium">Ask me about NEC4...</span>
              </div>
            )}

            {/* Full view */}
            {!isMinimized && (
              <>
                {/* Messages container */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 bg-gray-50" 
                  id="chat-messages-container"
                >
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-gray-600">Loading messages...</span>
                    </div>
                  ) : chatMessages.length === 0 && optimisticMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <h4 className="font-medium text-gray-600 mb-1">NEC4 AI Assistant</h4>
                      <p className="text-sm">Ask me about NEC4 contracts using everyday language!</p>
                      <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-3 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium text-gray-600">Examples:</p>
                          <div className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center text-[10px]">
                            <HelpCircle size={12} className="mr-1" />
                            EVERYDAY LANGUAGE GUIDE
                          </div>
                        </div>
                        <ul className="list-disc pl-4 space-y-2 text-left">
                          <li className="hover:bg-gray-200 rounded px-1 py-0.5 cursor-pointer transition-colors"
                            onClick={() => setMessage("What happens if the project gets delayed?")}
                          >
                            "What happens if the project gets delayed?"
                          </li>
                          <li className="hover:bg-gray-200 rounded px-1 py-0.5 cursor-pointer transition-colors"
                            onClick={() => setMessage("What should I do if a subcontractor isn't performing well?")}
                          >
                            "What should I do if a subcontractor isn't performing well?"
                          </li>
                          <li className="hover:bg-gray-200 rounded px-1 py-0.5 cursor-pointer transition-colors"
                            onClick={() => setMessage("Who is responsible for quality issues?")}
                          >
                            "Who is responsible for quality issues?"
                          </li>
                          <li className="hover:bg-gray-200 rounded px-1 py-0.5 cursor-pointer transition-colors"
                            onClick={() => setMessage("How do I get paid if the project changes?")}
                          >
                            "How do I get paid if the project changes?"
                          </li>
                        </ul>
                      </div>
                      
                      {currentForm && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={handlePopulateForm}
                          disabled={populateFormMutation.isPending}
                        >
                          {populateFormMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Populating...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Help fill this form
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end mb-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs py-0 h-6 text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            setIsRefreshing(true);
                            fetchChatMessages.refetch().finally(() => setIsRefreshing(false));
                          }}
                          disabled={isRefreshing || fetchChatMessages.isFetching}
                        >
                          {isRefreshing || fetchChatMessages.isFetching ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Refresh
                        </Button>
                      </div>
                      
                      {/* Show real messages */}
                      {[...chatMessages]
                        .slice(-7) // Get the last 7 messages
                        .map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`
                              rounded-lg px-4 py-2 max-w-xs sm:max-w-sm
                              ${msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                                : 'bg-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                              }
                            `}>
                              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                              <div 
                                className={`text-xs mt-1 ${
                                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {formatRelativeTime(msg.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {/* Show optimistic messages */}
                      {optimisticMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className="flex justify-end"
                        >
                          <div className="bg-blue-500 text-white rounded-lg rounded-tr-none px-4 py-2 max-w-xs sm:max-w-sm shadow-sm opacity-80">
                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            <div className="text-xs mt-1 text-blue-100">
                              Just now
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {sendMessageMutation.isPending && (
                        <div className="flex justify-start">
                          <div className="rounded-lg px-4 py-3 bg-gray-200 text-gray-800 rounded-tl-none shadow-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message input */}
                <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex space-x-2">
                    <Textarea
                      id="ai-assistant-input"
                      ref={textareaRef}
                      placeholder="Ask any NEC4 question in everyday language..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 resize-none focus:border-blue-500 shadow-sm"
                      rows={2}
                      onKeyDown={(e) => {
                        // Submit on Enter (without Shift)
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim()) {
                            sendMessageMutation.mutate(message);
                          }
                        }
                      }}
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="self-end bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <div>
                      {message.length > 0 && (
                        <span>Press Enter to send</span>
                      )}
                    </div>
                    
                    {currentForm && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePopulateForm}
                        disabled={populateFormMutation.isPending}
                        type="button"
                        className="h-7 text-xs"
                      >
                        {populateFormMutation.isPending ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <FileText className="mr-1 h-3 w-3" />
                        )}
                        Help fill form
                      </Button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}