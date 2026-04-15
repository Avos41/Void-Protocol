import { useMemo } from "react";
import { motion } from "framer-motion";
import type { EditHistory, Player } from "../../types/game";

interface EditHeatmapProps {
  editHistory: EditHistory;
  code: string;
  players: Player[];
}

// Deterministic color per player ID
const PLAYER_COLORS = [
  "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff",
  "#ff9500", "#00f0ff", "#22c55e",
];

function getPlayerColor(playerId: string, players: Player[]): string {
  const idx = players.findIndex((p) => p.id === playerId);
  return PLAYER_COLORS[idx % PLAYER_COLORS.length] ?? "#4a4a7a";
}

export function EditHeatmap({ editHistory, code, players }: EditHeatmapProps) {
  const lines = code.split("\n");

  // Aggregate: how many lines did each player edit?
  const playerStats = useMemo(() => {
    const stats: Record<string, { name: string; lineCount: number; totalEdits: number }> = {};
    for (const edit of Object.values(editHistory)) {
      if (!stats[edit.playerId]) {
        stats[edit.playerId] = { name: edit.playerName, lineCount: 0, totalEdits: 0 };
      }
      stats[edit.playerId].lineCount++;
      stats[edit.playerId].totalEdits += edit.editCount;
    }
    return Object.entries(stats)
      .map(([id, s]) => ({ playerId: id, ...s }))
      .sort((a, b) => b.totalEdits - a.totalEdits);
  }, [editHistory]);

  const hasEdits = Object.keys(editHistory).length > 0;

  if (!hasEdits) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-void-muted/50">No edit data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Player edit summary */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-void-muted font-bold mb-2">
          Edit Activity
        </h4>
        <div className="space-y-1.5">
          {playerStats.map((stat, i) => {
            const color = getPlayerColor(stat.playerId, players);
            const maxEdits = playerStats[0]?.totalEdits ?? 1;
            const barWidth = (stat.totalEdits / maxEdits) * 100;

            return (
              <motion.div
                key={stat.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-medium w-20 truncate" style={{ color }}>
                  {stat.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-void-border/30 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                </div>
                <span className="text-[10px] text-void-muted w-12 text-right font-mono">
                  {stat.lineCount}L / {stat.totalEdits}E
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Line-by-line heatmap */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-void-muted font-bold mb-2">
          Line Attribution
        </h4>
        <div className="rounded-lg border border-void-border/30 overflow-hidden bg-void-surface/30 max-h-60 overflow-y-auto">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const edit = editHistory[lineNum];
            const color = edit ? getPlayerColor(edit.playerId, players) : undefined;

            return (
              <div
                key={lineNum}
                className="flex items-center text-[11px] font-mono border-b border-void-border/10 last:border-b-0"
              >
                {/* Line number */}
                <span className="w-8 text-right pr-2 text-void-muted/40 select-none flex-shrink-0">
                  {lineNum}
                </span>

                {/* Attribution indicator */}
                <div className="w-1 self-stretch flex-shrink-0" style={{ backgroundColor: color ?? "transparent" }} />

                {/* Code line */}
                <span className="flex-1 px-2 py-0.5 text-void-text/70 truncate whitespace-pre">
                  {line || " "}
                </span>

                {/* Editor name */}
                {edit && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-l font-bold flex-shrink-0"
                    style={{ color, backgroundColor: `${color}15` }}
                  >
                    {edit.playerName}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
