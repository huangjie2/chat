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
    throw new Error(`Failed to create thread: ${response.status} ${response.statusText}`)
  }

  const data: CreateThreadResponse = await response.json()
  return data.thread_id
}

interface StreamMessage {
  content?: string
  response_metadata?: {
    finish_reason?: string
    tool_calls?: Array<{
      type?: string
      function?: {
        name?: string
        arguments?: string // JSON 字符串，需要解析
      }
    }>
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
  // 记录上一条工具调用，避免重复显示
  let lastToolKey = ''

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
        throw new Error('Cannot connect to backend service. Please check if the service is running.')
      }
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Cannot read response content')
    }

    // 显式使用 UTF-8 解码器
    const decoder = new TextDecoder('utf-8')
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

          // 处理 tool 调用 - 在 response_metadata.tool_calls 中
          const toolCalls = msg.response_metadata?.tool_calls
          if (toolCalls && toolCalls.length > 0) {
            for (const tc of toolCalls) {
              const func = tc.function
              if (func?.name) {
                // arguments 是 JSON 字符串，需要解析
                let argsObj = {}
                try {
                  if (func.arguments) {
                    argsObj = JSON.parse(func.arguments)
                  }
                } catch {
                  // 解析失败就用原始字符串
                }
                const toolKey = `${func.name}:${JSON.stringify(argsObj)}`
                // 只比较和上一条是否相同
                if (toolKey !== lastToolKey) {
                  lastToolKey = toolKey
                  const argsStr = JSON.stringify(argsObj, null, 2)
                  onChunk(`\n🔧 **Tool**: \`${func.name}\`\n\`\`\`json\n${argsStr}\n\`\`\`\n`)
                }
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
        onError(new Error('Request timeout. Please check if backend service is running.'))
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
