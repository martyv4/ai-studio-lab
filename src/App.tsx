import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User, Loader2, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sendMessageStream, Message } from "./services/geminiService";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let assistantText = "";
      const assistantMessage: Message = {
        role: "model",
        text: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const stream = sendMessageStream(input, messages);
      
      for await (const chunk of stream) {
        assistantText += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...assistantMessage,
            text: assistantText,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Gemini Chat</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">AI Assistant</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearChat}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={clearChat}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors flex items-center gap-2 px-4 text-sm font-medium"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-zinc-300" />
            <div>
              <p className="text-lg font-medium">How can I help you today?</p>
              <p className="text-sm">Start a conversation with Gemini.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.timestamp + idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" ? "bg-zinc-200" : "bg-zinc-900"
                }`}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} className="text-white" />}
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-zinc-100 text-zinc-900 rounded-tr-none" 
                    : "bg-white border border-zinc-200 text-zinc-900 rounded-tl-none shadow-sm"
                }`}>
                  {msg.text || (isLoading && idx === messages.length - 1 ? <Loader2 className="animate-spin" size={16} /> : "")}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-zinc-800"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </form>
      
      <footer className="mt-4 text-center">
        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Powered by Google Gemini</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}</style>
    </div>
  );
}
