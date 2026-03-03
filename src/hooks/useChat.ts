import { useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { streamRun, createThread as createApiThread } from '@/lib/api'
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

  const currentThread = threads.find((t) => t.id === currentThreadId)

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
        let apiThreadId: string

        try {
          apiThreadId = await createApiThread()
        } catch {
          // If API thread creation fails, use local thread ID
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
            updateMessage(threadId!, assistantMessage.id, chunk)
          },
          (error) => {
            console.error('Stream error:', error)
            updateMessage(
              threadId!,
              assistantMessage.id,
              `错误: ${error.message}`
            )
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
          `错误: ${error instanceof Error ? error.message : '未知错误'}`
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
  }
}
