import { useState } from "react";
import { motion } from "framer-motion";
import type { SabotageTask } from "../../types/game";

interface SabotageTasksProps {
  tasks: SabotageTask[];
}

export function SabotageTasks({ tasks }: SabotageTasksProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = checked.size;
  const totalCount = tasks.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-saboteur/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">💀</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-saboteur">
            Sabotage Objectives
          </h3>
        </div>
        <p className="text-[10px] text-saboteur/50 leading-relaxed">
          Complete these without getting caught. Be subtle.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-void-border overflow-hidden">
            <motion.div
              className="h-full bg-saboteur rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] text-saboteur/60 font-bold">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {tasks.map((task, i) => {
          const isChecked = checked.has(task.id);
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => toggle(task.id)}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all duration-200
                ${isChecked
                  ? "border-saboteur/40 bg-saboteur/10"
                  : "border-void-border/30 bg-void-surface/50 hover:border-saboteur/20"
                }
              `}
            >
              <div className="flex items-start gap-2">
                {/* Checkbox */}
                <div
                  className={`
                    mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${isChecked
                      ? "border-saboteur bg-saboteur"
                      : "border-void-muted/40"
                    }
                  `}
                >
                  {isChecked && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] text-void-bg font-bold"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium leading-relaxed ${
                      isChecked ? "text-saboteur/60 line-through" : "text-void-text"
                    }`}
                  >
                    {task.description}
                  </p>
                  <p className="text-[10px] text-void-muted/50 mt-1 font-mono">
                    💡 {task.hint}
                  </p>
                  <p className="text-[10px] text-saboteur/30 mt-0.5 font-mono">
                    Target: line {task.targetLine}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Suspicion warning */}
      <div className="p-3 border-t border-saboteur/10">
        <p className="text-[9px] text-saboteur/40 text-center leading-relaxed uppercase tracking-wider">
          Remember: subtle edits only. Others can see who edited each line.
        </p>
      </div>
    </div>
  );
}
