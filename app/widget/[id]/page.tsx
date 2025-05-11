"use client";

import { useEffect, useState } from "react";
import Chat from "@/components/chat";
import { getUserId } from "@/lib/user-id";
import { MCPProvider, useMCP } from "@/lib/context/mcp-context";
import { modelID } from "@/ai/providers";
import { Loader2 } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

interface WidgetConfig {
  id: string;
  name: string;
  modelId: modelID;
  mcpServers: any[];
  customization: {
    theme?: 'light' | 'dark' | 'auto';
    showBranding?: boolean;
  };
  isPublic: boolean;
  allowedDomains: string[];
}

// Widget content component that uses the MCP context
function WidgetContent({ widget }: { widget: WidgetConfig }) {
  const { setMcpServers, setSelectedMcpServers } = useMCP();
  const [, setSelectedModel] = useLocalStorage<modelID>("selectedModel", widget.modelId);
  
  // Set up MCP servers and model when widget loads
  useEffect(() => {
    // Set the selected model from the widget configuration
    setSelectedModel(widget.modelId);
    
    if (widget.mcpServers && widget.mcpServers.length > 0) {
      // Set the MCP servers from the widget configuration
      setMcpServers(widget.mcpServers);
      
      // Select all the servers
      setSelectedMcpServers(widget.mcpServers.map(server => server.id));
    }
  }, [widget, setMcpServers, setSelectedMcpServers, setSelectedModel]);
  
  return <Chat isWidget={true} />;
}

export default function WidgetPage({ params }: { params: { id: string } }) {
  const [widget, setWidget] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<string>("");
  
  // Set the widget ID once on component mount
  useEffect(() => {
    // In Next.js App Router, we need to handle params carefully
    // Extract the ID directly from the params object
    if (params && typeof params.id === 'string') {
      setWidgetId(params.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    // Only fetch if we have a widget ID
    if (!widgetId) return;
    
    const fetchWidget = async () => {
      try {
        const userId = getUserId();
        
        const response = await fetch(`/api/widgets/${widgetId}?embedded=true`, {
          headers: {
            'x-user-id': userId
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load widget");
        }
        
        const widgetData = await response.json();
        setWidget(widgetData);
      } catch (error) {
        console.error("Error loading widget:", error);
        setError(error instanceof Error ? error.message : "Failed to load widget");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWidget();
  }, [widgetId]);
  
  // Set theme based on widget configuration
  useEffect(() => {
    if (widget?.customization?.theme) {
      const { theme } = widget.customization;
      
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'auto') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, [widget]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg max-w-md">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Widget Error</h2>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!widget) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg max-w-md">
          <h2 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">Widget Not Found</h2>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            The requested chat widget could not be found or has been removed.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Widget Header */}
      <div className="border-b px-3 py-2 flex items-center justify-between">
        <h1 className="text-sm font-medium truncate">{widget.name}</h1>
        {widget.customization?.showBranding && (
          <div className="text-xs text-muted-foreground">
            Powered by Open MCP
          </div>
        )}
      </div>
      
      {/* Widget Content */}
      <div className="flex-1 overflow-hidden">
        <MCPProvider>
          <WidgetContent widget={widget} />
        </MCPProvider>
      </div>
    </div>
  );
}
