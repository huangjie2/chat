import { useState } from 'react'
import { BookOpen, Bug, Rocket, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChatStore } from '@/store/chatStore'
import type { ChatMode } from '@/types'

const modes: { value: ChatMode; label: string; icon: typeof BookOpen; description: string }[] = [
  {
    value: 'qa',
    label: 'QA',
    icon: BookOpen,
    description: 'RAG query for project docs',
  },
  {
    value: 'debug',
    label: 'Debug',
    icon: Bug,
    description: 'Paste error code for AI analysis',
  },
  {
    value: 'api-gen',
    label: 'API Gen',
    icon: Rocket,
    description: 'Upload Sample + Spec to generate API',
  },
]

export function ModeSelector() {
  const { mode, setMode } = useChatStore()
  const [open, setOpen] = useState(false)

  const currentMode = modes.find((m) => m.value === mode)!
  const Icon = currentMode.icon

  const handleSelect = (value: ChatMode) => {
    setMode(value)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon className="h-4 w-4" />
          <span>{currentMode.label}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {modes.map((m) => {
          const MIcon = m.icon
          return (
            <DropdownMenuItem
              key={m.value}
              onSelect={() => handleSelect(m.value)}
              className="flex items-center gap-2"
            >
              <MIcon className="h-4 w-4" />
              <div className="flex flex-col">
                <span>{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.description}</span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
