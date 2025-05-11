import { experimental_createMCPClient as createMCPClient } from 'ai';


export interface KeyValuePair {
  key: string;
  value: string;
}

export interface MCPServerConfig {
  url: string;
  type: 'sse' | 'http';
  command?: string;
  args?: string[];
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
}

export interface MCPClientManager {
  tools: Record<string, any>;
  clients: any[];
  serverTools: Record<string, string[]>;
  cleanup: () => Promise<void>;
}

async function waitForServerReady(url: string, maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response.status === 200) {
        console.log(`Server ready at ${url} after ${i + 1} attempts`)
        return true
      }
      console.log(`Server not ready yet (attempt ${i + 1}), status: ${response.status}`)
    } catch {
      console.log(`Server connection failed (attempt ${i + 1})`)
    }
    // Wait 6 seconds between attempts
    await new Promise(resolve => setTimeout(resolve, 6000))
  }
  return false
}

/**
 * Initialize MCP clients for API calls
 * This handles both SSE and HTTP transport types
 */
export async function initializeMCPClients(
  mcpServers: MCPServerConfig[] = [],
  abortSignal?: AbortSignal
): Promise<MCPClientManager> {
  // Initialize tools
  let tools = {};
  const mcpClients: any[] = [];
  const serverTools: Record<string, string[]> = {};

  // Process each MCP server configuration
  for (const mcpServer of mcpServers) {
    try {
      const headers = mcpServer.headers?.reduce((acc, header) => {
        if (header.key) acc[header.key] = header.value || '';
        return acc;
      }, {} as Record<string, string>);

      // Create transport config based on server type
      // For now, treat 'http' type as 'sse' for compatibility with AI SDK
      // In the future, this can be updated when the SDK supports HTTP streamable
      const transport = {
        type: 'sse' as const, // Always use 'sse' as the transport type for AI SDK
        url: mcpServer.url,
        headers
      };

      const mcpClient = await createMCPClient({ transport });
      mcpClients.push(mcpClient);

      const mcptools = await mcpClient.tools();
      
      // Store tools on the server object to display in UI
      const foundToolNames = Object.keys(mcptools);
      console.log(`MCP tools from ${mcpServer.url}:`, foundToolNames);
      
      // Save the tools for this server
      serverTools[mcpServer.url] = foundToolNames;

      // Add MCP tools to tools object
      tools = { ...tools, ...mcptools };
    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      // Continue with other servers instead of failing the entire request
    }
  }

  // Register cleanup for all clients if an abort signal is provided
  if (abortSignal && mcpClients.length > 0) {
    abortSignal.addEventListener('abort', async () => {
      await cleanupMCPClients(mcpClients);
    });
  }

  return {
    tools,
    clients: mcpClients,
    serverTools,
    cleanup: async () => await cleanupMCPClients(mcpClients)
  };
}

async function cleanupMCPClients(clients: any[]): Promise<void> {
  // Clean up the MCP clients
  for (const client of clients) {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing MCP client:", error);
    }
  }
} 