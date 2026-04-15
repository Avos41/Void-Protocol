import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { usePartySocket } from "../../hooks/usePartySocket";

// ── Constants ──────────────────────────────────────────

const AVATARS = ["🧑‍💻", "👾", "🤖", "👻", "🦊", "💀", "🧬", "🛸", "🔮", "⚡"];




// ── Grid Overlay ───────────────────────────────────────

function GridOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// ── Glitch Text ────────────────────────────────────────

function GlitchLogo() {
  return (
    <div className="relative select-none text-center">
      {/* Main text */}
      <h1
        className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter glow-cyan"
        style={{ animation: "flicker 8s ease-in-out infinite" }}
      >
        <span className="text-cyan">VOID</span>
        <span className="text-void-text"> PROTOCOL</span>
      </h1>

      {/* Glitch layer 1 — cyan offset */}
      <h1
        aria-hidden="true"
        className="absolute inset-0 text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter text-cyan/60"
        style={{ animation: "glitch-1 6s ease-in-out infinite" }}
      >
        <span>VOID</span>
        <span className="text-cyan/60"> PROTOCOL</span>
      </h1>

      {/* Glitch layer 2 — red offset */}
      <h1
        aria-hidden="true"
        className="absolute inset-0 text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter text-red/40"
        style={{ animation: "glitch-2 6s ease-in-out 0.15s infinite" }}
      >
        <span>VOID</span>
        <span className="text-red/40"> PROTOCOL</span>
      </h1>
    </div>
  );
}

// ── System Status Indicator ────────────────────────────

function SystemStatus() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-void-border rounded bg-void-surface/60">
      <div
        className="w-2 h-2 rounded-full bg-[#22c55e]"
        style={{ animation: "blink 2s ease-in-out infinite" }}
      />
      <span className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-void-muted uppercase">
        System Status: <span className="text-[#22c55e]">Online</span>
      </span>
    </div>
  );
}

// ── Landing Page ───────────────────────────────────────

