import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = "",
  glow = false,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      className={`
        relative rounded border border-void-border bg-void-surface/80
        backdrop-blur-xl p-6 overflow-hidden
        ${glow ? "shadow-[0_0_30px_#00f0ff15]" : ""}
        ${onClick ? "cursor-pointer hover:border-cyan/30 transition-colors duration-300" : ""}
        ${className}
      `}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      {children}
    </motion.div>
  );
}
