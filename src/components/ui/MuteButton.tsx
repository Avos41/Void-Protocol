import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { soundManager } from "../../utils/SoundManager";

export function MuteButton() {
  const [muted, setMuted] = useState(soundManager.muted);

  useEffect(() => {
    return soundManager.subscribe(() => {
      setMuted(soundManager.muted);
    });
  }, []);

  const toggle = useCallback(() => {
    soundManager.toggle();
  }, []);

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full border border-void-border bg-void-surface/80 backdrop-blur-sm text-void-muted hover:text-cyan hover:border-cyan/30 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void-bg"
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Unmute" : "Mute"}
    >
      {muted ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </motion.button>
  );
}
