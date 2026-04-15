import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  label?: string;
}

export function TimerBar({ timeRemaining, totalTime, label }: TimerBarProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const percentage = (displayTime / totalTime) * 100;
  const isUrgent = displayTime <= 30;
  const isCritical = displayTime <= 10;

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  // Local countdown between server syncs
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  return (
    <div
      className="w-full"
      role="timer"
      aria-live="polite"
      aria-label={`${label ?? "Timer"}: ${minutes} minutes ${seconds} seconds remaining`}
    >
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-void-muted flex items-center gap-1.5">
            {/* Icon paired with timer state color */}
            <span
              aria-hidden="true"
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isCritical
                  ? "bg-void-danger"
                  : isUrgent
                    ? "bg-void-warning"
                    : "bg-void-accent"
              }`}
              style={
                isCritical
                  ? { animation: "blink 0.5s ease-in-out infinite" }
                  : isUrgent
                    ? { animation: "blink 1s ease-in-out infinite" }
                    : undefined
              }
            />
            {label}
          </span>
          <motion.span
            key={displayTime}
            initial={{ scale: isCritical ? 1.3 : 1 }}
            animate={{ scale: 1 }}
            className={`
              text-sm font-bold tabular-nums
              ${isCritical
                ? "text-void-danger"
                : isUrgent
                  ? "text-void-warning"
                  : "text-void-text"
              }
            `}
            style={
              isCritical
                ? {
                    animation: "timer-pulse-critical 0.8s ease-in-out infinite",
                    textShadow: "0 0 12px rgba(255, 45, 85, 0.6)",
                  }
                : isUrgent
                  ? { textShadow: "0 0 8px rgba(255, 149, 0, 0.4)" }
                  : undefined
            }
          >
            {minutes}:{seconds.toString().padStart(2, "0")}
          </motion.span>
        </div>
      )}
      <div className="w-full h-1.5 rounded-full bg-void-border overflow-hidden">
        <motion.div
          className={`
            h-full rounded-full transition-colors duration-500
            ${isCritical
              ? "bg-void-danger"
              : isUrgent
                ? "bg-void-warning"
                : "bg-void-accent"
            }
          `}
          style={{
            width: `${percentage}%`,
            animation: isCritical
              ? "timer-pulse-critical 0.8s ease-in-out infinite"
              : isUrgent
                ? "timer-pulse-urgent 1.5s ease-in-out infinite"
                : undefined,
          }}
          animate={{
            boxShadow: isCritical
              ? [
                  "0 0 8px rgba(255, 45, 85, 0.4)",
                  "0 0 20px rgba(255, 45, 85, 0.8)",
                  "0 0 8px rgba(255, 45, 85, 0.4)",
                ]
              : isUrgent
                ? [
                    "0 0 6px rgba(255, 149, 0, 0.3)",
                    "0 0 14px rgba(255, 149, 0, 0.5)",
                    "0 0 6px rgba(255, 149, 0, 0.3)",
                  ]
                : "0 0 8px rgba(0, 240, 255, 0.3)",
          }}
          transition={{
            boxShadow: { duration: isCritical ? 0.5 : 1.2, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>
    </div>
  );
}
