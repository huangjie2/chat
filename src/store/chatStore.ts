import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatState, Thread, ChatMode } from '@/types'

const generateId = () => Math.random().toString(36).substring(2, 15)

const generateTitle = (content: string): string => {
  const firstLine = content.split('\n')[0]
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      currentThreadId: null,
      mode: 'qa',
      isLoading: false,

      createThread: (mode?: ChatMode) => {
        const newThread: Thread = {
          id: generateId(),
          title: '新对话',
          mode: mode || get().mode,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          threads: [newThread, ...state.threads],
          currentThreadId: newThread.id,
        }))
        return newThread.id
      },

      deleteThread: (id) => {
        set((state) => {
          const newThreads = state.threads.filter((t) => t.id !== id)
          const newCurrentId =
            state.currentThreadId === id
              ? newThreads.length > 0
                ? newThreads[0].id
                : null
              : state.currentThreadId
          return { threads: newThreads, currentThreadId: newCurrentId }
        })
      },

      setCurrentThread: (id) => {
        set({ currentThreadId: id })
        if (id) {
          const thread = get().threads.find((t) => t.id === id)
          if (thread) {
            set({ mode: thread.mode })
          }
        }
      },

      setMode: (mode) => {
        set({ mode })
        const { currentThreadId, threads } = get()
        if (currentThreadId) {
          set({
            threads: threads.map((t) =>
              t.id === currentThreadId ? { ...t, mode, updatedAt: Date.now() } : t
            ),
          })
        }
      },

      addMessage: (threadId, message) => {
        set((state) => ({
          threads: state.threads.map((t) => {
            if (t.id !== threadId) return t
            const messages = [...t.messages, message]
            const title =
              t.messages.length === 0 && message.role === 'user'
                ? generateTitle(message.content)
                : t.title
            return { ...t, messages, title, updatedAt: Date.now() }
          }),
        }))
      },

      updateMessage: (threadId, messageId, content) => {
        set((state) => ({
          threads: state.threads.map((t) => {
            if (t.id !== threadId) return t
            return {
              ...t,
              messages: t.messages.map((m) => {
                if (m.id !== messageId) return m
                const newContent = typeof content === 'function' ? content(m.content) : content
                return { ...m, content: newContent }
              }),
              updatedAt: Date.now(),
            }
          }),
        }))
      },

      setIsLoading: (loading) => {
        set({ isLoading: loading })
      },

      clearAll: () => {
        set({
          threads: [],
          currentThreadId: null,
          mode: 'qa',
          isLoading: false,
        })
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        threads: state.threads,
        currentThreadId: state.currentThreadId,
        mode: state.mode,
        // 不持久化 isLoading
      }),
    }
  )
)
