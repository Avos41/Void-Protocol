import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { usePartySocket } from "../../hooks/usePartySocket";
import { MessageType, Role, ROUND_DURATION_SECONDS } from "../../types/game";
import { GlassCard } from "../ui/GlassCard";
import { VoidButton } from "../ui/VoidButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { TimerBar } from "../ui/TimerBar";
import { CodeEditor } from "../editor/CodeEditor";
import { ChallengePanel } from "./ChallengePanel";
import { SabotageTasks } from "./SabotageTasks";
import { runTests, extractFunctionName, initPyodide } from "../../utils/codeRunner";
import { soundManager } from "../../utils/SoundManager";
import type { RunResult } from "../../utils/codeRunner";

export function GameScreen() {
  const { gameState, playerId, myRole, sabotageTasks } = useGameStore();
  const { sendMessage } = usePartySocket();
  const [testResults, setTestResults] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);

  const isSaboteur = myRole === Role.Saboteur;

  // Debounce timer ref for code updates
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Warm up Pyodide in the background
  useEffect(() => {
    initPyodide().then(() => setPyodideReady(true));
  }, []);

  // Debounced code change handler (300ms)
  const handleCodeChange = useCallback(
    (code: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        sendMessage({
          type: MessageType.CODE_UPDATE,
          code,
          playerId: playerId ?? "",
        });
      }, 300);
    },
    [sendMessage, playerId]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleCallMeeting = () => {
    sendMessage({
      type: MessageType.CALL_MEETING,
      callerId: playerId ?? "",
    });
  };

  const handleRunTests = async () => {
    if (!gameState.currentChallenge) return;
    setIsRunning(true);
    try {
      const funcName = extractFunctionName(gameState.code);
      if (!funcName) {
        setTestResults({
          results: [],
          allPassed: false,
          totalTests: 0,
          passedTests: 0,
        });
        return;
      }
      const result = await runTests(
        gameState.code,
        gameState.currentChallenge.testCases,
        funcName
      );
      setTestResults(result);

      // Play sound feedback
      soundManager.play(result.allPassed ? "testPass" : "testFail");

      // Report test results to server for win condition checking
      sendMessage({
        type: MessageType.TEST_RESULTS,
        allPassed: result.allPassed,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
      });
    } catch {
      console.error("Failed to run tests");
    } finally {
      setIsRunning(false);
    }
  };

  const challenge = gameState.currentChallenge;

  return (
    <div className={`min-h-screen flex flex-col bg-void-bg scanlines ${isSaboteur ? "saboteur-vignette" : ""}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-void-border bg-void-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold tracking-wider">
            <span className="text-void-accent">VOID</span> PROTOCOL
          </h1>
          <div
            className={`
              text-xs font-bold px-3 py-1 rounded-full
              ${myRole === Role.Saboteur
                ? "bg-saboteur/20 text-saboteur"
                : "bg-crew/20 text-crew"
              }
            `}
          >
            {isSaboteur ? "💀 SABOTEUR" : "🔵 CREW"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-void-muted">
            Round {gameState.roundNumber}
          </span>

          {/* Pyodide loading indicator */}
          {!pyodideReady && (
            <span className="text-[10px] text-void-warning animate-pulse">
              Loading runtime...
            </span>
          )}

          <button
            onClick={() => setShowPlayers(!showPlayers)}
            className="text-xs text-void-muted hover:text-void-text transition-colors"
          >
            👥 {gameState.players.filter((p) => p.isAlive).length}/{gameState.players.length}
          </button>

          <VoidButton
            variant="danger"
            size="sm"
            onClick={handleCallMeeting}
            icon="🚨"
          >
            Emergency Meeting
          </VoidButton>
        </div>
      </div>

      {/* Timer */}
      <div className="px-4 py-2 border-b border-void-border/50">
        <TimerBar
          timeRemaining={gameState.timeRemaining}
          totalTime={ROUND_DURATION_SECONDS}
          label="Round Timer"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden game-layout">
        {/* Left Panel: Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden game-editor-panel">
          {/* Challenge title bar */}
          {challenge && (
            <div className="px-4 py-2 border-b border-void-border/50 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-void-muted font-bold">
                Challenge:
              </span>
              <span className="text-xs font-bold">{challenge.title}</span>
              <span
                className={`
                  text-[10px] uppercase px-2 py-0.5 rounded-full font-bold
                  ${challenge.difficulty === "easy"
                    ? "bg-void-success/20 text-void-success"
                    : challenge.difficulty === "medium"
                      ? "bg-void-warning/20 text-void-warning"
                      : "bg-void-danger/20 text-void-danger"
                  }
                `}
              >
                {challenge.difficulty}
              </span>
            </div>
          )}

          {/* Code Editor — takes all available vertical space */}
          <div className="flex-1 p-4 overflow-auto">
            <CodeEditor
              code={gameState.code}
              onChange={handleCodeChange}
              height="calc(100vh - 220px)"
              isSaboteur={isSaboteur}
            />
          </div>
        </div>

        {/* Right Panel: Sabotage Tasks (saboteur) or Challenge + Tests (crew) */}
        <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l flex flex-col overflow-hidden game-side-panel ${isSaboteur ? "border-saboteur/20" : "border-void-border/50"}`}>
          {isSaboteur && sabotageTasks.length > 0 ? (
            <>
              <SabotageTasks tasks={sabotageTasks} />
              {/* Still show run tests + results for saboteur */}
              <div className="border-t border-saboteur/10">
                <ChallengePanel
                  challenge={challenge}
                  testResults={testResults}
                  isRunning={isRunning}
                  myRole={myRole}
                  onRunTests={handleRunTests}
                />
              </div>
            </>
          ) : (
            <ChallengePanel
              challenge={challenge}
              testResults={testResults}
              isRunning={isRunning}
              myRole={myRole}
              onRunTests={handleRunTests}
            />
          )}
        </div>
      </div>

      {/* Players overlay */}
      <AnimatePresence>
        {showPlayers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
            onClick={() => setShowPlayers(false)}
          >
            <GlassCard className="!p-6 w-full max-w-sm" glow>
              <h3 className="text-sm font-bold mb-4 text-center">
                Connected Agents
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {gameState.players.map((player) => (
                  <PlayerAvatar key={player.id} player={player} />
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
