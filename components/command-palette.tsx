"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  User,
  FileText,
  LifeBuoy,
  MessageSquare,
  Plus,
  Github,
  Twitter,
  Laptop,
  Moon,
  Sun,
  Search,
} from "lucide-react"
import { useTheme } from "next-themes"
import type { DialogProps } from "@radix-ui/react-dialog"
import { useHotkeys } from "react-hotkeys-hook"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette({ ...props }: DialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const { setTheme, theme } = useTheme()

  // Use the react-hotkeys-hook to listen for Cmd+K / Ctrl+K
  useHotkeys(["meta+k", "ctrl+k"], (event) => {
    event.preventDefault()
    setOpen((open) => !open)
  })

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <div className="flex flex-col w-full justify-center items-center">
      <Button
        variant="outline"
        className="max-w-md"
        onClick={() => setOpen(true)}
        {...props}
      >
        <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:ml-auto sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
        <span className="inline-flex">Launch Command Palette</span>
        
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
      >
        <div className="overflow-hidden rounded-md border border-border shadow-2xl items-center justify-center w-full">
          <div className="overflow-hidden rounded-t-xl">
            <CommandInput placeholder="Type a command or search..." className="border-none focus:ring-0 outline-none" />
          </div>
        <CommandList className="scrollbar-hide max-h-[60vh]">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Search className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No results found.</p>
            </div>
          </CommandEmpty>
          <AnimatedCommandGroup heading="Suggestions">
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendar</span>
              <CommandShortcut>⌘C</CommandShortcut>
            </AnimatedCommandItem>
          </AnimatedCommandGroup>
          <CommandSeparator className="my-1" />
          <AnimatedCommandGroup heading="Theme">
            <AnimatedCommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </AnimatedCommandItem>
          </AnimatedCommandGroup>
          <CommandSeparator className="my-1" />
          <AnimatedCommandGroup heading="Tools">
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/calculator"))}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Calculator</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/billing"))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </AnimatedCommandItem>
          </AnimatedCommandGroup>
          <CommandSeparator className="my-1" />
          <AnimatedCommandGroup heading="Social">
            <AnimatedCommandItem onSelect={() => runCommand(() => window.open("https://twitter.com", "_blank"))}>
              <Twitter className="mr-2 h-4 w-4" />
              <span>Twitter</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => window.open("https://github.com", "_blank"))}>
              <Github className="mr-2 h-4 w-4" />
              <span>GitHub</span>
              <CommandShortcut>⌘G</CommandShortcut>
            </AnimatedCommandItem>
          </AnimatedCommandGroup>
          <CommandSeparator className="my-1" />
          <AnimatedCommandGroup heading="General">
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/support"))}>
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Support</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/profile"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/messages"))}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Messages</span>
            </AnimatedCommandItem>
            <AnimatedCommandItem onSelect={() => runCommand(() => router.push("/new"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New Item</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </AnimatedCommandItem>
          </AnimatedCommandGroup>
        </CommandList>
        </div>
      </CommandDialog>
    </div>
  )
}

// Animated versions of CommandGroup and CommandItem with framer-motion
function AnimatedCommandGroup({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <CommandGroup heading={heading} className="px-2 py-1">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, staggerChildren: 0.05 }}
      >
        {children}
      </motion.div>
    </CommandGroup>
  )
}

function AnimatedCommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode
  onSelect: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <CommandItem
        onSelect={onSelect}
        className="rounded-md px-2 py-2 aria-selected:bg-accent/50 transition-colors duration-100"
      >
        {children}
      </CommandItem>
    </motion.div>
  )
}
