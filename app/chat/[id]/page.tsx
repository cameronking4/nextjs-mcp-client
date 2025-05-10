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
import { Share2, Copy, Mail, AlertCircle } from "lucide-react";
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
    <div className="relative h-full w-full">
      <div className="absolute top-4 right-4 z-50">
        <ShareButton chatId={chatId} userId={userId} />
      </div>
      <Chat />
    </div>
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
    const shareText = `Chat link: ${url}\nUser ID: ${userId}\n\nNote: The recipient will need to use this User ID to view the chat.`;
    copy(shareText);
    toast.success("Link and User ID copied to clipboard");
  };
  
  const handleEmailShare = () => {
    const url = `${window.location.origin}/chat/${chatId}`;
    const subject = "Check out this chat";
    const body = `Here's a link to a chat I thought you might find interesting: ${url}\n\nNote: You'll need to use this User ID to view the chat: ${userId}`;
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
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Share Options</span>
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setShareInfoOpen(true)}>
            <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
            Sharing Info
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyUserIdAndLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link with User ID
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleEmailShare}>
            <Mail className="mr-2 h-4 w-4" />
            Share via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={shareInfoOpen} onOpenChange={setShareInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About Sharing Chats</DialogTitle>
            <DialogDescription>
              Chats in Open MCP are tied to your User ID. When you share a chat link:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                The recipient must use your User ID to view the shared chat.
              </p>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                When sharing, include both the chat link and your User ID.
              </p>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                The recipient will need to change their User ID in the sidebar settings to match yours temporarily.
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