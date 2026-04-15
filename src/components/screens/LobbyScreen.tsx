import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { usePartySocket } from "../../hooks/usePartySocket";
import { soundManager } from "../../utils/SoundManager";
import {
  MessageType,
  MIN_PLAYERS,
  MAX_PLAYERS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from "../../types/game";
import type {
  ChallengeCategory,
  ChallengeDifficulty,
  LobbySettings,
} from "../../types/game";
// ── Deterministic avatar color from name ───────────────

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return h;
}

function nameToHue(name: string): number {
  return ((hashName(name) % 360) + 360) % 360;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ── Sub-components ─────────────────────────────────────

/** Deterministic SVG avatar — initials on a hashed-color circle */
function GeneratedAvatar({
  name,
  size = 48,
}: {
  name: string;
  size?: number;
}) {
  const hue = nameToHue(name);
  const initials = getInitials(name);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="rounded-full"
    >
      <circle
        cx="24"
        cy="24"
        r="24"
        fill={`hsl(${hue}, 60%, 25%)`}
      />
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke={`hsl(${hue}, 70%, 50%)`}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fill={`hsl(${hue}, 80%, 75%)`}
        fontSize="16"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
      >
        {initials}
      </text>
    </svg>
  );
}

/** Copy-to-clipboard button with feedback */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-3 py-1.5 border border-void-border rounded bg-void-surface/60 text-[10px] font-mono tracking-wider text-void-muted hover:text-cyan hover:border-cyan/30 transition-all duration-200"
    >
      {copied ? "COPIED" : "COPY CODE"}
    </motion.button>
  );
}

/** Room code display — docking bay style with typewriter reveal */
function DockingCode({ code }: { code: string }) {
  const [revealedChars, setRevealedChars] = useState(0);

  useEffect(() => {
    setRevealedChars(0);
    const chars = code.length;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealedChars(i);
      if (i >= chars) {
        clearInterval(interval);
        soundManager.play("click");
      }
    }, 120);
    return () => clearInterval(interval);
  }, [code]);

  const displayed = code.slice(0, revealedChars);
  const placeholder = code.slice(revealedChars).replace(/./g, "_");
  const isRevealing = revealedChars < code.length;

  return (
    <div className="relative text-center">
      <p className="text-[10px] font-mono tracking-[0.4em] text-void-dim uppercase mb-2">
        Docking Bay
      </p>
      <div className="relative inline-block">
        <div className="px-8 py-4 border border-cyan/20 rounded bg-void-bg/80">
          {/* Scanline overlay on the code */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06] rounded"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.15) 2px, rgba(0,240,255,0.15) 4px)",
            }}
          />
          <span className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[0.15em] glow-cyan text-cyan font-mono">
            {displayed}
            <span className="text-void-dim/40">{placeholder}</span>
            {isRevealing && (
              <span className="typewriter-cursor ml-0.5">&nbsp;</span>
            )}
          </span>
        </div>
        {/* Top/bottom accent lines */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, #00f0ff40, transparent)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, #00f0ff20, transparent)",
          }}
        />
      </div>
      <div className="mt-3">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

/** Crew count progress bar */
function CrewCounter({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const pct = (current / max) * 100;
  const ready = current >= MIN_PLAYERS;

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[10px] font-mono tracking-[0.2em] text-void-muted uppercase">
          Crew Aboard
        </span>
        <span
          className={`text-sm font-mono font-bold ${ready ? "text-cyan" : "text-amber"}`}
        >
          {current}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-void-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${ready ? "bg-cyan" : "bg-amber"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            boxShadow: ready
              ? "0 0 8px #00f0ff60"
              : "0 0 8px #ff950060",
          }}
        />
      </div>
      {!ready && (
        <p className="text-[9px] font-mono text-amber/60 mt-1">
          Need {MIN_PLAYERS - current} more to launch
        </p>
      )}
    </div>
  );
}

