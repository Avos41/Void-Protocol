import { useMemo } from "react";
import { motion } from "framer-motion";
import type { EditHistory, Player } from "../../types/game";

interface EditEvidenceProps {
  editHistory: EditHistory;
  code: string;
  players: Player[];
}

const PLAYER_COLORS = [
  "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff",
  "#ff9500", "#00f0ff", "#22c55e",
];

function getPlayerColor(playerId: string, players: Player[]): string {
  const idx = players.findIndex((p) => p.id === playerId);
  return PLAYER_COLORS[idx % PLAYER_COLORS.length] ?? "#4a4a7a";
}

export function EditEvidence({ editHistory, code, players }: EditEvidenceProps) {
  const lines = code.split("\n");

  // Compute suspicion scores: players with the most edits and highest edit frequency
  const suspicionData = useMemo(() => {
    const stats: Record<string, {
      name: string;
      linesEdited: number;
      totalEdits: number;
      editedLines: number[];
    }> = {};

    for (const [lineStr, edit] of Object.entries(editHistory)) {
      const lineNum = parseInt(lineStr, 10);
      if (!stats[edit.playerId]) {
        stats[edit.playerId] = {
          name: edit.playerName,
          linesEdited: 0,
          totalEdits: 0,
          editedLines: [],
        };
      }
      stats[edit.playerId].linesEdited++;
      stats[edit.playerId].totalEdits += edit.editCount;
      stats[edit.playerId].editedLines.push(lineNum);
    }

    return Object.entries(stats)
      .map(([id, s]) => ({ playerId: id, ...s }))
      .sort((a, b) => b.totalEdits - a.totalEdits);
  }, [editHistory]);

  // Find the max edit count for intensity scaling
  const maxEditCount = useMemo(() => {
    let max = 1;
    for (const edit of Object.values(editHistory)) {
      if (edit.editCount > max) max = edit.editCount;
    }
    return max;
  }, [editHistory]);

  if (Object.keys(editHistory).length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-void-muted/50">No edit evidence collected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Suspicion summary per player */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-void-muted font-bold mb-2">
          Suspicion Analysis
        </h4>
        <div className="space-y-2">
          {suspicionData.map((player, i) => {
            const color = getPlayerColor(player.playerId, players);
            const maxEdits = suspicionData[0]?.totalEdits ?? 1;
            const intensity = player.totalEdits / maxEdits;
            const suspicionLevel =
              intensity > 0.7 ? "HIGH" : intensity > 0.4 ? "MED" : "LOW";
            const suspicionColor =
              intensity > 0.7
                ? "text-void-danger"
                : intensity > 0.4
                  ? "text-void-warning"
                  : "text-void-success";

            return (
              <motion.div
                key={player.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-void-bg/50 border border-void-border/20"
              >
                <span
                  className="text-xs font-bold w-20 truncate"
                  style={{ color }}
                >
                  {player.name}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-void-border/30 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${intensity * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                </div>
                <span className="text-[9px] text-void-muted font-mono w-14 text-right">
                  {player.linesEdited}L {player.totalEdits}E
                </span>
                <span
                  className={`text-[9px] font-black w-8 text-right ${suspicionColor}`}
                >
                  {suspicionLevel}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Line-by-line evidence with intensity */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-void-muted font-bold mb-2">
          Code Evidence
        </h4>
        <div className="rounded-lg border border-void-border/30 overflow-hidden bg-void-surface/30 max-h-52 overflow-y-auto">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const edit = editHistory[lineNum];
            const color = edit
              ? getPlayerColor(edit.playerId, players)
              : undefined;
            // Intensity based on edit count: more edits = more suspicious
            const intensity = edit
              ? Math.min(edit.editCount / maxEditCount, 1)
              : 0;
            const bgOpacity = intensity > 0.5 ? 0.15 : intensity > 0 ? 0.06 : 0;

            return (
              <div
                key={lineNum}
                className="flex items-center text-[11px] font-mono border-b border-void-border/10 last:border-b-0"
                style={{
                  backgroundColor: color
                    ? `${color}${Math.round(bgOpacity * 255)
                        .toString(16)
                        .padStart(2, "0")}`
                    : "transparent",
                }}
              >
                {/* Line number */}
                <span className="w-7 text-right pr-1.5 text-void-muted/40 select-none flex-shrink-0">
                  {lineNum}
                </span>

                {/* Intensity bar */}
                <div
                  className="w-1 self-stretch flex-shrink-0"
                  style={{
                    backgroundColor: color ?? "transparent",
                    opacity: 0.4 + intensity * 0.6,
                  }}
                />

                {/* Code */}
                <span className="flex-1 px-2 py-0.5 text-void-text/70 truncate whitespace-pre">
                  {line || " "}
                </span>

                {/* Edit count badge for heavily edited lines */}
                {edit && edit.editCount > 1 && (
                  <span
                    className="text-[8px] px-1 py-0.5 rounded font-bold flex-shrink-0 mr-1"
                    style={{
                      color,
                      backgroundColor: `${color}20`,
                    }}
                  >
                    x{edit.editCount}
                  </span>
                )}

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