export function LandingPage() {
  const { setPlayerInfo, setRoomCode } = useGameStore();
  const { connect } = usePartySocket();

  const [name, setName] = useState("");
  const [roomCode, setLocalRoomCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🧑‍💻");
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);

  // Validate name: 2-15 chars
  const isNameValid = name.trim().length >= 2 && name.trim().length <= 15;
  // Validate room code: exactly 4 alphanumeric after stripping "VOID-"
  const cleanCode = roomCode.replace(/^VOID-/i, "").trim();
  const isCodeValid = /^[A-Z0-9]{4}$/i.test(cleanCode);

  const handleCreate = useCallback(() => {
    if (!isNameValid) {
      setError("Crew ID must be 2–15 characters.");
      return;
    }
    setError(null);
    const trimmedName = name.trim();
    setPlayerInfo(trimmedName, selectedAvatar);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const fullCode = `VOID-${code}`;
    setRoomCode(fullCode);
    connect(fullCode, trimmedName, selectedAvatar);
  }, [isNameValid, name, selectedAvatar, setPlayerInfo, setRoomCode, connect]);

  const handleJoin = useCallback(() => {
    if (!isNameValid) {
      setError("Crew ID must be 2–15 characters.");
      return;
    }
    if (!isCodeValid) {
      setError("Room code must be 4 alphanumeric characters.");
      return;
    }
    setError(null);
    const trimmedName = name.trim();
    setPlayerInfo(trimmedName, selectedAvatar);
    const fullCode = `VOID-${cleanCode.toUpperCase()}`;
    setRoomCode(fullCode);
    connect(fullCode, trimmedName, selectedAvatar);
  }, [isNameValid, isCodeValid, name, selectedAvatar, cleanCode, setPlayerInfo, setRoomCode, connect]);

  // Stagger animation config
  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden crt-vignette"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      {/* ── Background layers (StarField is global in App.tsx) ── */}
      <GridOverlay />

      {/* ── System Status — top right ─────────── */}
      <motion.div
        className="fixed top-4 right-4 z-30"
        variants={fadeUp}
      >
        <SystemStatus />
      </motion.div>

      {/* ── Hackathon Badge — top left ────────── */}
      <motion.div
        className="fixed top-4 left-4 z-30"
        variants={fadeUp}
      >
        <div
          className="px-3 py-1.5 border border-amber/30 rounded bg-amber/5 text-[10px] sm:text-xs font-mono tracking-wider text-amber"
          style={{ animation: "drift 6s ease-in-out infinite" }}
        >
          Built for ImpactHacks 2026
        </div>
      </motion.div>

      {/* ── Main Content ──────────────────────── */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">

        {/* Logo */}
        <motion.div variants={fadeUp} className="mb-4">
          <GlitchLogo />
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          className="text-xs sm:text-sm md:text-base text-void-muted font-mono tracking-wide text-center max-w-md mb-8 leading-relaxed"
        >
          One crew member is corrupting the code.
          <br />
          <span className="text-red">Find them</span> before the system{" "}
          <span className="text-red" style={{ animation: "flicker 3s ease-in-out infinite" }}>
            crashes.
          </span>
        </motion.p>

        {/* Decorative line */}
        <motion.div
          variants={fadeUp}
          className="w-full max-w-xs h-px mb-8"
          style={{
            background: "linear-gradient(90deg, transparent, #00f0ff40, transparent)",
          }}
        />

        {/* ── CREW ID Input ───────────────────── */}
        <motion.div variants={fadeUp} className="w-full max-w-sm mb-3">
          <label className="block text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase mb-1.5 ml-1">
            Crew ID
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-dim text-sm font-mono">
              {">_"}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Enter your codename..."
              maxLength={15}
              autoFocus
              className="w-full bg-void-bg/90 border border-void-border rounded px-4 py-3 pl-10 text-sm font-mono text-cyan placeholder:text-void-dim focus:border-cyan/50 focus:outline-none focus:shadow-[0_0_15px_#00f0ff15] transition-all duration-300"
            />
            {isNameValid && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22c55e] text-xs"
              >
                [OK]
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* ── Avatar Picker ───────────────────── */}
        <motion.div variants={fadeUp} className="w-full max-w-sm mb-6">
          <label className="block text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase mb-1.5 ml-1">
            Avatar
          </label>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {AVATARS.map((avatar) => (
              <motion.button
                key={avatar}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedAvatar(avatar)}
                className={`w-10 h-10 flex items-center justify-center text-lg rounded border transition-all duration-200 ${
                  selectedAvatar === avatar
                    ? "border-cyan bg-cyan/10 shadow-[0_0_12px_#00f0ff30]"
                    : "border-void-border bg-void-surface/50 hover:border-void-dim"
                }`}
              >
                {avatar}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Action Buttons ──────────────────── */}
        <motion.div variants={fadeUp} className="w-full max-w-sm flex flex-col gap-3">

          {/* CREATE MISSION */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={!isNameValid}
            className="relative w-full py-4 rounded border border-cyan/40 bg-cyan/5 text-cyan font-mono font-bold text-sm tracking-[0.15em] uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:bg-cyan/10 hover:border-cyan/70"
            style={{
              animation: isNameValid ? "pulse-glow 3s ease-in-out infinite" : undefined,
            }}
          >
            {/* Top highlight line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #00f0ff60, transparent)" }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
                <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" fill="currentColor" />
              </svg>
              CREATE MISSION
            </span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-void-border" />
            <span className="text-[10px] font-mono tracking-wider text-void-dim">OR</span>
            <div className="flex-1 h-px bg-void-border" />
          </div>

          {/* JOIN MISSION Section */}
          <AnimatePresence mode="wait">
            {!showJoin ? (
              <motion.button
                key="join-toggle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowJoin(true)}
                className="w-full py-3 rounded border border-void-border bg-void-surface/40 text-void-muted font-mono text-sm tracking-[0.1em] uppercase hover:border-void-dim hover:text-void-text transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-50">
                    <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  JOIN MISSION
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="join-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border border-void-border rounded bg-void-surface/30 p-4">
                  <label className="block text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase mb-1.5">
                    Mission Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber/60 text-xs font-mono">
                        VOID-
                      </span>
                      <input
                        type="text"
                        value={cleanCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
                          setLocalRoomCode(val);
                          setError(null);
                        }}
                        placeholder="XXXX"
                        maxLength={4}
                        className="w-full bg-void-bg/90 border border-void-border rounded px-4 py-2.5 pl-16 text-sm font-mono text-amber tracking-[0.25em] uppercase placeholder:text-void-dim/50 focus:border-amber/40 focus:outline-none focus:shadow-[0_0_15px_#ff950015] transition-all duration-300"
                      />
                      {isCodeValid && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22c55e] text-xs font-mono"
                        >
                          [OK]
                        </motion.span>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleJoin}
                      disabled={!isNameValid || !isCodeValid}
                      className="px-5 py-2.5 rounded border border-amber/30 bg-amber/5 text-amber font-mono font-bold text-xs tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber/10 hover:border-amber/60 transition-all duration-300"
                    >
                      DOCK
                    </motion.button>
                  </div>
                  <button
                    onClick={() => {
                      setShowJoin(false);
                      setError(null);
                    }}
                    className="mt-2 text-[10px] font-mono text-void-dim hover:text-void-muted transition-colors"
                  >
                    [cancel]
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Error Display ───────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3 px-4 py-2 border border-red/20 rounded bg-red/5 text-red text-xs font-mono tracking-wide"
            >
              [ERROR] {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Decorative Terminal Readout ──────── */}
        <motion.div
          variants={fadeUp}
          className="mt-10 text-[9px] sm:text-[10px] font-mono tracking-[0.2em] text-void-dim text-center leading-loose"
        >
          <span className="text-void-muted">3–5 CREW MEMBERS</span>
          <span className="mx-2 text-void-border">|</span>
          <span className="text-void-muted">REAL-TIME COLLABORATIVE CODING</span>
          <span className="mx-2 text-void-border">|</span>
          <span className="text-red/60">FIND THE SABOTEUR</span>
        </motion.div>

        {/* ── Protocol Version ────────────────── */}
        <motion.div
          variants={fadeUp}
          className="mt-4 flex items-center gap-2"
        >
          <div className="h-px w-8 bg-void-border" />
          <span className="text-[9px] font-mono tracking-[0.3em] text-void-dim">
            PROTOCOL v0.1.0
          </span>
          <div className="h-px w-8 bg-void-border" />
        </motion.div>
      </div>
    </motion.div>
  );
}
