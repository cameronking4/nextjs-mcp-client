"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useState, useEffect, useCallback } from "react";
import { ChatCommandDialog } from "./chat-command-dialog";

export function KeyboardShortcuts() {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  
  // Detect operating system for proper shortcut display
  const isMac = typeof navigator !== 'undefined' ? navigator.platform.toUpperCase().indexOf('MAC') >= 0 : false;
  
  // Support both Ctrl+/ and Cmd+/ (on Mac)
  useHotkeys(["ctrl+/", "meta+/"], (event) => {
    event.preventDefault();
    setCommandDialogOpen(true);
  }, { 
    enableOnFormTags: true,
    // Ensure that the event doesn't propagate to prevent conflicts
    preventDefault: true 
  });
  
  // Also support the original meta+k for backward compatibility
  useHotkeys("meta+k", (event) => {
    event.preventDefault();
    setCommandDialogOpen(true);
  }, {
    enableOnFormTags: true,
    preventDefault: true
  });
  
  // Add keyboard event listener for more direct control if needed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+/ or CTRL+/
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setCommandDialogOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setCommandDialogOpen(open);
  }, []);

  return (
    <>
      <ChatCommandDialog 
        open={commandDialogOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  );
} 