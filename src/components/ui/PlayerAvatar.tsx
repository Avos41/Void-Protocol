import { motion } from "framer-motion";
import type { Player } from "../../types/game";
import { Role } from "../../types/game";

interface PlayerAvatarProps {
  player: Player;
  role?: Role | null;
  showRole?: boolean;
  showReady?: boolean;
  isVotable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-10 h-10 text-lg",
  md: "w-14 h-14 text-2xl",
  lg: "w-20 h-20 text-4xl",
};

export function PlayerAvatar({
  player,
  role,
  showRole = false,
  showReady = false,
  isVotable = false,
  isSelected = false,
  onClick,
  size = "md",
}: PlayerAvatarProps) {
  const isDisconnected = !player.isConnected;
  const isDead = !player.isAlive;

  // Determine border style based on ready state
  const borderClass = isSelected
    ? "border-cyan bg-cyan/20 shadow-[0_0_20px_#00f0ff40]"
    : showReady && player.isReady
      ? "border-void-success/60 bg-void-success/5 shadow-[0_0_12px_#22c55e30]"
      : isDisconnected
        ? "border-void-muted/30 bg-void-surface"
        : "border-void-border bg-void-surface";

  // Build aria label
  const ariaLabel = [
    player.name,
    isDead ? "(eliminated)" : "",
    isDisconnected ? "(disconnected)" : "",
    showRole && role ? `Role: ${role}` : "",
    showReady ? (player.isReady ? "Ready" : "Not ready") : "",
    player.isHost ? "Host" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.div
      whileHover={isVotable ? { scale: 1.08, y: -2 } : {}}
      whileTap={isVotable ? { scale: 0.95 } : {}}
      onClick={isVotable && !isDead ? onClick : undefined}
      role={isVotable ? "button" : undefined}
      tabIndex={isVotable && !isDead ? 0 : undefined}
      onKeyDown={
        isVotable && !isDead
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={ariaLabel}
      className={`
        flex flex-col items-center gap-1.5
        ${isVotable && !isDead ? "cursor-pointer" : ""}
        ${isDead ? "opacity-40" : ""}
      `}
    >
      {/* Avatar circle with breathing animation */}
      <div
        className={`
          relative flex items-center justify-center rounded-full
          border-2 transition-all duration-300
          ${!isDead && !isDisconnected ? "breathing" : ""}
          ${sizeMap[size]}
          ${borderClass}
        `}
      >
        <span className={isDead ? "grayscale" : ""} aria-hidden="true">
          {player.avatar}
        </span>

        {/* Dead indicator — icon paired with visual */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="text-red text-2xl font-bold opacity-80">✕</span>
          </div>
        )}

        {/* Host crown */}
        {player.isHost && (
          <span className="absolute -top-2 -right-1 text-sm" aria-hidden="true" title="Host">
            👑
          </span>
        )}

        {/* Connection status dot with icon/color pairing */}
        <div
          className={`
            absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-void-surface
            ${isDisconnected ? "bg-void-muted" : "bg-void-success"}
          `}
          title={isDisconnected ? "Disconnected" : "Connected"}
          aria-hidden="true"
        />
      </div>

      {/* Name */}
      <span
        className={`
          text-xs font-mono font-medium truncate max-w-[80px]
          ${isDisconnected ? "text-void-muted" : "text-void-text"}
        `}
      >
        {player.name}
      </span>

      {/* Ready badge with icon + color */}
      {showReady && (
        <span
          className={`
            text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1
            ${player.isReady
              ? "border-void-success/40 bg-void-success/10 text-void-success"
              : "border-void-border bg-void-surface text-void-dim"
            }
          `}
        >
          <span aria-hidden="true">{player.isReady ? "✓" : "○"}</span>
          {player.isReady ? "READY" : "STANDBY"}
        </span>
      )}

      {/* Role badge (if revealed) with icon + color */}
      {showRole && role && (
        <span
          className={`
            text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1
            ${role === Role.Saboteur
              ? "bg-saboteur/20 text-saboteur"
              : "bg-crew/20 text-crew"
            }
          `}
        >
          <span aria-hidden="true">{role === Role.Saboteur ? "💀" : "🛡️"}</span>
          {role}
        </span>
      )}
    </motion.div>
  );
}
