import { model, type modelID } from "@/ai/providers";
import { smoothStream, streamText, type UIMessage } from "ai";
import { appendResponseMessages } from 'ai';
import { saveChat, saveMessages, convertToDBMessages } from '@/lib/chat-store';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { initializeMCPClients, type MCPServerConfig } from '@/lib/mcp-client';
import { generateTitle } from '@/app/actions';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/system-prompt';

export const runtime = 'nodejs';

// Allow streaming responses up to 30 seconds
export const maxDuration = 120;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const {
    messages,
    chatId,
    selectedModel,
    userId,
    mcpServers = [],
    experimental_attachments = [],
    systemPrompt,
  }: {
    messages: UIMessage[];
    chatId?: string;
    selectedModel: modelID;
    userId: string;
    mcpServers?: MCPServerConfig[];
    experimental_attachments?: any[];
    systemPrompt?: string;
  } = await req.json();

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Client ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const id = chatId || nanoid();

  // Check if chat already exists for the given ID
  // If not, create it now
  let isNewChat = false;
  if (chatId) {
    try {
      const existingChat = await db.query.chats.findFirst({
        where: and(
          eq(chats.id, chatId),
          eq(chats.userId, userId)
        )
      });
      isNewChat = !existingChat;
    } catch (error) {
      console.error("Error checking for existing chat:", error);
      isNewChat = true;
    }
  } else {
    // No ID provided, definitely new
    isNewChat = true;
  }

  // If it's a new chat, save it immediately
  if (isNewChat && messages.length > 0) {
    try {
      // Generate a title based on first user message
      const userMessage = messages.find(m => m.role === 'user');
      let title = 'New Chat';
      
      if (userMessage) {
        try {
          title = await generateTitle([userMessage]);
        } catch (error) {
          console.error("Error generating title:", error);
        }
      }
      
      // Save the chat immediately so it appears in the sidebar
      await saveChat({
        id,
        userId,
        title,
        messages: [],
      });
    } catch (error) {
      console.error("Error saving new chat:", error);
    }
  }

  // Initialize MCP clients using the already running persistent SSE servers
  // Process MCP servers and capture tools for each server
  const { tools, cleanup, serverTools } = await initializeMCPClients(mcpServers, req.signal);
  
  // For server logging - just log the tools found for each server
  if (serverTools) {
    for (const [serverUrl, toolsList] of Object.entries(serverTools)) {
      console.log(`Found tools for server ${serverUrl}:`, toolsList);
    }
  }

  console.log("messages", messages);
  console.log("parts", messages.map(m => m.parts.map(p => p)));
  
  // Log attachments if present
  if (experimental_attachments && experimental_attachments.length > 0) {
    console.log("attachments", experimental_attachments.map(a => ({ name: a.name, type: a.contentType })));
  }

  // If there are attachments, add them to the last user message
  if (experimental_attachments && experimental_attachments.length > 0) {
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMessageIndex >= 0) {
      const actualIndex = messages.length - 1 - lastUserMessageIndex;
      // Add attachments to the message
      messages[actualIndex] = {
        ...messages[actualIndex],
        experimental_attachments
      };
    }
  }

  // Track if the response has completed
  let responseCompleted = false;

  // Use system prompt from request if provided, otherwise use default
  const finalSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const result = streamText({
    model: model.languageModel(selectedModel),
    system: finalSystemPrompt,
    messages,
    tools,
    maxSteps: 20,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
      anthropic: {
        thinking: { 
          type: 'enabled', 
          budgetTokens: 12000 
        },
      } 
    },
    experimental_transform: smoothStream({
      delayInMs: 5, // optional: defaults to 10ms
      chunking: 'line', // optional: defaults to 'word'
    }),
    onError: (error) => {
      console.error(JSON.stringify(error, null, 2));
    },
    async onFinish({ response }) {
      responseCompleted = true;
      const allMessages = appendResponseMessages({
        messages,
        responseMessages: response.messages,
      });

      await saveChat({
        id,
        userId,
        messages: allMessages,
      });

      const dbMessages = convertToDBMessages(allMessages, id);
      await saveMessages({ messages: dbMessages });
      
      // Clean up resources - now this just closes the client connections
      // not the actual servers which persist in the MCP context
      await cleanup();
    }
  });

  // Ensure cleanup happens if the request is terminated early
  req.signal.addEventListener('abort', async () => {
    if (!responseCompleted) {
      console.log("Request aborted, cleaning up resources");
      try {
        await cleanup();
      } catch (error) {
        console.error("Error during cleanup on abort:", error);
      }
    }
  });

  result.consumeStream()
  // Add chat ID to response headers so client can know which chat was created
  return result.toDataStreamResponse({
    sendReasoning: true,
    headers: {
      'X-Chat-ID': id
    },
    getErrorMessage: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
      }
      console.error(error);
      return "An error occurred.";
    },
  });
}
