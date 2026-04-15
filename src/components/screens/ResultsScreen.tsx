import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { usePartySocket } from "../../hooks/usePartySocket";
import { Role, MessageType } from "../../types/game";
import type {
  Player,
  EditHistory,
  RoundVoteRecord,
  WinReason,
} from "../../types/game";
import { GlassCard } from "../ui/GlassCard";
import { VoidButton } from "../ui/VoidButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { soundManager } from "../../utils/SoundManager";

type ResultPhase = "blackout" | "title" | "roles" | "stats" | "actions";

const WIN_REASON_TEXT: Record<WinReason, string> = {
  saboteur_ejected: "All saboteurs were ejected from the station",
  tests_passed: "All test cases passed \u2014 mission complete",
  timer_expired: "Time ran out \u2014 the code remains broken",
  crew_eliminated: "The saboteur eliminated enough crew members",
};

// ── Particle configs (generated once) ─────────────────

function generateParticles(count: number) {
  const particles: {
    angle: number;
    distance: number;
    size: number;
    delay: number;
    color: string;
  }[] = [];
  const colors = ["#00f0ff", "#60fdff", "#ffffff", "#00a0b0", "#80f8ff"];
  for (let i = 0; i < count; i++) {
    particles.push({
      angle: (i / count) * 360 + (Math.random() - 0.5) * 30,
      distance: 150 + Math.random() * 300,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.8,
      color: colors[i % colors.length],
    });
  }
  return particles;
}

const VICTORY_PARTICLES = generateParticles(50);

// ── Sub-components ────────────────────────────────────

function VictoryParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {VICTORY_PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: "40%",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
              x: tx,
              y: ty,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

function DefeatOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* Red alarm flash */}
      <div className="absolute inset-0 bg-red/20 results-alarm-overlay" />
      {/* Initial shake */}
      <motion.div
        className="absolute inset-0"
        initial={{ x: 0 }}
        animate={{ x: [0, -3, 4, -2, 3, -1, 2, 0] }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
    </div>
  );
}

