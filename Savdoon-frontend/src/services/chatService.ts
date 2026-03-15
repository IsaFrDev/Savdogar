import api from './api';

export interface Message {
    id: number;
    sender_type: 'customer' | 'store' | 'system';
    sender_id?: number;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface Conversation {
    id: number;
    store: number;
    store_name: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_session_id: string;
    status: 'active' | 'closed' | 'pending';
    created_at: string;
    updated_at: string;
    messages: Message[];
    unread_count: number;
}

export interface ConversationListItem {
    id: number;
    customer_name: string;
    customer_session_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    last_message?: {
        content: string;
        sender_type: string;
        created_at: string;
    };
    unread_count: number;
}

// Chat service for customer and store interactions
export const chatService = {
    // Customer methods
    startConversation: async (data: {
        store_id: number;
        customer_name: string;
        customer_email?: string;
        customer_phone?: string;
        message: string;
        session_id?: string;
    }) => {
        const response = await api.post('/chat/start/', data);
        return response.data;
    },

    getConversation: async (storeId: number, sessionId: string) => {
        const response = await api.get('/chat/get/', {
            params: { store_id: storeId, session_id: sessionId }
        });
        return response.data;
    },

    sendCustomerMessage: async (sessionId: string, content: string) => {
        const response = await api.post('/chat/send/', {
            session_id: sessionId,
            content
        });
        return response.data;
    },

    pollMessages: async (sessionId: string, lastMessageId: number = 0) => {
        const response = await api.get('/chat/poll/', {
            params: { session_id: sessionId, last_message_id: lastMessageId }
        });
        return response.data;
    },

    // Store owner methods
    getConversations: async () => {
        const response = await api.get('/chat/conversations/');
        return response.data as ConversationListItem[];
    },

    getConversationDetail: async (conversationId: number) => {
        const response = await api.get(`/chat/conversations/${conversationId}/`);
        return response.data as Conversation;
    },

    sendStoreMessage: async (conversationId: number, content: string) => {
        const response = await api.post(`/chat/conversations/${conversationId}/send_message/`, {
            content,
            sender_type: 'store'
        });
        return response.data;
    },

    markAsRead: async (conversationId: number) => {
        const response = await api.post(`/chat/conversations/${conversationId}/mark_read/`);
        return response.data;
    },

    closeConversation: async (conversationId: number) => {
        const response = await api.post(`/chat/conversations/${conversationId}/close/`);
        return response.data;
    },

    deleteConversation: async (conversationId: number) => {
        const response = await api.delete(`/chat/conversations/${conversationId}/`);
        return response.data;
    }
};

export default chatService;
