import type { Message, Attachment } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:2024'
const TIMEOUT_MS = 10000 // 10秒超时

export interface CreateThreadResponse {
  thread_id: string
}

export interface StreamRunParams {
  threadId: string
  messages: Message[]
  mode: string
  attachments?: Attachment[]
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function checkApiConnection(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/threads`, {
      method: 'GET',
    }, 5000)
    return response.ok || response.status === 405 // 405 也表示服务在线
  } catch {
    return false
  }
}

export async function createThread(): Promise<string> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error(`创建对话失败: ${response.status} ${response.statusText}`)
  }

  const data: CreateThreadResponse = await response.json()
  return data.thread_id
}

export async function streamRun(
  params: StreamRunParams,
  onChunk: (content: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  const { threadId, messages, mode, attachments } = params

  const formattedMessages = messages.map((m) => ({
    type: m.role,
    content: m.content,
  }))

  const input = {
    messages: formattedMessages,
    mode,
    attachments: attachments?.map((a) => ({
      name: a.name,
      type: a.type,
      content: a.content,
    })),
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/threads/${threadId}/runs/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: 'agent',
          input,
          stream_mode: ['messages'],
        }),
      },
      30000 // 流式请求允许更长超时
    )

    if (!response.ok) {
      if (response.status === 0) {
        throw new Error('无法连接到后端服务，请检查服务是否启动')
      }
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应内容')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onComplete()
            return
          }
          try {
            const parsed = JSON.parse(data)
            const content = extractContent(parsed)
            if (content) {
              onChunk(content)
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    onComplete()
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        onError(new Error('请求超时，请检查后端服务是否正常运行'))
      } else {
        onError(error)
      }
    } else {
      onError(new Error(String(error)))
    }
  }
}

function extractContent(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null

  const obj = data as Record<string, unknown>

  // Try different response formats
  if (typeof obj.content === 'string') return obj.content
  if (obj.message && typeof obj.message === 'object') {
    const msg = obj.message as Record<string, unknown>
    if (typeof msg.content === 'string') return msg.content
  }
  if (obj.values && typeof obj.values === 'object') {
    const values = obj.values as Record<string, unknown>
    if (Array.isArray(values.messages)) {
      const lastMessage = values.messages[values.messages.length - 1]
      if (lastMessage && typeof lastMessage.content === 'string') {
        return lastMessage.content
      }
    }
  }

  return null
}

export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        resolve(btoa(String.fromCharCode(...new Uint8Array(result as ArrayBuffer))))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}