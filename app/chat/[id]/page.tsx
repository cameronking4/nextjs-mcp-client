"use client";

import Chat from "@/components/chat";
import { getUserId } from "@/lib/user-id";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, Mail, AlertCircle, Code, Download, Bot, Globe, Phone, Tablet, Laptop } from "lucide-react";
import { WidgetExportDialog } from "@/components/widget-export-dialog";
import { useCopy } from "@/lib/hooks/use-copy";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMCP } from "@/lib/context/mcp-context";
import { MODELS, modelDetails, defaultModel, modelID } from "@/ai/providers";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

export default function ChatPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const queryClient = useQueryClient();
  const userId = getUserId();

  // Prefetch chat data
  useEffect(() => {
    async function prefetchChat() {
      if (!chatId || !userId) return;
      
      // Check if data already exists in cache
      const existingData = queryClient.getQueryData(['chat', chatId, userId]);
      if (existingData) return;

      // Prefetch the data
      await queryClient.prefetchQuery({
        queryKey: ['chat', chatId, userId] as const,
        queryFn: async () => {
          try {
            const response = await fetch(`/api/chats/${chatId}`, {
              headers: {
                'x-user-id': userId
              }
            });
            
            if (!response.ok) {
              throw new Error('Failed to load chat');
            }
            
            return response.json();
          } catch (error) {
            console.error('Error prefetching chat:', error);
            return null;
          }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }

    prefetchChat();
  }, [chatId, userId, queryClient]);

  return (
    <div className="relative h-full w-full mr-4">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <ExportButton chatId={chatId} userId={userId} />
        <ShareButton chatId={chatId} userId={userId} />
      </div>
      <Chat />
    </div>
  );
}

function ExportButton({ chatId, userId }: { chatId: string, userId: string }) {
  const { copy } = useCopy();
  const [v0ExportDialogOpen, setV0ExportDialogOpen] = useState(false);
  const { mcpServers, selectedMcpServers } = useMCP();
  const [selectedModel] = useLocalStorage<modelID>("selectedModel", defaultModel);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportData, setExportData] = useState<any>(null);
  
  const [widgetExportDialogOpen, setWidgetExportDialogOpen] = useState(false);
  
  const handleExportWebsiteWidget = () => {
    // Open the widget export dialog
    setWidgetExportDialogOpen(true);
  };
  
  const handleExportExpoApp = () => {
    // Implementation for exporting to Expo App
    // For now, just show a toast notification
    toast.success("Export to Expo App feature coming soon");
  };
  
  const handleExportV0 = () => {
    setExportStatus('idle');
    setV0ExportDialogOpen(true);
  };

  const startExport = async () => {
    try {
      setExportStatus('exporting');
      
      // Prepare export data
      const selectedServers = mcpServers.filter(server => 
        selectedMcpServers.includes(server.id)
      );
      
      const data = {
        mcpServers: selectedServers,
        model: {
          id: selectedModel,
          name: modelDetails[selectedModel].name,
          provider: modelDetails[selectedModel].provider
        },
        userId,
        timestamp: new Date().toISOString()
      };
      
      setExportData(data);
      console.log("V0 Export Data:", data);
      
      // In a production implementation, this would:
      // 1. Create a streamlined version of the app
      // 2. Preconfigure it with the selected MCP servers and model
      // 3. Remove the server/model selection UI
      // 4. Package it for deployment
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      setExportStatus('success');
      toast.success("v0 export created successfully");
      
    } catch (error) {
      console.error('Error during export:', error);
      toast.error('Export failed. Please try again.');
      setExportStatus('error');
    }
  };

  const handleDownloadZip = () => {
    // In a real implementation, this would download the actual ZIP file
    // For now, we'll just simulate the download with a data URL
    
    // Create a JSON blob with the configuration
    const configBlob = new Blob(
      [JSON.stringify(exportData, null, 2)], 
      { type: 'application/json' }
    );
    
    // Create a download link
    const url = URL.createObjectURL(configBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `open-mcp-v0-export-${new Date().getTime()}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    toast.success("Download started");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center h-8 w-8 bg-muted hover:bg-accent rounded-md transition-colors">
            <Globe className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleExportWebsiteWidget}>
            <Code className="h-4 w-4" /> Export to API
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExportV0}>
            <Laptop className="h-4 w-4" /> Export to v0
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExportWebsiteWidget}>
            <Bot className="h-4 w-4" /> Export as Website Widget
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExportExpoApp}>
            <Tablet className="h-4 w-4" /> Export to Expo App
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={v0ExportDialogOpen} onOpenChange={setV0ExportDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Export to v0</DialogTitle>
            <DialogDescription>
              Create a streamlined version of this app with pre-configured settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto">
            <div>
              <h3 className="text-sm font-semibold mb-2">Selected Model</h3>
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-sm font-medium">{modelDetails[selectedModel].name}</p>
                <p className="text-xs text-muted-foreground">{modelDetails[selectedModel].provider}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Selected MCP Servers ({selectedMcpServers.length})</h3>
              {selectedMcpServers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No MCP servers selected</p>
              ) : (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {selectedMcpServers.map(serverId => {
                    const server = mcpServers.find(s => s.id === serverId);
                    return server ? (
                      <div key={server.id} className="p-2 bg-muted/30 rounded-md">
                        <p className="text-sm font-medium">{server.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{server.url}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            
            <div className="text-sm bg-amber-100 dark:bg-amber-900/30 p-3 rounded-md">
              <p className="text-amber-800 dark:text-amber-300">
                The exported app will use your selected model ({modelDetails[selectedModel].name}) 
                and MCP servers without showing selection UI to end users.
              </p>
            </div>
          
            {exportStatus === 'success' && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-md text-green-800 dark:text-green-300 text-sm">
                <p className="font-medium mb-2">Export Successful!</p>
                <p>
                  Your v0 export is ready. Click &quot;Download ZIP&quot; to get your customized application.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Pre-configured with your selected model and MCP servers</li>
                  <li>Deploy directly to your hosting provider (like Vercel)</li>
                  <li>Share with others who can use it immediately without configuration</li>
                </ul>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0">
            {exportStatus !== 'success' ? (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={startExport}
                  disabled={exportStatus === 'exporting'}
                >
                  {exportStatus === 'exporting' ? 'Creating v0 App...' : 'Create v0 App'}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setExportStatus('idle');
                    setExportData(null);
                  }}
                >
                  Create Another
                </Button>
                <Button 
                  onClick={handleDownloadZip}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download ZIP
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Widget Export Dialog */}
      <WidgetExportDialog
        open={widgetExportDialogOpen}
        onOpenChange={setWidgetExportDialogOpen}
        selectedModel={selectedModel}
      />
    </>
  );
}

function ShareButton({ chatId, userId }: { chatId: string, userId: string }) {
  const { copy } = useCopy();
  const [shareInfoOpen, setShareInfoOpen] = useState(false);
  
  const handleCopyLink = () => {
    const url = `${window.location.origin}/chat/${chatId}`;
    copy(url);
    toast.success("Link copied to clipboard");
  };
  
  const handleCopyUserIdAndLink = () => {
    const url = `${window.location.origin}/chat/${chatId}`;
    const shareText = `Chat link: ${url}\nClient ID: ${userId}\n\nNote: The recipient will need to use this Client ID to view the chat.`;
    copy(shareText);
    toast.success("Link and Client ID copied to clipboard");
  };
  
  const handleEmailShare = () => {
    const url = `${window.location.origin}/chat/${chatId}`;
    const subject = "Check out this chat";
    const body = `Here's a link to a chat I thought you might find interesting: ${url}\n\nNote: You'll need to use this Client ID to view the chat: ${userId}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center h-8 w-8 bg-muted hover:bg-accent rounded-md transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center gap-2">
            <span>Share Options</span>
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setShareInfoOpen(true)}>
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Sharing Info
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleCopyLink}>
            <Copy className="h-4 w-4" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyUserIdAndLink}>
            <Copy className="h-4 w-4" />
            Copy Link with Client ID
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleEmailShare}>
            <Mail className="h-4 w-4" />
            Share via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={shareInfoOpen} onOpenChange={setShareInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About Sharing Chats</DialogTitle>
            <DialogDescription>
              Chats in Open MCP are tied to your Client ID. When you share a chat link:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                The recipient must use your Client ID to view the shared chat.
              </p>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                When sharing, include both the chat link and your Client ID.
              </p>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                The recipient will need to change their Client ID in the sidebar settings to match yours temporarily.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Got it</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
