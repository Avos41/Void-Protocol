import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";

export function EjectionAnimation() {
  const { voteResult, revealedVotes, gameState } = useGameStore();
  const [phase, setPhase] = useState<"votes" | "ejection" | "result">("votes");

  const ejectedPlayer = voteResult?.wasEjected
    ? gameState.players.find((p) => p.id === voteResult.playerId)
    : null;

  // Phase timing: votes (2s) → ejection (2.5s) → result (1.5s)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ejection"), 2000);
    const t2 = setTimeout(() => setPhase("result"), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Map votes: voterId → targetId, find player names
  const voteLines = useMemo(() => {
    const lines: { voterName: string; voterAvatar: string; targetName: string; isSkip: boolean }[] = [];
    for (const [voterId, targetId] of Object.entries(revealedVotes)) {
      const voter = gameState.players.find((p) => p.id === voterId);
      const target = gameState.players.find((p) => p.id === targetId);
      lines.push({
        voterName: voter?.name ?? "???",
        voterAvatar: voter?.avatar ?? "👤",
        targetName: targetId === "__SKIP__" ? "SKIP" : target?.name ?? "???",
        isSkip: targetId === "__SKIP__",
      });
    }
    return lines;
  }, [revealedVotes, gameState.players]);

  return (
    <div className="fixed inset-0 z-50 bg-void-bg/90 flex items-center justify-center overflow-hidden">
      {/* Star field is provided by global canvas StarField in App.tsx */}

      <AnimatePresence mode="wait">
        {/* Phase 1: Vote reveal — who voted for whom */}
        {phase === "votes" && (
          <motion.div
            key="votes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center w-full max-w-md px-6"
          >
            <h2 className="text-lg font-bold text-void-muted uppercase tracking-widest mb-4">
              Votes Revealed
            </h2>
            <div className="space-y-2">
              {voteLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center justify-center gap-3 text-sm"
                >
                  <span className="text-void-text font-medium w-24 text-right truncate">
                    {line.voterAvatar} {line.voterName}
                  </span>
                  <span className="text-void-muted">→</span>
                  <span
                    className={`font-bold w-24 text-left truncate ${
                      line.isSkip ? "text-void-warning" : "text-void-danger"
                    }`}
                  >
                    {line.targetName}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Phase 2: Ejection animation */}
        {phase === "ejection" && (
          <motion.div
            key="ejection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            {ejectedPlayer ? (
              <>
                {/* Player card floating away */}
                <motion.div
                  initial={{ y: 0, scale: 1, rotate: 0 }}
                  animate={{
                    y: -600,
                    scale: 0.3,
                    rotate: [0, -10, 15, -5, 20],
                    opacity: [1, 1, 0.8, 0.5, 0],
                  }}
                  transition={{ duration: 2.5, ease: "easeIn" }}
                  className="flex flex-col items-center"
                >
                  <div className="w-24 h-24 rounded-full border-2 border-void-danger/60 bg-void-surface flex items-center justify-center text-5xl mb-3 shadow-[0_0_40px_rgba(255,45,85,0.3)]">
                    {ejectedPlayer.avatar}
                  </div>
                  <span className="text-lg font-bold text-void-danger">
                    {ejectedPlayer.name}
                  </span>
                </motion.div>

                {/* "EJECTED INTO THE VOID" text */}
                <motion.h1
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", damping: 10 }}
                  className="text-3xl sm:text-4xl font-black tracking-tight text-void-danger mt-8"
                  style={{
                    textShadow:
                      "0 0 20px rgba(255,45,85,0.6), 0 0 60px rgba(255,45,85,0.3)",
                  }}
                >
                  EJECTED INTO THE VOID
                </motion.h1>
              </>
            ) : (
              <>
                {/* No one ejected */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🤷
                  </motion.div>
                  <h1
                    className="text-3xl font-black text-void-muted"
                    style={{
                      textShadow: "0 0 20px rgba(74,74,122,0.4)",
                    }}
                  >
                    NO ONE WAS EJECTED
                  </h1>
                  <p className="text-void-dim text-sm mt-2">
                    The crew couldn't reach a consensus...
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {/* Phase 3: Role reveal */}
        {phase === "result" && ejectedPlayer && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="text-5xl mb-4">
              {voteResult?.wasSaboteur ? "💀" : "🛡️"}
            </div>
            <h2 className="text-xl font-bold mb-1">
              <span className="text-void-text">{ejectedPlayer.name}</span>
              {" was "}
              {voteResult?.wasSaboteur ? (
                <span className="text-saboteur font-black">THE SABOTEUR</span>
              ) : (
                <span className="text-crew font-black">NOT the Saboteur</span>
              )}
            </h2>
            <p className="text-sm text-void-muted mt-2">
              {voteResult?.wasSaboteur
                ? "Good work, agents."
                : "An innocent crew member has been lost..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
