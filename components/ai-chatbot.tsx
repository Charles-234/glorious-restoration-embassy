"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, AlertCircle } from "lucide-react";
import { siteConfig } from "@/lib/siteData";
import { motion, AnimatePresence } from "framer-motion";

const defaultMessages = [
  {
    id: 1,
    role: "assistant", 
    text: `Welcome to the ${siteConfig.brandName} AI Chat Companion! I'm here to help you with spiritual guidance, sermon recommendations, and answers to your faith questions. What would you like to discuss today?`
  }
];

const quickReplies = [
  "What are your Sunday service times?",
  "Tell me about your youth ministry",
  "What's the upcoming event schedule?",
  "How can I grow in my faith?",
  "Pray for me",
  "What sermons do you recommend?"
];

export function AIChatbot() {
  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of chat when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;

    const userMessage = { id: Date.now(), role: "user" as const, text: content };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content })
      });
      const result = await response.json();

      if (!response.ok) {
        setMessages((current) => [
          ...current,
          { 
            id: Date.now() + 2, 
            role: "assistant" as const, 
            text: result.error || "Sorry, I couldn't reach the chat assistant. Please check your connection." 
          }
        ]);
        setError(result.error || "Chat service unavailable");
      } else {
        setMessages((current) => [
          ...current,
          { id: Date.now() + 2, role: "assistant" as const, text: result.message }
        ]);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        { 
          id: Date.now() + 2, 
          role: "assistant" as const, 
          text: "An unexpected error occurred while contacting the AI service. Please try again." 
        }
      ]);
      setError("Network error - please check your connection");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setInput(text);
    // Focus the input field
    const inputField = document.querySelector('input[placeholder*="Type a question"]') as HTMLInputElement;
    if (inputField) {
      inputField.focus();
    }
  };

  const clearChat = () => {
    setMessages(defaultMessages);
    setError(null);
  };

  return (
    <div className="readable-surface rounded-[2.5rem] p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle size={22} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-accent">AI Chat Companion</p>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Spiritual Guidance Chat</h2>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          title="Clear chat"
        >
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Chat messages */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              layout
            >
              <div 
                className={`rounded-2xl p-4 ${message.role === "assistant" 
                  ? "bg-muted/50 text-foreground border border-border/50"
                  : "bg-primary/10 text-foreground border border-primary/20"
                }`}
              >
                <p className="text-sm leading-6 whitespace-pre-wrap">{message.text}</p>
                {message.role === "assistant" && (
                  <motion.div
                    className="mt-2 text-xs text-muted-foreground/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    AI Assistant
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-3 bg-destructive/10 border border-destructive/30 text-destructive"
          >
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {messages.length === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="my-4 grid grid-cols-2 md:grid-cols-3 gap-2"
        >
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleQuickReply(reply)}
              className="px-4 py-2 text-xs md:text-sm rounded-full bg-muted/50 hover:bg-muted hover:text-foreground transition-colors text-muted-foreground border border-border/50 whitespace-nowrap truncate"
            >
              {reply}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input area */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a question about worship, sermons, faith, or community..."
          className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60 min-w-[120px]"
        >
          <Send size={16} className="mr-2" /> {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}
