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
    label: '项目问答',
    icon: BookOpen,
    description: 'RAG 查询项目资料',
  },
  {
    value: 'debug',
    label: '错误诊断',
    icon: Bug,
    description: '粘贴错误代码，AI 分析',
  },
  {
    value: 'api-gen',
    label: 'API 生成',
    icon: Rocket,
    description: '上传 Sample + Spec 生成 API',
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
