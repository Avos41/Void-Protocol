import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Transition } from "framer-motion";
import { GamePhase } from "../../types/game";

export type TransitionType =
  | "default"
  | "warpLaunch"
  | "redAlert"
  | "dramaticReveal";

/**
 * Determine which transition to use based on prev → current phase change.
 */
export function getTransitionType(
  prevPhase: GamePhase | null,
  currentPhase: GamePhase
): TransitionType {
  // Lobby → RoleReveal/Playing: warp launch
  if (
    prevPhase === GamePhase.Lobby &&
    (currentPhase === GamePhase.RoleReveal || currentPhase === GamePhase.Playing)
  ) {
    return "warpLaunch";
  }
  // Playing → Meeting: red alert
  if (
    prevPhase === GamePhase.Playing &&
    (currentPhase === GamePhase.Meeting || currentPhase === GamePhase.Voting)
  ) {
    return "redAlert";
  }
  // Ejection → Results or Meeting → Results: dramatic reveal
  if (
    (prevPhase === GamePhase.Ejection || prevPhase === GamePhase.Voting) &&
    currentPhase === GamePhase.Results
  ) {
    return "dramaticReveal";
  }
  return "default";
}

// ── Transition Variant Configs ─────────────────────────

interface TransitionConfig {
  initial: any;
  animate: any;
  exit: any;
  transition: Transition;
}

const defaultVariant: TransitionConfig = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35, ease: "easeInOut" },
};

const warpLaunchVariant: TransitionConfig = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 2.5, filter: "blur(12px)" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const redAlertVariant: TransitionConfig = {
  initial: {
    opacity: 0,
    x: 0,
    backgroundColor: "rgba(255, 45, 85, 0.15)",
  },
  animate: {
    opacity: 1,
    x: [0, -4, 6, -3, 5, -2, 0],
    backgroundColor: "rgba(255, 45, 85, 0)",
  },
  exit: { opacity: 0, x: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const dramaticRevealVariant: TransitionConfig = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.1 },
  transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
};

const variants: Record<TransitionType, TransitionConfig> = {
  default: defaultVariant,
  warpLaunch: warpLaunchVariant,
  redAlert: redAlertVariant,
  dramaticReveal: dramaticRevealVariant,
};

interface ScreenTransitionProps {
  children: ReactNode;
  type?: TransitionType;
  className?: string;
}

export function ScreenTransition({
  children,
  type = "default",
  className = "",
}: ScreenTransitionProps) {
  const v = variants[type];
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={v.transition}
      className={`min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  );
}
