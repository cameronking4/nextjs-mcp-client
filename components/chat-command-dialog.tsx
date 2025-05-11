"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Search, MessageSquare, ArrowUpRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChats } from "@/lib/hooks/use-chats";
import { getUserId } from "@/lib/user-id";
import { format } from "date-fns";
import "./ui/command.css";

// Create a VisuallyHidden component for accessibility
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </span>
  );
};

// Keyboard shortcut component that adapts to the platform
const KbdShortcut = ({ 
  shortcut, 
  className 
}: { 
  shortcut: { mac: string; win: string; }; 
  className?: string; 
}) => {
  const [isMac, setIsMac] = useState(false);
  
  useEffect(() => {
    // Detect if user is on Mac
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);
  
  // Parse the shortcut string into components
  const keys = isMac ? shortcut.mac.split('+') : shortcut.win.split('+');
  
  return (
    <kbd className={cn(
      "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100",
      className
    )}>
      {keys.map((key, i) => (
        <span key={i} className="text-xs">
          {i > 0 && "+"}{key}
        </span>
      ))}
    </kbd>
  );
};

interface ChatCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatCommandDialog({ open, onOpenChange }: ChatCommandDialogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState<string>("");
  
  // Initialize userId
  useEffect(() => {
    setUserId(getUserId());
  }, []);
  
  // Use TanStack Query to fetch chats
  const { chats, isLoading, deleteChat } = useChats(userId);
  
  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => 
    chat.title.toLowerCase().includes(search.toLowerCase())
  );
  
  // Handle selecting a chat
  const handleSelectChat = useCallback((chatId: string) => {
    router.push(`/chat/${chatId}`);
    onOpenChange(false);
  }, [router, onOpenChange]);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  }, [onOpenChange]);

  // Handle delete chat
  const handleDeleteChat = useCallback((chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteChat(chatId);
  }, [deleteChat]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 gap-0 overflow-hidden max-w-lg"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle>
          <VisuallyHidden>Search Chats</VisuallyHidden>
        </DialogTitle>
        <Command className="rounded-lg border-none">
          <div className="flex items-center px-3 border-b">
            <Search className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
            <Command.Input 
              autoFocus
              placeholder="Search chats..." 
              className="h-12 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
              value={search}
              onValueChange={setSearch}
            />
            <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground ml-2">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>
          
          <Command.List className="p-2 max-h-[60vh]">
            {isLoading ? (
              <Command.Loading>
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading chats...
                </div>
              </Command.Loading>
            ) : filteredChats.length === 0 ? (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No chats found.
              </Command.Empty>
            ) : (
              <ScrollArea className="h-[300px]">
                <Command.Group heading="Chats">
                  {filteredChats.map((chat) => (
                    <Command.Item
                      key={chat.id}
                      value={chat.id}
                      onSelect={() => handleSelectChat(chat.id)}
                      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-secondary/60 group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate font-medium">{chat.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(chat.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-destructive/10 hover:text-destructive"
                            title="Delete chat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => handleSelectChat(chat.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-primary/10 hover:text-primary"
                            title="Open chat"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </ScrollArea>
            )}
          </Command.List>
          
          <div className="border-t p-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Press</span>
                <KbdShortcut shortcut={{ mac: "⌘/", win: "Ctrl+/" }} />
                <span>anywhere to open search</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span>Total: {filteredChats.length} chat{filteredChats.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
} 