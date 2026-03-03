# AI 聊天前端项目

## 项目概述

基于 LangGraph 后端的 AI 聊天前端应用，支持多种对话模式。

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| UI 组件 | shadcn/ui |
| 样式 | Tailwind CSS |
| 图标 | Lucide React |
| Markdown | react-markdown + remark-gfm |
| 代码高亮 | Prism.js 或 highlight.js |
| 状态管理 | Zustand (支持 localStorage 持久化) |
| HTTP | fetch (streaming) |

## 核心功能

### 对话模式

| 模式 | 图标 | 说明 |
|------|------|------|
| 项目问答 | BookOpen | RAG 查询项目资料 |
| 错误诊断 | Bug | 粘贴错误代码，AI 分析 |
| API 生成 | Rocket | 上传 Sample + Spec 生成 API |

### 功能特性

- Streaming 流式输出 (打字机效果)
- Markdown 渲染 + 代码高亮
- 对话历史持久化 (localStorage)
- 文件附件上传
- 响应式设计 (桌面/移动端)

## 页面布局

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Logo + 新对话按钮 + 设置)                           │
├───────────────┬─────────────────────────────────────────────┤
│   Sidebar     │              Main Chat Area                 │
│               │                                             │
│  对话历史     │     消息气泡 (用户/AI)                        │
│  列表         │     支持代码高亮、Markdown渲染                │
│               │                                             │
│               │  ┌─────────────────────────────────────┐   │
│               │  │  输入区 + 工具栏 (上传/模式切换)      │   │
│               │  └─────────────────────────────────────┘   │
└───────────────┴─────────────────────────────────────────────┘
```

## 项目结构

```
chat/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn 组件
│   │   ├── ChatMessage.tsx     # 消息气泡
│   │   ├── ChatInput.tsx       # 输入区
│   │   ├── Sidebar.tsx         # 侧边栏
│   │   ├── ModeSelector.tsx    # 模式切换
│   │   └── ApiGenerator.tsx    # API 生成面板
│   ├── hooks/
│   │   └── useChat.ts          # 聊天逻辑 hook
│   ├── lib/
│   │   ├── api.ts              # LangGraph API 封装
│   │   └── utils.ts            # 工具函数
│   ├── store/
│   │   └── chatStore.ts        # Zustand store
│   ├── types/
│   │   └── index.ts            # 类型定义
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 后端 API

LangGraph 全部端点可用：
- `/threads` - 对话线程管理
- `/runs/stream` - 流式响应

## 当前进度

- [x] 需求讨论
- [x] 设计方案确认
- [x] 技术栈选型
- [ ] 项目初始化
- [ ] 组件开发
- [ ] API 集成
- [ ] 测试与优化

---

> 下一步：开始搭建项目