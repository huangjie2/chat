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
    return response.ok || response.status === 405
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

interface StreamMessage {
  content?: string
  tool_calls?: Array<{
    name?: string
    args?: Record<string, unknown>
  }>
  response_metadata?: {
    finish_reason?: string
  }
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

  // 用于追踪已显示的内容，避免重复
  let lastContentLength = 0
  let isCompleted = false

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
      30000
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
        if (!line.startsWith('data: ')) continue

        const data = line.slice(6)
        if (data === '[DONE]') {
          if (!isCompleted) {
            onComplete()
          }
          return
        }

        try {
          const parsed: StreamMessage[] = JSON.parse(data)

          if (!Array.isArray(parsed) || parsed.length === 0) continue

          const msg = parsed[0]
          if (!msg) continue

          // 检查结束标志
          if (msg.response_metadata?.finish_reason === 'stop') {
            isCompleted = true
            onComplete()
            return
          }

          // 处理 tool 调用
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            for (const tool of msg.tool_calls) {
              if (tool.name) {
                const argsStr = tool.args ? JSON.stringify(tool.args, null, 2) : '{}'
                onChunk(`\n🔧 **调用工具**: \`${tool.name}\`\n\`\`\`json\n${argsStr}\n\`\`\`\n`)
              }
            }
            continue
          }

          // 处理内容 - 只追加新增部分，避免重复
          if (msg.content && typeof msg.content === 'string') {
            const newContent = msg.content.slice(lastContentLength)
            if (newContent) {
              onChunk(newContent)
              lastContentLength = msg.content.length
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    if (!isCompleted) {
      onComplete()
    }
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
    onComplete()
  }
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
