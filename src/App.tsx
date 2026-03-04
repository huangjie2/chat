import { useState, useRef, useEffect } from 'react'
import { Menu, X, Wifi, WifiOff, Loader2, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar } from '@/components/Sidebar'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { ModeSelector } from '@/components/ModeSelector'
import { useChat } from '@/hooks/useChat'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, isLoading, isApiConnected } = useChat()

  // 滚动到底部
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }

  // 监听滚动，决定是否显示按钮
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport as HTMLDivElement
      // 距离底部超过 100px 时显示按钮
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [])

  // 新消息时自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

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

        <div className="relative flex-1">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                  <h2 className="mb-2 text-2xl font-semibold">开始新对话</h2>
                  <p className="text-muted-foreground">
                    选择模式并输入消息开始与 AI 对话
                  </p>
                  {isApiConnected === false && (
                    <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                      后端服务未连接，请检查 LangGraph 服务是否启动
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

          {/* 滚动到底部按钮 */}
          {showScrollButton && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </div>

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