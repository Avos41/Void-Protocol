import { motion, AnimatePresence } from "framer-motion";
import { VoidButton } from "../ui/VoidButton";
import { Role } from "../../types/game";
import type { Challenge } from "../../types/game";
import type { RunResult } from "../../utils/codeRunner";

interface ChallengePanelProps {
  challenge: Challenge | null;
  testResults: RunResult | null;
  isRunning: boolean;
  myRole: Role | null;
  onRunTests: () => void;
}

export function ChallengePanel({
  challenge,
  testResults,
  isRunning,
  myRole,
  onRunTests,
}: ChallengePanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Challenge Briefing */}
      {challenge && (
        <div className="p-4 border-b border-void-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-void-muted font-bold">
              Mission Briefing
            </span>
          </div>
          <h3 className="text-sm font-bold mb-1">{challenge.title}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`
                text-[10px] uppercase px-2 py-0.5 rounded-full font-bold
                ${
                  challenge.difficulty === "easy"
                    ? "bg-void-success/20 text-void-success"
                    : challenge.difficulty === "medium"
                      ? "bg-void-warning/20 text-void-warning"
                      : "bg-void-danger/20 text-void-danger"
                }
              `}
            >
              {challenge.difficulty}
            </span>
            <span className="text-[10px] text-void-muted uppercase">
              {challenge.category}
            </span>
          </div>
          <p className="text-xs text-void-muted leading-relaxed">
            {challenge.description}
          </p>
        </div>
      )}

      {/* Run Tests Button */}
      <div className="p-4 border-b border-void-border/50">
        <VoidButton
          variant="success"
          size="sm"
          onClick={onRunTests}
          isLoading={isRunning}
          className="w-full"
          icon="▶"
        >
          Run Tests
        </VoidButton>
      </div>

      {/* Test Results */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {testResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-void-muted">
                  Test Results
                </span>
                <span
                  className={`text-xs font-bold ${
                    testResults.allPassed
                      ? "text-void-success"
                      : "text-void-danger"
                  }`}
                >
                  {testResults.passedTests}/{testResults.totalTests} passed
                </span>
              </div>
              {testResults.results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`
                    text-xs p-3 rounded-lg border
                    ${
                      result.passed
                        ? "border-void-success/30 bg-void-success/5"
                        : "border-void-danger/30 bg-void-danger/5"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{result.passed ? "✅" : "❌"}</span>
                    <span className="font-medium">{result.label}</span>
                  </div>
                  {!result.passed && (
                    <div className="mt-1 text-void-muted">
                      {result.error ? (
                        <p className="text-void-danger text-[11px] break-all">
                          {result.error.split("\n").pop()}
                        </p>
                      ) : (
                        <p>
                          Expected:{" "}
                          <code className="text-void-success">
                            {result.expected}
                          </code>{" "}
                          Got:{" "}
                          <code className="text-void-danger">
                            {result.actual}
                          </code>
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {/* Pending test placeholders */}
              {challenge?.testCases.map((tc, i) => (
                <div
                  key={i}
                  className="text-xs p-3 rounded-lg border border-void-border/30 bg-void-surface/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-void-muted">⏳</span>
                    <span className="text-void-muted font-medium">
                      {tc.label}
                    </span>
                  </div>
                </div>
              ))}
              {!challenge && (
                <p className="text-xs text-void-muted/50 text-center mt-8">
                  Run tests to see results here
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Saboteur hint */}
      {myRole === Role.Saboteur && (
        <div className="p-3 border-t border-void-border/50">
          <div className="p-3 rounded-lg bg-saboteur/5 border border-saboteur/20">
            <p className="text-[10px] text-saboteur/80 leading-relaxed">
              🔴 <strong>SABOTEUR TIP:</strong> Introduce subtle bugs —
              off-by-one errors, wrong operators, edge case failures.
              Don&apos;t make it obvious!
            </p>
            {challenge?.sabotageTargets && (
              <div className="mt-2 space-y-1">
                {challenge.sabotageTargets.map((target, i) => (
                  <p
                    key={i}
                    className="text-[10px] text-saboteur/60 font-mono"
                  >
                    → {target}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
