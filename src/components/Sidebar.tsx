import { MessageSquare, Plus, Trash2, BookOpen, Bug, Rocket, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useChatStore } from '@/store/chatStore'
import type { ChatMode } from '@/types'

const modeConfig: Record<ChatMode, { label: string; icon: typeof BookOpen; color: string }> = {
  qa: { label: 'QA', icon: BookOpen, color: 'bg-blue-500' },
  debug: { label: 'Debug', icon: Bug, color: 'bg-orange-500' },
  'api-gen': { label: 'API Gen', icon: Rocket, color: 'bg-green-500' },
}

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const {
    threads,
    currentThreadId,
    createThread,
    deleteThread,
    setCurrentThread,
    clearAll,
    mode,
  } = useChatStore()

  const handleNewThread = () => {
    createThread()
  }

  const handleSelectThread = (id: string) => {
    setCurrentThread(id)
  }

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteThread(id)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const groupedThreads = threads.reduce(
    (groups, thread) => {
      const date = formatDate(thread.updatedAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(thread)
      return groups
    },
    {} as Record<string, typeof threads>
  )

  if (!isOpen) return null

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">History</h2>
        <Button variant="ghost" size="icon" onClick={handleNewThread}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(groupedThreads).map(([date, dateThreads]) => (
            <div key={date} className="mb-4">
              <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                {date}
              </h3>
              {dateThreads.map((thread) => {
                const config = modeConfig[thread.mode]
                const Icon = config.icon
                const isActive = thread.id === currentThreadId

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`mb-1 flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors ${
                      isActive ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 truncate text-sm">{thread.title}</div>
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1 px-1.5 py-0 text-xs ${config.color} text-white`}
                    >
                      <Icon className="h-3 w-3" />
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </div>
          ))}

          {threads.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Current mode:</span>
          <Badge variant="secondary" className={modeConfig[mode].color}>
            {modeConfig[mode].label}
          </Badge>
        </div>
        {threads.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (confirm('Clear all chat history? This cannot be undone.')) {
                clearAll()
              }
            }}
          >
            <Trash className="mr-2 h-4 w-4" />
            Clear All History
          </Button>
        )}
      </div>
    </aside>
  )
}
