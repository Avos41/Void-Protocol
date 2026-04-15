import type { InputHTMLAttributes } from "react";

interface VoidInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function VoidInput({
  label,
  error,
  className = "",
  id,
  ...props
}: VoidInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] font-mono tracking-[0.3em] text-void-muted uppercase ml-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full rounded border border-void-border bg-void-bg/90
          px-4 py-3 text-sm font-mono text-cyan
          placeholder:text-void-dim
          focus:border-cyan/40 focus:outline-none focus:shadow-[0_0_15px_#00f0ff10]
          transition-all duration-300
          ${error ? "border-red/50" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs font-mono text-red">{error}</span>
      )}
    </div>
  );
}
