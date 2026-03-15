import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
    type: 'message';
    id: number;
    content: string;
    sender_type: 'customer' | 'store' | 'system';
    sender_id?: number;
    created_at: string;
}

export function useChatWebSocket(conversationId: number | string | null, onMessageReceived?: (message: WebSocketMessage) => void) {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);

    const onMessageReceivedRef = useRef(onMessageReceived);

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    const connect = () => {
        if (!conversationId) return;

        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        setStatus('connecting');

        // Dynamic URL construction
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
        const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/`;

        console.log(`Attempting Chat WebSocket connection to: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Chat WebSocket connected');
            setStatus('connected');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message' && onMessageReceivedRef.current) {
                    onMessageReceivedRef.current(data);
                }
            } catch (err) {
                console.error('Chat WebSocket parse error:', err);
            }
        };

        socket.onclose = (e) => {
            console.log('Chat WebSocket disconnected', e.code, e.reason);
            setStatus('disconnected');
            // Reconnect if not intentional
            if (e.code !== 1000 && e.code !== 1001) {
                reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
            }
        };

        socket.onerror = (error) => {
            console.error('Chat WebSocket error:', error);
        };

        socketRef.current = socket;
    };

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                if (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.close(1000, "Component unmounted");
                }
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [conversationId]);

    const sendMessage = useCallback((content: string, senderType: 'customer' | 'store', senderId?: number) => {
        if (socketRef.current && status === 'connected') {
            socketRef.current.send(JSON.stringify({
                content,
                sender_type: senderType,
                sender_id: senderId
            }));
            return true;
        }
        return false;
    }, [status]);

    const reconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close(1000, "Manual reconnect");
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        connect();
    }, [conversationId]);

    return { status, sendMessage, reconnect };
}
