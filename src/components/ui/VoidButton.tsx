import { motion } from "framer-motion";
import { useCallback } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { soundManager } from "../../utils/SoundManager";

type ButtonVariant = "primary" | "danger" | "ghost" | "success";

interface VoidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  isLoading?: boolean;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 hover:border-cyan/60 shadow-[0_0_20px_#00f0ff15] hover:shadow-[0_0_30px_#00f0ff30,0_0_60px_#00f0ff10]",
  danger:
    "bg-red/10 hover:bg-red/20 text-red border border-red/30 hover:border-red/60 hover:shadow-[0_0_25px_rgba(255,45,85,0.2)]",
  ghost:
    "bg-void-surface hover:bg-void-surface-light text-void-text border border-void-border hover:border-void-dim hover:shadow-[0_0_15px_rgba(0,240,255,0.05)]",
  success:
    "bg-void-success/10 hover:bg-void-success/20 text-void-success border border-void-success/30 hover:border-void-success/60 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)]",
};

const sizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export function VoidButton({
  variant = "primary",
  children,
  isLoading = false,
  icon,
  size = "md",
  disabled,
  className = "",
  onClick,
  ...props
}: VoidButtonProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      soundManager.play("click");
      onClick?.(e);
    },
    [onClick]
  );

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`
        relative inline-flex items-center justify-center gap-2
        rounded font-mono font-semibold tracking-wide
        transition-all duration-300 ease-out
        disabled:opacity-30 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void-bg
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...(props as Record<string, unknown>)}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="text-lg" aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}
