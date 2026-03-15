import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { aiApi } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}



export function AIAssistant() {
  const { t, products, currentStore, language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('assistantInitialMsg').replace('{store}', currentStore?.name || 'this store')
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Use real AI API
      const response = await aiApi.getChatResponse({
        message: input,
        products: products, // Provide real context
        store_info: {
          name: currentStore?.name,
          business_type: currentStore?.business_type,
          pickup_address: currentStore?.pickup_address
        },
        language: language // Pass current app language
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('assistantErrorMsg')
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)] flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[var(--glass-border)]"
              style={{ maxHeight: 'calc(100vh - 6rem)' }}
            >
              {/* Header */}
              <div className="p-4 bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('aiTitle')}</h3>
                      <p className="text-xs text-white/70">{t('aiSubtitle')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${message.role === 'user'
                        ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] rounded-br-md shadow-lg shadow-[var(--brand-primary-glow)]'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
                    </div>
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('typeMessage')}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:border-[var(--brand-primary)] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2.5 rounded-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[var(--brand-primary-glow)]"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
