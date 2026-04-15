import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { usePartySocket } from "../../hooks/usePartySocket";
import { MessageType, GamePhase } from "../../types/game";

interface ChatBoxProps {
  disabled?: boolean;
}

export function ChatBox({ disabled = false }: ChatBoxProps) {
  const { chatMessages, playerId, gameState } = useGameStore();
  const { sendMessage } = usePartySocket();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isVoting = gameState.phase === GamePhase.Voting;
  const isDisabled = disabled || isVoting;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isDisabled) return;

    sendMessage({
      type: MessageType.CHAT_MESSAGE,
      text: trimmed,
    });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-void-muted px-3 py-2 border-b border-void-border/30">
        Comms Channel
        {isVoting && (
          <span className="ml-2 text-void-danger animate-pulse">
            -- LOCKED --
          </span>
        )}
      </h3>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      >
        {chatMessages.length === 0 ? (
          <p className="text-xs text-void-muted/40 text-center mt-4">
            No messages yet...
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => {
              const isMe = msg.playerId === playerId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {msg.avatar}
                  </span>
                  <div
                    className={`
                      max-w-[75%] rounded-lg px-2.5 py-1.5
                      ${isMe
                        ? "bg-cyan/10 border border-cyan/20"
                        : "bg-void-surface-light border border-void-border/30"
                      }
                    `}
                  >
                    <p
                      className={`text-[10px] font-bold mb-0.5 ${
                        isMe ? "text-cyan" : "text-void-muted"
                      }`}
                    >
                      {msg.playerName}
                    </p>
                    <p className="text-xs text-void-text break-words">
                      {msg.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-void-border/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={isVoting ? "Chat disabled during voting" : "Type a message..."}
            maxLength={200}
            className="
              flex-1 bg-void-bg border border-void-border rounded px-3 py-1.5
              text-xs text-void-text placeholder:text-void-muted/40
              focus:outline-none focus:border-cyan/40
              disabled:opacity-40 disabled:cursor-not-allowed
              font-mono
            "
          />
          <button
            onClick={handleSend}
            disabled={isDisabled || !text.trim()}
            className="
              px-3 py-1.5 bg-cyan/10 border border-cyan/30 rounded
              text-xs text-cyan font-bold
              hover:bg-cyan/20 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed
            "
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