/** Single crew ID badge card */
function CrewBadge({
  player,
  isSelf,
}: {
  player: import("../../types/game").Player;
  isSelf: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`
        relative flex items-center gap-3 px-4 py-3
        border rounded bg-void-surface/60
        transition-all duration-300
        ${player.isReady
          ? "border-void-success/30 shadow-[0_0_10px_#22c55e15]"
          : "border-void-border"
        }
        ${isSelf ? "ring-1 ring-cyan/20" : ""}
      `}
    >
      {/* Generated SVG avatar */}
      <div className="shrink-0 relative">
        <GeneratedAvatar name={player.name} size={40} />
        {/* Host crown */}
        {player.isHost && (
          <span className="absolute -top-1.5 -right-1.5 text-[10px]">
            👑
          </span>
        )}
        {/* Connection dot */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-void-surface ${
            player.isConnected ? "bg-void-success" : "bg-void-muted"
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold text-void-text truncate">
            {player.name}
          </span>
          {isSelf && (
            <span className="text-[8px] font-mono tracking-wider text-cyan/60 uppercase">
              you
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-lg leading-none">{player.avatar}</span>
          <span className="text-[9px] font-mono text-void-dim uppercase">
            {player.isHost ? "Commander" : "Crew"}
          </span>
        </div>
      </div>

      {/* Ready indicator */}
      <div
        className={`
          shrink-0 px-2 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-wider
          ${player.isReady
            ? "border-void-success/40 bg-void-success/10 text-void-success"
            : "border-void-border bg-void-bg/50 text-void-dim"
          }
        `}
      >
        {player.isReady ? "READY" : "STANDBY"}
      </div>
    </motion.div>
  );
}

/** Category selection cards — host only */
function CategorySelector({
  selected,
  onChange,
  disabled,
}: {
  selected: ChallengeCategory;
  onChange: (cat: ChallengeCategory) => void;
  disabled: boolean;
}) {
  const categories: ChallengeCategory[] = [
    "data-structures",
    "algorithms",
    "oop-basics",
    "string-manipulation",
  ];

  const icons: Record<ChallengeCategory, string> = {
    "data-structures": "📊",
    algorithms: "⚙️",
    "oop-basics": "🧱",
    "string-manipulation": "🔤",
  };

  return (
    <div>
      <p className="text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase mb-2">
        Mission Briefing
      </p>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.97 }}
            onClick={() => !disabled && onChange(cat)}
            disabled={disabled}
            className={`
              relative px-3 py-2.5 rounded border text-left transition-all duration-200
              ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}
              ${selected === cat
                ? "border-cyan/40 bg-cyan/5"
                : "border-void-border bg-void-surface/40 hover:border-void-dim"
              }
            `}
          >
            {selected === cat && (
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #00f0ff50, transparent)",
                }}
              />
            )}
            <span className="text-base">{icons[cat]}</span>
            <p
              className={`text-[10px] font-mono mt-1 ${
                selected === cat ? "text-cyan" : "text-void-muted"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Difficulty selector — host only */
function DifficultySelector({
  selected,
  onChange,
  disabled,
}: {
  selected: ChallengeDifficulty;
  onChange: (diff: ChallengeDifficulty) => void;
  disabled: boolean;
}) {
  const diffs: ChallengeDifficulty[] = ["easy", "medium", "hard"];

  const colors: Record<ChallengeDifficulty, string> = {
    easy: "text-void-success border-void-success/30 bg-void-success/5",
    medium: "text-amber border-amber/30 bg-amber/5",
    hard: "text-red border-red/30 bg-red/5",
  };

  const dimColors: Record<ChallengeDifficulty, string> = {
    easy: "border-void-border bg-void-surface/40 text-void-muted",
    medium: "border-void-border bg-void-surface/40 text-void-muted",
    hard: "border-void-border bg-void-surface/40 text-void-muted",
  };

  return (
    <div>
      <p className="text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase mb-2">
        Clearance Level
      </p>
      <div className="flex gap-2">
        {diffs.map((d) => (
          <motion.button
            key={d}
            whileHover={disabled ? {} : { scale: 1.03 }}
            whileTap={disabled ? {} : { scale: 0.96 }}
            onClick={() => !disabled && onChange(d)}
            disabled={disabled}
            className={`
              flex-1 py-2 rounded border text-center transition-all duration-200
              ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}
              ${selected === d ? colors[d] : dimColors[d]}
            `}
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider">
              {DIFFICULTY_LABELS[d].label}
            </p>
            <p className="text-[8px] font-mono opacity-60 mt-0.5">
              {DIFFICULTY_LABELS[d].rank}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Fullscreen 3-2-1-LAUNCH countdown overlay */
function CountdownOverlay({ count }: { count: number }) {
  const display = count > 0 ? String(count) : "LAUNCH";
  const isLaunch = count === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-bg/90 backdrop-blur-sm"
      style={{
        animation: "screen-shake 0.15s ease-in-out infinite",
      }}
    >
      {/* Radiating rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-cyan/10"
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{
              width: [0, 300 * i],
              height: [0, 300 * i],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 1,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* The number / LAUNCH text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative"
        >
          <span
            className={`
              font-mono font-extrabold glow-cyan select-none
              ${isLaunch
                ? "text-5xl sm:text-7xl md:text-8xl text-cyan"
                : "text-7xl sm:text-9xl md:text-[10rem] text-void-text"
              }
            `}
          >
            {display}
          </span>
          {/* Shadow text for depth */}
          <span
            aria-hidden="true"
            className={`
              absolute inset-0 font-mono font-extrabold text-cyan/20 blur-[2px] select-none
              ${isLaunch
                ? "text-5xl sm:text-7xl md:text-8xl"
                : "text-7xl sm:text-9xl md:text-[10rem]"
              }
            `}
          >
            {display}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-12 text-[10px] font-mono tracking-[0.3em] text-void-dim uppercase"
      >
        {isLaunch ? "Initiating Void Protocol..." : "Preparing mission..."}
      </motion.p>
    </motion.div>
  );
}

// ── Main Lobby Screen ──────────────────────────────────

export function LobbyScreen() {
  const { gameState, playerId, error, resetToHome, countdown } =
    useGameStore();
  const { sendMessage, disconnect } = usePartySocket();

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const canStart = gameState.players.length >= MIN_PLAYERS;

  const handleStart = useCallback(() => {
    sendMessage({ type: MessageType.START_GAME });
  }, [sendMessage]);

  const handleLeave = useCallback(() => {
    sendMessage({ type: MessageType.LEAVE });
    disconnect();
    resetToHome();
  }, [sendMessage, disconnect, resetToHome]);

  const handleToggleReady = useCallback(() => {
    sendMessage({ type: MessageType.TOGGLE_READY });
  }, [sendMessage]);

  const handleCategoryChange = useCallback(
    (category: ChallengeCategory) => {
      const settings: LobbySettings = {
        ...gameState.settings,
        category,
      };
      sendMessage({ type: MessageType.CHANGE_SETTINGS, settings });
    },
    [sendMessage, gameState.settings]
  );

  const handleDifficultyChange = useCallback(
    (difficulty: ChallengeDifficulty) => {
      const settings: LobbySettings = {
        ...gameState.settings,
        difficulty,
      };
      sendMessage({ type: MessageType.CHANGE_SETTINGS, settings });
    },
    [sendMessage, gameState.settings]
  );

  // Stagger container
  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <>
      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && <CountdownOverlay count={countdown} />}
      </AnimatePresence>

      <motion.div
        className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10 relative overflow-hidden"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {/* Background grid */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Nebula glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.025]"
            style={{
              background:
                "radial-gradient(circle, #00f0ff 0%, transparent 70%)",
              top: "20%",
              right: "-10%",
            }}
          />
        </div>

        {/* ── Top bar ──────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="w-full max-w-2xl flex justify-between items-center mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLeave}
            className="px-3 py-1.5 border border-void-border rounded bg-void-surface/60 text-[10px] font-mono tracking-wider text-void-muted hover:text-red hover:border-red/30 transition-all duration-200"
          >
            [{isHost ? "ABANDON" : "UNDOCK"}]
          </motion.button>
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-void-success"
              style={{ animation: "blink 2s ease-in-out infinite" }}
            />
            <span className="text-[9px] font-mono tracking-[0.2em] text-void-dim uppercase">
              Lobby Active
            </span>
          </div>
        </motion.div>

        {/* ── Main content ─────────────────────── */}
        <div className="relative z-10 w-full max-w-2xl">
          {/* Room code */}
          <motion.div variants={fadeUp} className="mb-8">
            <DockingCode code={gameState.roomCode} />
          </motion.div>

          {/* Crew count bar */}
          <motion.div variants={fadeUp} className="mb-6">
            <CrewCounter
              current={gameState.players.length}
              max={MAX_PLAYERS}
            />
          </motion.div>

          {/* Two-column layout on wider screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left column — Players */}
            <motion.div variants={fadeUp}>
              <div className="border border-void-border rounded bg-void-surface/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase">
                    Crew Manifest
                  </p>
                  <p className="text-[9px] font-mono text-void-dim">
                    {gameState.players.filter((p) => p.isReady).length}/
                    {gameState.players.length} ready
                  </p>
                </div>

                {/* Player list */}
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {gameState.players.map((player) => (
                      <CrewBadge
                        key={player.id}
                        player={player}
                        isSelf={player.id === playerId}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty slots */}
                {gameState.players.length < MAX_PLAYERS && (
                  <div className="mt-2 space-y-2">
                    {Array.from({
                      length: MAX_PLAYERS - gameState.players.length,
                    }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex items-center gap-3 px-4 py-3 border border-dashed border-void-border/40 rounded"
                      >
                        <div className="w-10 h-10 rounded-full border border-dashed border-void-dim/30 flex items-center justify-center">
                          <span className="text-void-dim/40 text-sm font-mono">
                            ?
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-void-dim/40 tracking-wider">
                          AWAITING CREW...
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ready toggle */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleReady}
                  className={`
                    w-full mt-4 py-2.5 rounded border font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300
                    ${currentPlayer?.isReady
                      ? "border-void-success/40 bg-void-success/10 text-void-success hover:bg-void-success/20"
                      : "border-void-border bg-void-surface/60 text-void-muted hover:border-void-dim hover:text-void-text"
                    }
                  `}
                >
                  {currentPlayer?.isReady
                    ? "READY — CLICK TO UNREADY"
                    : "MARK READY"}
                </motion.button>
              </div>
            </motion.div>

            {/* Right column — Settings + Actions */}
            <motion.div variants={fadeUp} className="space-y-4">
              {/* Mission briefing (category) */}
              <div className="border border-void-border rounded bg-void-surface/30 p-4">
                <CategorySelector
                  selected={gameState.settings.category}
                  onChange={handleCategoryChange}
                  disabled={!isHost}
                />
                {!isHost && (
                  <p className="text-[8px] font-mono text-void-dim mt-2 text-center">
                    Host selects mission parameters
                  </p>
                )}
              </div>

              {/* Difficulty */}
              <div className="border border-void-border rounded bg-void-surface/30 p-4">
                <DifficultySelector
                  selected={gameState.settings.difficulty}
                  onChange={handleDifficultyChange}
                  disabled={!isHost}
                />
              </div>

              {/* How it works */}
              <div className="border border-void-border rounded bg-void-surface/30 p-4">
                <p className="text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase mb-2">
                  Intel
                </p>
                <p className="text-[10px] font-mono text-void-dim leading-relaxed">
                  One crew member is secretly assigned{" "}
                  <span className="text-red">Saboteur</span>. The{" "}
                  <span className="text-cyan">Crew</span> must fix the
                  code and vote out the impostor. The Saboteur must subtly
                  introduce bugs without getting caught.
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="px-3 py-2 border border-red/20 rounded bg-red/5 text-red text-[10px] font-mono tracking-wide"
                  >
                    [ERROR] {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Launch button (host) or waiting message */}
              {isHost ? (
                <motion.button
                  whileHover={canStart ? { scale: 1.02 } : {}}
                  whileTap={canStart ? { scale: 0.98 } : {}}
                  onClick={handleStart}
                  disabled={!canStart}
                  className={`
                    relative w-full py-4 rounded border font-mono font-bold text-sm tracking-[0.15em] uppercase
                    transition-all duration-300
                    ${canStart
                      ? "border-cyan/40 bg-cyan/5 text-cyan hover:bg-cyan/10 hover:border-cyan/70"
                      : "border-void-border bg-void-surface/40 text-void-dim cursor-not-allowed"
                    }
                  `}
                  style={{
                    animation: canStart
                      ? "pulse-glow 3s ease-in-out infinite"
                      : undefined,
                  }}
                >
                  {canStart && (
                    <div
                      className="absolute inset-x-0 top-0 h-px"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, #00f0ff60, transparent)",
                      }}
                    />
                  )}
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="opacity-70"
                    >
                      <path
                        d="M8 1L14 5V11L8 15L2 11V5L8 1Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle cx="8" cy="8" r="2" fill="currentColor" />
                    </svg>
                    {canStart
                      ? "LAUNCH MISSION"
                      : `NEED ${MIN_PLAYERS - gameState.players.length} MORE CREW`}
                  </span>
                </motion.button>
              ) : (
                <div className="py-4 border border-void-border rounded bg-void-surface/20 text-center">
                  <p className="text-[10px] font-mono tracking-wider text-void-dim uppercase">
                    Awaiting Commander's order...
                  </p>
                  <motion.div
                    className="flex justify-center gap-1 mt-2"
                    initial="hidden"
                    animate="show"
                    variants={{
                      show: {
                        transition: {
                          staggerChildren: 0.2,
                          repeat: Infinity,
                        },
                      },
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full bg-void-dim"
                        variants={{
                          hidden: { opacity: 0.3 },
                          show: { opacity: 1 },
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── Bottom info ──────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="mt-8 text-[9px] font-mono tracking-[0.2em] text-void-dim text-center"
        >
          VOID PROTOCOL v0.1.0
          <span className="mx-2 text-void-border">|</span>
          Share the code to invite crew
        </motion.div>
      </motion.div>
    </>
  );
}
