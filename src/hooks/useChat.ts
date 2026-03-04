import { useCallback, useState, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { streamRun, createThread as createApiThread, checkApiConnection } from '@/lib/api'
import type { Message, Attachment } from '@/types'

const generateId = () => Math.random().toString(36).substring(2, 15)

export function useChat() {
  const {
    threads,
    currentThreadId,
    mode,
    isLoading,
    createThread,
    addMessage,
    updateMessage,
    setIsLoading,
  } = useChatStore()

  const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null)

  const currentThread = threads.find((t) => t.id === currentThreadId)

  // 检查 API 连接状态
  useEffect(() => {
    checkApiConnection().then((connected) => {
      setIsApiConnected(connected)
    })
  }, [])

  const sendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      let threadId = currentThreadId

      if (!threadId) {
        threadId = createThread()
      }

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
        attachments,
      }

      addMessage(threadId, userMessage)

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      addMessage(threadId, assistantMessage)
      setIsLoading(true)

      try {
        // 检查连接状态
        const connected = await checkApiConnection()
        if (!connected) {
          updateMessage(
            threadId,
            assistantMessage.id,
            '❌ Cannot connect to backend service.\n\nPlease ensure LangGraph service is running, or check VITE_API_URL configuration.'
          )
          setIsApiConnected(false)
          setIsLoading(false)
          return
        }

        setIsApiConnected(true)

        let apiThreadId: string
        try {
          apiThreadId = await createApiThread()
        } catch {
          apiThreadId = threadId
        }

        await streamRun(
          {
            threadId: apiThreadId,
            messages: [...(currentThread?.messages || []), userMessage],
            mode,
            attachments,
          },
          (chunk) => {
            updateMessage(threadId!, assistantMessage.id, (prev) => prev + chunk)
          },
          (error) => {
            console.error('Stream error:', error)
            updateMessage(threadId!, assistantMessage.id, `❌ ${error.message}`)
          },
          () => {
            setIsLoading(false)
          }
        )
      } catch (error) {
        console.error('Send message error:', error)
        updateMessage(
          threadId,
          assistantMessage.id,
          `❌ ${error instanceof Error ? error.message : '未知错误'}`
        )
        setIsLoading(false)
      }
    },
    [currentThreadId, currentThread, mode, createThread, addMessage, updateMessage, setIsLoading]
  )

  return {
    messages: currentThread?.messages || [],
    sendMessage,
    isLoading,
    mode,
    isApiConnected,
  }
}
