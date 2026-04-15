import { useEffect, useCallback } from "react";
import PartySocket from "partysocket";
import { useGameStore } from "../stores/gameStore";
import { MessageType } from "../types/game";
import type { ClientMessage, ServerMessage } from "../types/game";

const PARTYKIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST ?? "127.0.0.1:1999";

// Module-level socket so it survives component mounts/unmounts
let socket: PartySocket | null = null;

export function usePartySocket() {
  const {
    setPlayerId,
    setConnected,
    handleServerMessage,
    setError,
  } = useGameStore();

  // Re-attach the message listener whenever handleServerMessage changes,
  // so the socket always calls into the latest store handler.
  useEffect(() => {
    if (!socket) return;

    const onMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as ServerMessage;
        handleServerMessage(message);
      } catch {
        console.error("Failed to parse server message");
      }
    };

    socket.addEventListener("message", onMessage);
    return () => {
      socket?.removeEventListener("message", onMessage);
    };
  }, [handleServerMessage]);

  // Connect to a room
  const connect = useCallback(
    (code: string, playerName: string, avatar: string) => {
      // Disconnect existing socket
      if (socket) {
        socket.close();
        socket = null;
      }

      const newSocket = new PartySocket({
        host: PARTYKIT_HOST,
        room: code.toLowerCase(),
      });

      newSocket.addEventListener("open", () => {
        setPlayerId(newSocket.id);
        setConnected(true);

        // Immediately send JOIN with the values passed in (not from closure)
        const joinMsg = {
          type: MessageType.JOIN,
          playerName,
          avatar,
        } as ClientMessage;
        newSocket.send(JSON.stringify(joinMsg));
      });

      newSocket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data as string) as ServerMessage;
          useGameStore.getState().handleServerMessage(message);
        } catch {
          console.error("Failed to parse server message");
        }
      });

      newSocket.addEventListener("close", () => {
        setConnected(false);
      });

      newSocket.addEventListener("error", () => {
        setError("Connection error — retrying...");
      });

      socket = newSocket;
    },
    [setPlayerId, setConnected, setError]
  );

  // Send a message to the server
  const sendMessage = useCallback((message: ClientMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      socket = null;
    }
    setConnected(false);
  }, [setConnected]);

  return {
    connect,
    disconnect,
    sendMessage,
  };
}
