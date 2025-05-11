import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSystemPrompt, updateSystemPrompt, resetSystemPrompt, DEFAULT_SYSTEM_PROMPT } from "@/lib/system-prompt";

interface SystemPromptManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SystemPromptManager({ open, onOpenChange }: SystemPromptManagerProps) {
    const [systemPrompt, setSystemPrompt] = useState("");
    const [isDefault, setIsDefault] = useState(true);

    // Load system prompt from localStorage on initial mount
    useEffect(() => {
        if (open) {
            const currentPrompt = getSystemPrompt();
            setSystemPrompt(currentPrompt);
            setIsDefault(currentPrompt === DEFAULT_SYSTEM_PROMPT);
        }
    }, [open]);

    // Save system prompt to localStorage
    const handleSaveSystemPrompt = () => {
        try {
            updateSystemPrompt(systemPrompt);
            toast.success("System prompt saved successfully");
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving system prompt:", error);
            toast.error("Failed to save system prompt");
        }
    };

    // Reset to default system prompt
    const handleResetToDefault = () => {
        resetSystemPrompt();
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        setIsDefault(true);
        toast.success("System prompt reset to default");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span>System Prompt</span>
                    </DialogTitle>
                    <DialogDescription>
                        Customize the system prompt that defines how the AI assistant behaves.
                        This will affect all new conversations.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="systemPrompt">System Prompt</Label>
                        <Textarea
                            id="systemPrompt"
                            value={systemPrompt}
                            onChange={(e) => {
                                setSystemPrompt(e.target.value);
                                setIsDefault(e.target.value === DEFAULT_SYSTEM_PROMPT);
                            }}
                            placeholder="Enter your system prompt"
                            className="h-[30vh] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            The system prompt defines the AI&apos;s behavior and capabilities. You can use <code className="bg-secondary/50 px-1 rounded">${"{new Date().toISOString().split('T')[0]}"}</code> to insert the current date.
                        </p>
                    </div>
                </div>
                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleResetToDefault}
                        disabled={isDefault}
                    >
                        Reset to Default
                    </Button>
                    <div className="flex-grow"></div>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSaveSystemPrompt}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 