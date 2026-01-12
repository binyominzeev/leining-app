/**
 * Custom hook for managing WebSocket connection to backend
 */
import { useState, useRef, useCallback, useEffect } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  sendAudio: (audioData: ArrayBuffer) => void;
  lastMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    sendMessage,
    sendAudio,
    lastMessage,
    connect,
    disconnect,
  };
}