function RoleRevealCard({
  player,
  role,
  index,
  isMVP,
}: {
  player: Player;
  role: Role;
  index: number;
  isMVP: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFlipped(true), index * 400);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div
      className="relative"
      style={{ perspective: 800 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Front face (revealed) */}
        <div style={{ backfaceVisibility: "hidden" }}>
          <PlayerAvatar player={player} role={role} showRole size="md" />
          {isMVP && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-2 -left-1 text-base"
              title="MVP"
            >
              <span className="drop-shadow-[0_0_6px_rgba(255,200,0,0.6)]">
                MVP
              </span>
            </motion.div>
          )}
        </div>
        {/* Back face (hidden) */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className="absolute inset-0 flex flex-col items-center gap-1.5"
        >
          <div className="w-14 h-14 rounded-full bg-void-surface border-2 border-void-border flex items-center justify-center text-2xl text-void-muted">
            ?
          </div>
          <span className="text-xs font-mono text-void-muted">???</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatsPanel({
  editHistory,
  players,
  roles,
  roundNumber,
  voteHistory,
}: {
  editHistory: EditHistory;
  players: Player[];
  roles: Record<string, Role>;
  roundNumber: number;
  voteHistory: RoundVoteRecord[];
}) {
  // Compute per-player edit counts
  const playerStats = useMemo(() => {
    const edits: Record<string, number> = {};
    for (const edit of Object.values(editHistory)) {
      edits[edit.playerId] = (edits[edit.playerId] ?? 0) + edit.editCount;
    }
    const maxEdits = Math.max(1, ...Object.values(edits));
    return players.map((p) => ({
      player: p,
      edits: edits[p.id] ?? 0,
      pct: ((edits[p.id] ?? 0) / maxEdits) * 100,
      role: roles[p.id],
    }));
  }, [editHistory, players, roles]);

  return (
    <GlassCard>
      <h3 className="text-sm font-bold uppercase tracking-wider text-void-muted mb-4 text-center">
        Mission Debrief
      </h3>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-xl bg-void-bg/50 border border-void-border/50">
          <p className="text-2xl font-black text-void-accent">{roundNumber}</p>
          <p className="text-[10px] uppercase tracking-wider text-void-muted">
            Rounds
          </p>
        </div>
        <div className="text-center p-3 rounded-xl bg-void-bg/50 border border-void-border/50">
          <p className="text-2xl font-black text-void-accent">
            {players.filter((p) => p.isAlive).length}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-void-muted">
            Survivors
          </p>
        </div>
        <div className="text-center p-3 rounded-xl bg-void-bg/50 border border-void-border/50">
          <p className="text-2xl font-black text-void-accent">
            {Object.values(editHistory).reduce(
              (sum, e) => sum + e.editCount,
              0
            )}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-void-muted">
            Total Edits
          </p>
        </div>
      </div>

      {/* Per-player edit bars */}
      <h4 className="text-xs font-bold uppercase tracking-wider text-void-muted mb-3">
        Edit Activity
      </h4>
      <div className="space-y-2 mb-6">
        {playerStats.map(({ player, edits, pct, role }) => (
          <div key={player.id} className="flex items-center gap-2">
            <span className="text-sm w-6 flex-shrink-0">{player.avatar}</span>
            <span className="text-xs font-mono text-void-text truncate w-20 flex-shrink-0">
              {player.name}
            </span>
            <div className="flex-1 h-3 rounded-full bg-void-bg/80 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full rounded-full ${
                  role === Role.Saboteur ? "bg-saboteur/70" : "bg-crew/70"
                }`}
              />
            </div>
            <span className="text-xs font-mono text-void-muted w-8 text-right flex-shrink-0">
              {edits}
            </span>
            {role === Role.Saboteur && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-saboteur/15 text-saboteur font-bold flex-shrink-0">
                SUS
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Voting history */}
      {voteHistory.length > 0 && (
        <>
          <h4 className="text-xs font-bold uppercase tracking-wider text-void-muted mb-3">
            Voting History
          </h4>
          <div className="space-y-3">
            {voteHistory.map((round) => (
              <div
                key={round.round}
                className="p-3 rounded-lg bg-void-bg/50 border border-void-border/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-void-muted">
                    Round {round.round}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      round.result.wasEjected
                        ? round.result.wasSaboteur
                          ? "bg-void-success/15 text-void-success"
                          : "bg-red/15 text-red"
                        : "bg-void-muted/15 text-void-muted"
                    }`}
                  >
                    {round.result.wasEjected
                      ? `${round.result.playerName} ejected`
                      : "No ejection"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(round.votes).map(([voterId, targetId]) => {
                    const voter = players.find((p) => p.id === voterId);
                    const target = players.find((p) => p.id === targetId);
                    return (
                      <span
                        key={voterId}
                        className="text-[11px] text-void-text/60"
                      >
                        {voter?.name ?? "?"}{" "}
                        <span className="text-void-muted">&rarr;</span>{" "}
                        <span
                          className={
                            targetId === "__SKIP__"
                              ? "text-void-warning"
                              : "text-void-text/80"
                          }
                        >
                          {targetId === "__SKIP__"
                            ? "SKIP"
                            : target?.name ?? "?"}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {voteHistory.length === 0 && (
        <p className="text-xs text-void-muted text-center py-2">
          No meetings were called during this mission.
        </p>
      )}
    </GlassCard>
  );
}

function CodeDiffView({
  originalCode,
  finalCode,
  editHistory,
  roles,
}: {
  originalCode: string;
  finalCode: string;
  editHistory: EditHistory;
  roles: Record<string, Role>;
}) {
  const originalLines = originalCode.split("\n");
  const finalLines = finalCode.split("\n");

  return (
    <div className="rounded-lg border border-void-border/30 overflow-hidden bg-void-bg/50 max-h-72 overflow-y-auto font-mono text-[11px]">
      {finalLines.map((line, i) => {
        const lineNum = i + 1;
        const original = originalLines[i] ?? "";
        const changed = line !== original;
        const edit = editHistory[lineNum];
        const isSaboteurEdit = edit && roles[edit.playerId] === Role.Saboteur;

        return (
          <div
            key={lineNum}
            className={`flex items-center border-b border-void-border/10 last:border-b-0 ${
              isSaboteurEdit
                ? "bg-saboteur/8"
                : changed
                  ? "bg-crew/5"
                  : ""
            }`}
          >
            <span className="w-7 text-right pr-1.5 text-void-muted/40 select-none flex-shrink-0 text-[10px]">
              {lineNum}
            </span>
            <div
              className={`w-1 self-stretch flex-shrink-0 ${
                isSaboteurEdit
                  ? "bg-saboteur"
                  : changed
                    ? "bg-crew/50"
                    : "bg-transparent"
              }`}
            />
            <span className="flex-1 px-2 py-0.5 text-void-text/70 truncate whitespace-pre">
              {line || " "}
            </span>
            {isSaboteurEdit && (
              <span className="text-[8px] px-1.5 py-0.5 rounded text-saboteur bg-saboteur/15 font-bold flex-shrink-0 mr-1">
                SABOTAGED
              </span>
            )}
            {changed && !isSaboteurEdit && edit && (
              <span className="text-[8px] px-1.5 py-0.5 rounded text-crew/60 bg-crew/10 flex-shrink-0 mr-1">
                {edit.playerName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────

export function ResultsScreen() {
  const { gameState, myRole, editHistory, winReason, voteHistory, resetToHome } =
    useGameStore();
  const { sendMessage, disconnect } = usePartySocket();
  const [phase, setPhase] = useState<ResultPhase>("blackout");

  const crewWon = gameState.winner === "crew";
  const iWon =
    (crewWon && myRole === Role.Crew) ||
    (!crewWon && myRole === Role.Saboteur);

  // Phase progression
  useEffect(() => {
    const playerCount = gameState.players.length;
    const rolesRevealEnd = 3000 + playerCount * 400 + 500;
    const timers = [
      setTimeout(() => setPhase("title"), 800),
      setTimeout(() => setPhase("roles"), 3000),
      setTimeout(() => setPhase("stats"), rolesRevealEnd),
      setTimeout(() => setPhase("actions"), rolesRevealEnd + 1500),
      // Play win/loss sound when title appears
      setTimeout(() => {
        soundManager.play(iWon ? "win" : "loss");
      }, 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [gameState.players.length, iWon]);

  // MVP: most edits on the winning side
  const mvpPlayer = useMemo(() => {
    const playerEdits: Record<string, number> = {};
    for (const edit of Object.values(editHistory)) {
      playerEdits[edit.playerId] =
        (playerEdits[edit.playerId] ?? 0) + edit.editCount;
    }

    let mvpId: string | null = null;
    let maxEdits = 0;
    for (const [pid, edits] of Object.entries(playerEdits)) {
      const role = gameState.roles[pid];
      const isWinningSide =
        (crewWon && role === Role.Crew) ||
        (!crewWon && role === Role.Saboteur);
      if (isWinningSide && edits > maxEdits) {
        maxEdits = edits;
        mvpId = pid;
      }
    }
    return mvpId
      ? gameState.players.find((p) => p.id === mvpId) ?? null
      : null;
  }, [editHistory, gameState.roles, gameState.players, crewWon]);

  const handlePlayAgain = useCallback(() => {
    sendMessage({ type: MessageType.PLAY_AGAIN } as any);
  }, [sendMessage]);

  const handleLeave = useCallback(() => {
    disconnect();
    resetToHome();
  }, [disconnect, resetToHome]);

  return (
    <div
      className={`min-h-screen flex flex-col items-center relative overflow-hidden overflow-y-auto ${
        phase === "blackout" ? "bg-black" : "bg-void-bg"
      } transition-colors duration-1000`}
    >
      {/* Particle effects layer */}
      {phase !== "blackout" && crewWon && <VictoryParticles />}
      {phase !== "blackout" && !crewWon && <DefeatOverlay />}

      {/* Background radial glow */}
      <AnimatePresence>
        {phase !== "blackout" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <motion.div
              animate={{
                background: crewWon
                  ? [
                      "radial-gradient(circle at 50% 30%, rgba(0,240,255,0.08) 0%, transparent 70%)",
                      "radial-gradient(circle at 50% 30%, rgba(0,240,255,0.15) 0%, transparent 70%)",
                      "radial-gradient(circle at 50% 30%, rgba(0,240,255,0.08) 0%, transparent 70%)",
                    ]
                  : [
                      "radial-gradient(circle at 50% 30%, rgba(255,45,85,0.08) 0%, transparent 70%)",
                      "radial-gradient(circle at 50% 30%, rgba(255,45,85,0.15) 0%, transparent 70%)",
                      "radial-gradient(circle at 50% 30%, rgba(255,45,85,0.08) 0%, transparent 70%)",
                    ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-2xl px-6 py-8 space-y-8">
        {/* ── TITLE PHASE ──────────────────────────── */}
        <AnimatePresence>
          {phase !== "blackout" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
              className="text-center pt-4"
            >
              {/* Big emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="text-6xl mb-4"
              >
                {crewWon ? "\u{1f6e1}\ufe0f" : "\u{1f480}"}
              </motion.div>

              {/* Title */}
              <h1
                className={`text-4xl sm:text-5xl font-black tracking-tight mb-2 ${
                  crewWon
                    ? "text-crew role-glow-cyan"
                    : "text-saboteur role-glow-red"
                }`}
              >
                {crewWon ? "CREW VICTORY" : "SABOTEUR VICTORY"}
              </h1>

              {/* Win reason */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-void-muted text-sm mb-2"
              >
                {winReason
                  ? WIN_REASON_TEXT[winReason]
                  : crewWon
                    ? "The crew prevailed!"
                    : "The saboteur prevailed!"}
              </motion.p>

              {/* Personal outcome badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  iWon
                    ? "border-void-success/40 bg-void-success/10 text-void-success"
                    : "border-red/40 bg-red/10 text-red"
                }`}
              >
                {iWon ? "VICTORY" : "DEFEAT"}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ROLES PHASE ──────────────────────────── */}
        <AnimatePresence>
          {(phase === "roles" ||
            phase === "stats" ||
            phase === "actions") && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard glow>
                <h3 className="text-sm font-bold uppercase tracking-wider text-void-muted mb-5 text-center">
                  Identity Reveal
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 justify-items-center">
                  {gameState.players.map((player, i) => (
                    <RoleRevealCard
                      key={player.id}
                      player={player}
                      role={gameState.roles[player.id]}
                      index={i}
                      isMVP={mvpPlayer?.id === player.id}
                    />
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATS PHASE ──────────────────────────── */}
        <AnimatePresence>
          {(phase === "stats" || phase === "actions") && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <StatsPanel
                editHistory={editHistory}
                players={gameState.players}
                roles={gameState.roles}
                roundNumber={gameState.roundNumber}
                voteHistory={voteHistory}
              />

              {gameState.currentChallenge && (
                <GlassCard>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-void-muted mb-4 text-center">
                    Final Code Analysis
                  </h3>
                  <CodeDiffView
                    originalCode={gameState.currentChallenge.starterCode}
                    finalCode={gameState.code}
                    editHistory={editHistory}
                    roles={gameState.roles}
                  />
                </GlassCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTIONS PHASE ────────────────────────── */}
        <AnimatePresence>
          {phase === "actions" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-3 pb-8"
            >
              <VoidButton
                onClick={handlePlayAgain}
                className="flex-1"
                size="lg"
                icon="\u{1f504}"
                variant="primary"
              >
                PLAY AGAIN
              </VoidButton>
              <VoidButton
                onClick={handleLeave}
                className="flex-1"
                size="lg"
                icon="\u{1f6aa}"
                variant="ghost"
              >
                LEAVE STATION
              </VoidButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
