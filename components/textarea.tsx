import { modelID } from "@/ai/providers";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2, Paperclip, X } from "lucide-react";
import { ModelPicker } from "./model-picker";
import { useRef, useState, DragEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InputProps {
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  status: string;
  stop: () => void;
  selectedModel: modelID;
  setSelectedModel: (model: modelID) => void;
  files?: FileList | null;
  setFiles?: (files: FileList | null) => void;
}

// Helper function to get text preview from text files
function TextFilePreview({ file }: { file: File }) {
  const [content, setContent] = useState<string>("");

  useState(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      setContent(typeof text === "string" ? text.slice(0, 100) : "");
    };
    reader.readAsText(file);
  });

  return (
    <div>
      {content}
      {content.length >= 100 && "..."}
    </div>
  );
}

export const Textarea = ({
  input,
  handleInputChange,
  isLoading,
  status,
  stop,
  selectedModel,
  setSelectedModel,
  files,
  setFiles,
}: InputProps) => {
  const isStreaming = status === "streaming" || status === "submitted";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle files selected from the file dialog
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && setFiles) {
      const validFiles = Array.from(selectedFiles).filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("text/") || file.type.startsWith("application/")
      );

      if (validFiles.length === selectedFiles.length) {
        const dataTransfer = new DataTransfer();
        validFiles.forEach((file) => dataTransfer.items.add(file));
        setFiles(dataTransfer.files);
      } else {
        toast.error("Only image, text, and document files are allowed");
      }
    }
  };
  
  // Handle paste events (for images)
  const handlePaste = (event: React.ClipboardEvent) => {
    if (!setFiles) return;
    
    const items = event.clipboardData?.items;
    if (items) {
      const files = Array.from(items)
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (files.length > 0) {
        const validFiles = files.filter(
          (file) =>
            file.type.startsWith("image/") || file.type.startsWith("text/")
        );

        if (validFiles.length === files.length) {
          const dataTransfer = new DataTransfer();
          validFiles.forEach((file) => dataTransfer.items.add(file));
          setFiles(dataTransfer.files);
        } else {
          toast.error("Only image and text files are allowed from clipboard");
        }
      }
    }
  };
  
  // Handle drag over events
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave events
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // Handle drop events
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!setFiles) return;
    
    const droppedFiles = event.dataTransfer.files;
    const droppedFilesArray = Array.from(droppedFiles);
    
    if (droppedFilesArray.length > 0) {
      const validFiles = droppedFilesArray.filter(
        (file) =>
          file.type.startsWith("image/") || 
          file.type.startsWith("text/") ||
          file.type.startsWith("application/")
      );

      if (validFiles.length === droppedFilesArray.length) {
        const dataTransfer = new DataTransfer();
        validFiles.forEach((file) => dataTransfer.items.add(file));
        setFiles(dataTransfer.files);
      } else {
        toast.error("Only image, text, and document files are allowed!");
      }
    }
    setIsDragging(false);
  };
  
  // Clear files
  const clearFiles = () => {
    if (setFiles) {
      setFiles(null);
    }
  };
  
  return (
    <div 
      className="relative w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="absolute inset-0 pointer-events-none dark:bg-zinc-900/90 rounded-2xl z-10 flex flex-col justify-center items-center gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Drag and drop files here</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              {"(images, text, and documents)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* File previews */}
      <AnimatePresence>
        {files && files.length > 0 && (
          <motion.div 
            className="absolute -top-16 left-0 flex flex-row gap-2 overflow-x-auto max-w-full pb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {Array.from(files).map((file, index) => (
              <motion.div 
                key={`${file.name}-${index}`}
                className="relative group"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {file.type.startsWith("image/") ? (
                  <div className="relative w-14 h-14">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-14 h-14 object-cover rounded-md border border-border"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFiles();
                      }}
                      className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-14 h-14 flex items-center justify-center bg-muted/30 rounded-md border border-border text-xs text-muted-foreground overflow-hidden">
                    <div className="p-1 truncate text-center">
                      {file.name.length > 10 ? `${file.name.substring(0, 10)}...` : file.name}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFiles();
                      }}
                      className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden file input */}
      <input
        type="file"
        multiple
        accept="image/*,text/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <ShadcnTextarea
        className="resize-none bg-background/50 dark:bg-muted/50 backdrop-blur-sm w-full rounded-2xl pr-12 pt-4 pb-16 border-input focus-visible:ring-ring placeholder:text-muted-foreground"
        value={input}
        autoFocus
        placeholder="Send a message..."
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isLoading && input.trim()) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        onPaste={handlePaste}
      />
      
      <ModelPicker
        setSelectedModel={setSelectedModel}
        selectedModel={selectedModel}
      />

      <div className="absolute right-2 bottom-2 flex items-center gap-2">
        {/* File upload button */}
        <button
          type="button"
          onClick={handleUploadClick}
          className={cn(
            "rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
            files && files.length > 0 ? "text-primary" : ""
          )}
          disabled={isStreaming}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        
        {/* Submit button */}
        <button
          type={isStreaming ? "button" : "submit"}
          onClick={isStreaming ? stop : undefined}
          disabled={(!isStreaming && !input.trim() && (!files || files.length === 0)) || (isStreaming && status === "submitted")}
          className="rounded-full p-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-all duration-200"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4 text-primary-foreground" />
          )}
        </button>
      </div>
    </div>
  );
};
