'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function LiveIntelChat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<string>('')
  const [hasAsked, setHasAsked] = useState(false)

  const isLoading = status === 'streaming' || status === 'submitted'

  // Extract text from a v6 UIMessage (parts or content fallback)
  const getMessageText = (message: any): string => {
    if (message.parts?.length) {
      const fromParts = message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text ?? '')
        .join('')
      if (fromParts.trim()) return fromParts
    }
    return typeof message.content === 'string' ? message.content : ''
  }

  // Update the displayed answer as tokens stream in and when complete
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m: any) => m.role === 'assistant')
    if (!lastAssistant) return
    const text = getMessageText(lastAssistant)
    if (text) setAnswer(text)
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    setAnswer('')      // Clear previous answer immediately
    setHasAsked(true)
    setInput('')
    sendMessage({ text: trimmed })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col h-full justify-between">

      {/* Answer Box */}
      <div className="flex-1 min-h-[160px] max-h-[300px] overflow-y-auto rounded-lg p-4 bg-surface-container-low/50 border border-outline-variant/10 custom-scrollbar mb-6 flex items-start">
        {!hasAsked && (
          <p className="text-on-surface-variant/40 text-sm italic select-none">
            Ask a question about your sales or marketing data to get started...
          </p>
        )}

        {hasAsked && isLoading && !answer && (
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <Loader2 size={15} className="animate-spin text-primary shrink-0" />
            <span className="italic">Querying database and analyzing data...</span>
          </div>
        )}

        {answer && (
          <p className="text-on-surface font-semibold text-sm leading-relaxed whitespace-pre-wrap">
            {answer}
            {isLoading && (
              <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse align-middle" />
            )}
          </p>
        )}
      </div>

      {/* Input and Submit */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about marketing metrics, sales, trends, etc..."
          className="w-full bg-surface-container-low text-on-surface rounded-md px-4 py-3 border border-outline-variant/20 focus:outline-none focus:border-primary resize-none h-20 text-sm placeholder:text-on-surface-variant/50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-full primary-btn py-3 text-sm flex items-center justify-center space-x-2 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {isLoading
            ? <Loader2 size={16} className="animate-spin relative z-10" />
            : <Send size={16} className="relative z-10" />
          }
          <span className="font-bold tracking-widest uppercase relative z-10">
            {isLoading ? 'Processing' : 'Submit Question'}
          </span>
        </button>
      </form>
    </div>
  )
}
