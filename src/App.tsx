import { useState } from 'react'
import { Menu, X, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar } from '@/components/Sidebar'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { ModeSelector } from '@/components/ModeSelector'
import { useChat } from '@/hooks/useChat'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { messages, sendMessage, isLoading, isApiConnected } = useChat()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} />

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <h1 className="text-lg font-semibold">AI Chat</h1>

            {/* 连接状态指示器 */}
            <div className="ml-2 flex items-center gap-1">
              {isApiConnected === null ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isApiConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          <ModeSelector />
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                <h2 className="mb-2 text-2xl font-semibold">开始新对话</h2>
                <p className="text-muted-foreground">
                  选择模式并输入消息开始与 AI 对话
                </p>
                {isApiConnected === false && (
                  <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    ⚠️ 后端服务未连接，请检查 LangGraph 服务是否启动
                  </p>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
