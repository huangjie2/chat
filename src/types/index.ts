export type ChatMode = 'qa' | 'debug' | 'api-gen'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  attachments?: Attachment[]
  sources?: Source[]
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  content?: string
}

export interface Source {
  id: string
  title: string
  url?: string
}

export interface Thread {
  id: string
  title: string
  mode: ChatMode
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface ChatState {
  threads: Thread[]
  currentThreadId: string | null
  mode: ChatMode
  isLoading: boolean

  // Actions
  createThread: (mode?: ChatMode) => string
  deleteThread: (id: string) => void
  setCurrentThread: (id: string | null) => void
  setMode: (mode: ChatMode) => void
  addMessage: (threadId: string, message: Message) => void
  updateMessage: (threadId: string, messageId: string, content: string) => void
  setIsLoading: (loading: boolean) => void
}

export interface LangGraphThread {
  thread_id: string
  status: string
  values?: {
    messages: Array<{
      type: string
      content: string
    }>
  }
}

export interface LangGraphStreamEvent {
  event: string
  data: {
    [key: string]: unknown
  }
}
