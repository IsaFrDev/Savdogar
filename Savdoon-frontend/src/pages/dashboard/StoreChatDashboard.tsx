import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, CheckCheck, Loader2, X, Clock, Trash2 } from 'lucide-react';
import { chatService, ConversationListItem, Conversation, Message } from '../../services/chatService';
import { useApp } from '../../context/AppContext';
import { useStoreWebSocket, StoreEvent } from '../../hooks/useStoreWebSocket';

export function StoreChatDashboard() {
    const { t, currentStore } = useApp();
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, convId: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebSocket hook for store-wide events
    const { status: wsStatus } = useStoreWebSocket(currentStore ? Number(currentStore.id) : null, (event: StoreEvent) => {
        if (event.event === 'new_message') {
            // Update conversation list
            setConversations(prev => prev.map(conv => {
                if (conv.id === event.conversation_id) {
                    return {
                        ...conv,
                        updated_at: event.message?.created_at || new Date().toISOString(),
                        last_message: {
                            content: event.message?.content || '',
                            sender_type: event.message?.sender_type || '',
                            created_at: event.message?.created_at || '',
                        },
                        unread_count: selectedConversation?.id === conv.id ? conv.unread_count : conv.unread_count + 1
                    };
                }
                return conv;
            }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));

            // Update active conversation if it's the one that received the message
            if (selectedConversation && selectedConversation.id === event.conversation_id) {
                setSelectedConversation(prev => {
                    if (!prev) return prev;
                    // Deduplicate
                    if (prev.messages.find(m => m.id === event.message?.id)) return prev;
                    return {
                        ...prev,
                        messages: [...prev.messages, event.message as Message]
                    };
                });
                // Mark as read in the backend
                chatService.markAsRead(event.conversation_id);
            }
        } else if (event.event === 'new_conversation') {
            setConversations(prev => [event.conversation, ...prev]);
        }
    });

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    // Polling fallback when WebSocket is not connected
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (wsStatus !== 'connected') {
            interval = setInterval(async () => {
                try {
                    await loadConversations();
                    if (selectedConversation) {
                        const data = await chatService.getConversationDetail(selectedConversation.id);
                        // Only update if there are new messages to avoid cursor jumps or stuttering
                        setSelectedConversation(prev => {
                            if (!prev || prev.id !== data.id) return data;
                            if (prev.messages.length === data.messages.length) return prev;
                            return data;
                        });
                    }
                } catch (error) {
                    // Silent fail
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [wsStatus, selectedConversation?.id, conversations.length]);

    const loadConversations = async () => {
        try {
            const data = await chatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const loadConversationDetail = async (id: number) => {
        try {
            const data = await chatService.getConversationDetail(id);
            setSelectedConversation(data);
            // Mark as read
            await chatService.markAsRead(id);
            loadConversations(); // Refresh list to update unread counts
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedConversation || isSending) return;

        setIsSending(true);
        try {
            await chatService.sendStoreMessage(selectedConversation.id, input);
            setInput('');
            loadConversationDetail(selectedConversation.id);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
    };

    const handleDeleteConversation = async (id: number) => {
        setIsDeleting(true);
        try {
            await chatService.deleteConversation(id);
            if (selectedConversation?.id === id) {
                setSelectedConversation(null);
            }
            await loadConversations();
            setContextMenu(null);
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            alert('Suhbatni o\'chirishda xatolik yuz berdi');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, convId: number) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            convId
        });
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const getTotalUnread = () => {
        return conversations.reduce((sum, c) => sum + c.unread_count, 0);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
            </div>
        );
    }

    return (
        <div className="h-[600px] flex rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-[var(--card-bg)] backdrop-blur-xl">
            {/* Conversations List */}
            <div className="w-80 border-r border-[var(--glass-border)] flex flex-col">
                <div className="p-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        {t('chatTitle')}
                        {getTotalUnread() > 0 && (
                            <span className="ml-auto px-2 py-0.5 bg-[var(--primary-foreground)] text-[var(--brand-primary)] text-xs font-bold rounded-full">
                                {getTotalUnread()}
                            </span>
                        )}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                            <p className="text-sm">Hali suhbatlar yo'q</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => loadConversationDetail(conv.id)}
                                onContextMenu={(e) => handleContextMenu(e, conv.id)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedConversation?.id === conv.id ? 'bg-[var(--brand-primary)]/5' : ''
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-[var(--primary-foreground)] font-medium flex-shrink-0">
                                    {conv.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900 truncate">
                                            {conv.customer_name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatTime(conv.updated_at)}
                                        </span>
                                    </div>
                                    {conv.last_message && (
                                        <p className="text-sm text-gray-500 truncate mt-0.5">
                                            {conv.last_message.sender_type === 'store' && (
                                                <span className="text-[var(--brand-primary)]">Siz: </span>
                                            )}
                                            {conv.last_message.content}
                                        </p>
                                    )}
                                </div>
                                {conv.unread_count > 0 && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                        {conv.unread_count}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
                                {selectedConversation.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-[var(--text-main)]">
                                    {selectedConversation.customer_name}
                                </h3>
                                <p className="text-xs text-[var(--text-dim)] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(selectedConversation.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                backgroundColor: '#f8fafc'
                            }}
                        >
                            {selectedConversation.messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.sender_type === 'store' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${message.sender_type === 'store'
                                            ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] rounded-br-md'
                                            : 'bg-white text-gray-800 rounded-bl-md'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <div className={`flex items-center gap-1 mt-1 ${message.sender_type === 'store' ? 'justify-end' : ''
                                            }`}>
                                            <span className={`text-[10px] ${message.sender_type === 'store' ? 'text-white/70' : 'text-[var(--text-dim)]'
                                                }`}>
                                                {formatTime(message.created_at)}
                                            </span>
                                            {message.sender_type === 'store' && (
                                                <CheckCheck className="w-3 h-3 text-white/70" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-100">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Javob yozing..."
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isSending}
                                    className="p-2.5 rounded-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-50 transition-colors"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)]">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-10" />
                        <p className="text-lg font-medium tracking-tight">{t('selectChat') || 'Suhbatni tanlang'}</p>
                        <p className="text-sm opacity-60 italic">{t('selectChatDesc') || 'Mijoz bilan muloqotni boshlash uchun'}</p>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-[9999] bg-white border border-gray-200 shadow-xl rounded-xl py-2 w-48 overflow-hidden"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => handleDeleteConversation(contextMenu.convId)}
                        disabled={isDeleting}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium border-none outline-none"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        {t('deleteChat')}
                    </button>
                </div>
            )}
        </div>
    );
}
