"use client";

import { defaultModel, type modelID } from "@/ai/providers";
import { Message, useChat } from "@ai-sdk/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Textarea } from "./textarea";
import { ProjectOverview } from "./project-overview";
import { Messages } from "./messages";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { getUserId } from "@/lib/user-id";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { convertToUIMessages } from "@/lib/chat-store";
import { type Message as DBMessage } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { useMCP } from "@/lib/context/mcp-context";
import { getSystemPrompt } from "@/lib/system-prompt";
import { CommandPalette } from "./command-palette";

// Type for chat data from DB
interface ChatData {
  id: string;
  messages: DBMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatProps {
  isWidget?: boolean;
}

export default function Chat({ isWidget = false }: ChatProps) {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string | undefined;
  const queryClient = useQueryClient();
  
  const [selectedModel, setSelectedModel] = useLocalStorage<modelID>("selectedModel", defaultModel);
  const [userId, setUserId] = useState<string>('');
  const [generatedChatId, setGeneratedChatId] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  
  // Get MCP server data from context
  const { mcpServersForApi } = useMCP();
  
  // Initialize userId and system prompt
  useEffect(() => {
    setUserId(getUserId());
    // Get system prompt from local storage
    setSystemPrompt(getSystemPrompt());
    
    // Add event listener to detect changes to system prompt
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SYSTEM_PROMPT) {
        setSystemPrompt(getSystemPrompt());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Generate a chat ID if needed
  useEffect(() => {
    if (!chatId) {
      setGeneratedChatId(nanoid());
    }
  }, [chatId]);
  
  // Use React Query to fetch chat history
  const { data: chatData, isLoading: isLoadingChat } = useQuery({
    queryKey: ['chat', chatId, userId] as const,
    queryFn: async ({ queryKey }) => {
      const [_, chatId, userId] = queryKey;
      if (!chatId || !userId) return null;
      
      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          headers: {
            'x-user-id': userId
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load chat');
        }
        
        const data = await response.json();
        return data as ChatData;
      } catch (error) {
        console.error('Error loading chat history:', error);
        toast.error('Failed to load chat history');
        throw error;
      }
    },
    enabled: !!chatId && !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Prepare initial messages from query data
  const initialMessages = useMemo(() => {
    if (!chatData || !chatData.messages || chatData.messages.length === 0) {
      return [];
    }
    
    // Convert DB messages to UI format, then ensure it matches the Message type from @ai-sdk/react
    const uiMessages = convertToUIMessages(chatData.messages);
    return uiMessages.map(msg => ({
      id: msg.id,
      role: msg.role as Message['role'], // Ensure role is properly typed
      content: msg.content,
      parts: msg.parts,
    } as Message));
  }, [chatData]);
  
  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      id: chatId || generatedChatId, // Use generated ID if no chatId in URL
      initialMessages,
      maxSteps: 20,
      body: {
        selectedModel,
        mcpServers: mcpServersForApi,
        chatId: chatId || generatedChatId, // Use generated ID if no chatId in URL
        userId,
        systemPrompt, // Include the system prompt in the request
      },
      experimental_throttle: 500,
      onFinish: () => {
        // Invalidate the chats query to refresh the sidebar
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ['chats', userId] });
        }
      },
      onError: (error) => {
        toast.error(
          error.message.length > 0
            ? error.message
            : "An error occured, please try again later.",
          { position: "top-center", richColors: true },
        );
      },
    });
    
  // Custom submit handler
  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Create options object with attachments if available
    const options = files ? { experimental_attachments: files } : {};
    
    if (!chatId && generatedChatId && (input.trim() || (files && files.length > 0))) {
      // If this is a new conversation, redirect to the chat page with the generated ID
      const effectiveChatId = generatedChatId;
      
      // Submit the form with attachments
      handleSubmit(e, options);
      
      // Redirect to the chat page with the generated ID
      router.push(`/chat/${effectiveChatId}`);
    } else {
      // Normal submission for existing chats with attachments
      handleSubmit(e, options);
    }
    
    // Clear files after submission
    setFiles(null);
  }, [chatId, generatedChatId, input, handleSubmit, router, files]);

  const isLoading = status === "streaming" || status === "submitted" || isLoadingChat;

  return (
    <div className={`h-dvh flex flex-col justify-center w-full ${isWidget ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 md:py-4'}`}>
      {!isWidget && messages.length != 0 && !isLoadingChat && (
        <div className="mt-1 w-full mx-auto">
            <CommandPalette />
        </div>
      )}
      {messages.length === 0 && !isLoadingChat ? (
        <div className="max-w-xl mx-auto w-full">
          <ProjectOverview />
          <form
            onSubmit={handleFormSubmit}
            className="mt-4 w-full mx-auto"
          >
            <Textarea
              selectedModel={selectedModel}
              setSelectedModel={isWidget ? undefined : setSelectedModel}
              handleInputChange={handleInputChange}
              input={input}
              isLoading={isLoading}
              status={status}
              stop={stop}
              files={files}
              setFiles={setFiles}
              isWidget={isWidget}
            />
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto min-h-0 pb-2">
            <Messages messages={messages} isLoading={isLoading} status={status} />
          </div>
          <form
            onSubmit={handleFormSubmit}
            className="mt-2 w-full mx-auto mb-4 sm:mb-auto"
          >
            <Textarea
              selectedModel={selectedModel}
              setSelectedModel={isWidget ? undefined : setSelectedModel}
              handleInputChange={handleInputChange}
              input={input}
              isLoading={isLoading}
              status={status}
              stop={stop}
              files={files}
              setFiles={setFiles}
              isWidget={isWidget}
            />
          </form>
        </>
      )}
    </div>
  );
}
