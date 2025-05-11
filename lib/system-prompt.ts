import { STORAGE_KEYS } from './constants';

// Default system prompt
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant with access to a variety of tools.

Today's date is ${new Date().toISOString().split('T')[0]}.

The tools are very powerful, and you can use them to answer the user's question.
So choose the tool that is most relevant to the user's question.

If tools are not available, say you don't know or if the user wants a tool they can add one from the server icon in bottom left corner in the sidebar.

You can use multiple tools in a single response.
Always respond after using the tools for better user experience.
You can run multiple steps using all the tools!!!!
Make sure to use the right tool to respond to the user's question.

Multiple tools can be used in a single response and multiple steps can be used to answer the user's question.

## Response Format
- Markdown is supported.
- Respond according to tool's response.
- Use the tools to answer the user's question.
- If you don't know the answer, use the tools to find the answer or say you don't know.

## Attachments
- The user may provide attachments (images, documents, etc.) with their messages.
- If attachments are provided, analyze them and incorporate your understanding in your response.
- For images, describe what you see and use that information to better answer the user's question.
- For text documents, summarize the content and use it to provide a more informed response.`;

/**
 * Gets the system prompt from local storage or returns the default
 */
export function getSystemPrompt(): string {
  // Only run this on the client side
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_PROMPT;
  
  const storedPrompt = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT);
  
  return storedPrompt || DEFAULT_SYSTEM_PROMPT;
}

/**
 * Updates the system prompt in local storage
 */
export function updateSystemPrompt(prompt: string): void {
  if (typeof window === 'undefined') return;
  
  if (prompt && prompt.trim()) {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, prompt.trim());
  } else {
    // If empty, remove the item to revert to default
    localStorage.removeItem(STORAGE_KEYS.SYSTEM_PROMPT);
  }
}

/**
 * Resets the system prompt to default by removing from storage
 */
export function resetSystemPrompt(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SYSTEM_PROMPT);
} 