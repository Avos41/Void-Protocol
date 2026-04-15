import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { Role, ROLE_REVEAL_SECONDS } from "../../types/game";

export function RoleRevealScreen() {
  const myRole = useGameStore((s) => s.myRole);
  const timeRemaining = useGameStore((s) => s.gameState.timeRemaining);
  const [stage, setStage] = useState<"sealed" | "opening" | "revealed">("sealed");

  const isSaboteur = myRole === Role.Saboteur;

  useEffect(() => {
    // Dossier animation sequence
    const openTimer = setTimeout(() => setStage("opening"), 400);
    const revealTimer = setTimeout(() => setStage("revealed"), 1200);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  return (
    <div
      className={`
        min-h-screen flex flex-col items-center justify-center relative overflow-hidden
        ${isSaboteur ? "bg-[#0a0008]" : "bg-[#000a0f]"}
      `}
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              isSaboteur ? "bg-saboteur/40" : "bg-crew/40"
            }`}
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + (i % 3),
              delay: i * 0.15,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Radial glow behind the dossier */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: stage === "revealed" ? 1 : 0,
        }}
        transition={{ duration: 0.8 }}
      >
        <div
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[600px] h-[600px] rounded-full blur-[120px]
            ${isSaboteur ? "bg-saboteur/20" : "bg-crew/20"}
          `}
        />
      </motion.div>

      {/* Classified header */}
      <AnimatePresence>
        {stage !== "sealed" && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-void-muted/30" />
              <span className="text-[10px] tracking-[0.3em] text-void-muted/60 uppercase">
                Classified Briefing
              </span>
              <div className="h-px w-12 bg-void-muted/30" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dossier card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-6"
        initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
        animate={{
          scale: stage === "sealed" ? 0.8 : 1,
          opacity: stage === "sealed" ? 0.3 : 1,
          rotateX: stage === "sealed" ? 20 : 0,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          className={`
            relative rounded-2xl border-2 overflow-hidden
            ${isSaboteur
              ? "border-saboteur/40 bg-saboteur/5"
              : "border-crew/40 bg-crew/5"
            }
          `}
          style={{
            boxShadow: isSaboteur
              ? "0 0 60px rgba(255, 45, 85, 0.15), inset 0 0 60px rgba(255, 45, 85, 0.05)"
              : "0 0 60px rgba(0, 240, 255, 0.15), inset 0 0 60px rgba(0, 240, 255, 0.05)",
          }}
        >
          {/* Dossier top bar */}
          <div
            className={`
              px-6 py-3 border-b text-center
              ${isSaboteur
                ? "border-saboteur/20 bg-saboteur/10"
                : "border-crew/20 bg-crew/10"
              }
            `}
          >
            <span className="text-[10px] tracking-[0.4em] text-void-muted/80 uppercase">
              Void Protocol // Personnel File
            </span>
          </div>

          {/* Main content */}
          <div className="px-8 py-10 text-center">
            {/* Role icon */}
            <AnimatePresence mode="wait">
              {stage === "revealed" && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="mb-6"
                >
                  <div
                    className={`
                      inline-flex items-center justify-center w-20 h-20 rounded-full
                      text-4xl
                      ${isSaboteur
                        ? "bg-saboteur/15 ring-2 ring-saboteur/40"
                        : "bg-crew/15 ring-2 ring-crew/40"
                      }
                    `}
                  >
                    {isSaboteur ? "💀" : "🛡️"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role title */}
            <AnimatePresence mode="wait">
              {stage === "revealed" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h1
                    className={`
                      text-3xl font-black tracking-tight mb-2
                      ${isSaboteur ? "text-saboteur role-glow-red" : "text-crew role-glow-cyan"}
                    `}
                  >
                    {isSaboteur ? "YOU ARE THE SABOTEUR" : "YOU ARE CREW"}
                  </h1>

                  {/* Decorative line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className={`
                      h-px mx-auto mb-6 w-48
                      ${isSaboteur ? "bg-saboteur/40" : "bg-crew/40"}
                    `}
                  />

                  {/* Mission briefing */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className={`
                      p-4 rounded-lg border text-sm leading-relaxed
                      ${isSaboteur
                        ? "border-saboteur/20 bg-saboteur/5 text-saboteur/90"
                        : "border-crew/20 bg-crew/5 text-crew/90"
                      }
                    `}
                  >
                    {isSaboteur ? (
                      <>
                        <p className="font-bold mb-1">Mission Briefing:</p>
                        <p>Sabotage the code. Break test cases. Don't get caught.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold mb-1">Mission Briefing:</p>
                        <p>Fix the broken code. Pass all test cases. Find the Saboteur.</p>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sealed state placeholder */}
            {stage === "sealed" && (
              <div className="py-16">
                <div className="text-4xl mb-4 animate-pulse">📁</div>
                <p className="text-void-muted/50 text-sm tracking-wider">
                  DECRYPTING...
                </p>
              </div>
            )}

            {/* Opening state */}
            {stage === "opening" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: "linear" }}
                  className="text-4xl mb-4 inline-block"
                >
                  ⏳
                </motion.div>
                <p className="text-void-muted/70 text-sm tracking-wider">
                  CLEARANCE VERIFIED
                </p>
              </motion.div>
            )}
          </div>

          {/* Bottom stamp */}
          <AnimatePresence>
            {stage === "revealed" && (
              <motion.div
                initial={{ opacity: 0, scale: 1.5, rotate: -12 }}
                animate={{ opacity: 0.15, scale: 1, rotate: -12 }}
                transition={{ delay: 1, duration: 0.3 }}
                className={`
                  absolute bottom-6 right-6 text-5xl font-black uppercase
                  pointer-events-none select-none
                  ${isSaboteur ? "text-saboteur" : "text-crew"}
                `}
              >
                {isSaboteur ? "HOSTILE" : "CLEARED"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Timer countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === "revealed" ? 1 : 0 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 mt-8 text-center"
      >
        <p className="text-void-muted/50 text-xs tracking-wider">
          Mission starts in
        </p>
        <p className="text-2xl font-bold text-void-text mt-1 tabular-nums">
          {Math.max(0, timeRemaining)}s
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {Array.from({ length: ROLE_REVEAL_SECONDS }).map((_, i) => (
            <div
              key={i}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${i < (ROLE_REVEAL_SECONDS - timeRemaining)
                  ? isSaboteur ? "bg-saboteur" : "bg-crew"
                  : "bg-void-muted/20"
                }
              `}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
