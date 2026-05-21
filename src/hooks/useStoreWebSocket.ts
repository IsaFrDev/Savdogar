import { useState, useEffect, useRef } from 'react';

export interface StoreEvent {
    type: 'chat_event';
    event: 'new_message' | 'new_conversation';
    conversation_id?: number;
    message?: {
        id: number;
        content: string;
        sender_type: string;
        created_at: string;
    };
    conversation?: any; // ConversationListItem
}

export function useStoreWebSocket(storeId: number | null, onEvent?: (event: StoreEvent) => void) {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);

    const onEventRef = useRef(onEvent);

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    const connect = () => {
        if (!storeId) return;

        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        // Vercel does not support standard WebSockets in serverless functions.
        // We only attempt to connect if we're on localhost or if a custom WS server is defined.
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocal) {
            // Silently skip — use Supabase Realtime in production instead.
            setStatus('disconnected');
            return;
        }

        setStatus('connecting');

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = 'localhost:8000';
        const wsUrl = `${protocol}//${host}/ws/store/${storeId}/`;

        console.log(`Attempting WebSocket connection to: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Store WebSocket connected');
            setStatus('connected');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onEventRef.current) onEventRef.current(data);
            } catch (err) {
                console.error('WebSocket message parse error:', err);
            }
        };

        socket.onclose = (e) => {
            console.log('Store WebSocket disconnected', e.code, e.reason);
            setStatus('disconnected');
            // Only reconnect if not intentionally closed
            if (e.code !== 1000 && e.code !== 1001) {
                reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
            }
        };

        socket.onerror = (error) => {
            console.error('Store WebSocket error:', error);
        };

        socketRef.current = socket;
    };

    const reconnect = () => {
        if (socketRef.current) {
            socketRef.current.close(1000, "Manual reconnect");
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        connect();
    };

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                // If it's connecting, it might throw a warning if closed immediately, but we must close it
                if (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.close(1000, "Component unmounted");
                }
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [storeId]);

    return { status, reconnect };
}
