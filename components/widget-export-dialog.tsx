"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCopy } from "@/lib/hooks/use-copy";
import { useMCP } from "@/lib/context/mcp-context";
import { modelID, modelDetails } from "@/ai/providers";
import { Loader2, Copy, Check, Globe, Bot, Code, Server, AlertTriangle } from "lucide-react";
import { MCPServer } from "@/lib/context/mcp-context";
import { getUserId } from "@/lib/user-id";

interface WidgetExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModel: modelID;
}

export function WidgetExportDialog({
  open,
  onOpenChange,
  selectedModel,
}: WidgetExportDialogProps) {
  const { copy, copied } = useCopy();
  const { mcpServers, selectedMcpServers } = useMCP();
  const [name, setName] = useState("My Chat Widget");
  const [isCreating, setIsCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState("");
  const [createdWidget, setCreatedWidget] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("config");
  
  // Reset state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog closes
      setName("My Chat Widget");
      setIsCreating(false);
      setIsPublic(true);
      setAllowedDomains("");
      setCreatedWidget(null);
      setActiveTab("config");
    }
    onOpenChange(open);
  };
  
  const handleCreateWidget = async () => {
    try {
      setIsCreating(true);
      
      // Get selected MCP servers data
      const selectedServersData = mcpServers
        .filter(server => selectedMcpServers.includes(server.id))
        .map(({ id, name, url, type, headers }) => ({
          id,
          name,
          url,
          type,
          headers
        }));
      
      if (selectedServersData.length === 0) {
        toast.warning("No MCP servers selected. Widget will have limited functionality.");
      }
      
      // Parse allowed domains
      const domainsArray = allowedDomains
        .split(',')
        .map(domain => domain.trim())
        .filter(Boolean);
      
      const userId = getUserId();
      
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          name,
          modelId: selectedModel,
          mcpServers: selectedServersData,
          isPublic,
          allowedDomains: domainsArray.length > 0 ? domainsArray : [],
          customization: {
            theme: 'auto',
            showBranding: true
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create widget");
      }
      
      const widget = await response.json();
      setCreatedWidget(widget);
      setActiveTab("embed");
      toast.success("Widget created successfully!");
    } catch (error) {
      console.error("Error creating widget:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create widget");
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleCopyEmbedCode = () => {
    if (createdWidget?.embedCode) {
      copy(createdWidget.embedCode);
      toast.success("Embed code copied to clipboard");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Export as Website Widget
          </DialogTitle>
          <DialogDescription>
            Create an embeddable chat widget with your selected MCP servers.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" disabled={!!createdWidget}>Configuration</TabsTrigger>
            <TabsTrigger value="embed" disabled={!createdWidget}>Embed Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="flex-1 overflow-y-auto">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="widget-name">Widget Name</Label>
                <Input
                  id="widget-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Chat Widget"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Selected Model</Label>
                <div className="p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{modelDetails[selectedModel].name}</p>
                      <p className="text-xs text-muted-foreground">{modelDetails[selectedModel].provider}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Selected MCP Servers ({selectedMcpServers.length})</Label>
                {selectedMcpServers.length === 0 ? (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">No MCP servers selected</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Your widget will have limited functionality. Consider adding MCP servers from the sidebar.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {selectedMcpServers.map(serverId => {
                      const server = mcpServers.find(s => s.id === serverId);
                      return server ? (
                        <div key={server.id} className="p-2 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{server.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{server.url}</p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public-widget">Public Widget</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow embedding on any website
                    </p>
                  </div>
                  <Switch
                    id="public-widget"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
                
                {!isPublic && (
                  <div className="space-y-2">
                    <Label htmlFor="allowed-domains">Allowed Domains</Label>
                    <Textarea
                      id="allowed-domains"
                      value={allowedDomains}
                      onChange={(e) => setAllowedDomains(e.target.value)}
                      placeholder="example.com, subdomain.example.org"
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of domains where this widget can be embedded.
                      Leave empty to restrict to your domain only.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="embed" className="flex-1 overflow-y-auto">
            {createdWidget && (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-muted/30 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Your Widget is Ready!</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={handleCopyEmbedCode}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy Code
                    </Button>
                  </div>
                  
                  <div className="bg-background border rounded-md p-3 overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {createdWidget.embedCode}
                    </pre>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Widget Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-muted/30 rounded-md">
                      <p className="text-xs text-muted-foreground">ID</p>
                      <p className="font-mono text-xs truncate">{createdWidget.id}</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded-md">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-xs">
                        {new Date(createdWidget.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                        {isPublic ? "Public Widget" : "Restricted Widget"}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {isPublic
                          ? "This widget can be embedded on any website."
                          : `This widget can only be embedded on: ${
                              createdWidget.allowedDomains.length > 0
                                ? createdWidget.allowedDomains.join(", ")
                                : "your domain only"
                            }`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border border-border/50 rounded-md">
                  <p className="text-sm">
                    You can manage your widgets and get embed codes anytime from the
                    <span className="font-medium"> Widgets</span> section in your account.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {!createdWidget ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateWidget}
                disabled={isCreating || !name.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Widget"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
