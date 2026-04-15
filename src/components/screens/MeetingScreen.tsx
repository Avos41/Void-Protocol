import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";
import { usePartySocket } from "../../hooks/usePartySocket";
import {
  MessageType,
  GamePhase,
  MEETING_DURATION_SECONDS,
  VOTING_DURATION_SECONDS,
} from "../../types/game";
import { GlassCard } from "../ui/GlassCard";
import { VoidButton } from "../ui/VoidButton";
import { PlayerAvatar } from "../ui/PlayerAvatar";
import { TimerBar } from "../ui/TimerBar";
import { EditEvidence } from "../ui/EditEvidence";
import { ChatBox } from "../ui/ChatBox";
import { soundManager } from "../../utils/SoundManager";

const SKIP_VOTE = "__SKIP__";

export function MeetingScreen() {
  const { gameState, playerId, editHistory } = useGameStore();
  const { sendMessage } = usePartySocket();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const isVotingPhase = gameState.phase === GamePhase.Voting;
  const isDiscussionPhase = gameState.phase === GamePhase.Meeting;

  // Play meeting alarm on mount
  useEffect(() => {
    soundManager.play("meetingCalled");
  }, []);

  const alivePlayers = gameState.players.filter((p) => p.isAlive);
  const myVote = playerId ? gameState.votes[playerId] : undefined;
  const alreadyVoted = myVote !== undefined || hasVoted;

  const callerName =
    gameState.players.find((p) => p.id === gameState.meetingCaller)?.name ??
    "Unknown";

  const handleVote = () => {
    if (!selectedTarget || alreadyVoted || !isVotingPhase) return;
    sendMessage({
      type: MessageType.VOTE,
      voterId: playerId ?? "",
      targetId: selectedTarget,
    });
    setHasVoted(true);
    soundManager.play("voteCast");
  };

  const totalAlive = alivePlayers.length;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Emergency overlay effect */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-void-danger/10"
        />
      </div>

      {/* Top Header */}
      <div className="relative z-10 border-b border-void-border bg-void-surface/50 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.h1
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: 3 }}
              className="text-lg font-black tracking-tight"
            >
              <span className="text-void-danger">EMERGENCY MEETING</span>
            </motion.h1>
            <div
              className={`
                text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider
                ${isVotingPhase
                  ? "bg-void-danger/20 text-void-danger"
                  : "bg-void-warning/20 text-void-warning"
                }
              `}
            >
              {isVotingPhase ? "Voting" : "Discussion"}
            </div>
          </div>
          <p className="text-void-muted text-xs">
            Called by{" "}
            <span className="text-void-text font-bold">{callerName}</span>
          </p>
        </div>

        {/* Timer */}
        <div className="px-4 pb-2">
          <TimerBar
            timeRemaining={gameState.timeRemaining}
            totalTime={
              isVotingPhase
                ? VOTING_DURATION_SECONDS
                : MEETING_DURATION_SECONDS
            }
            label={isVotingPhase ? "Vote Timer" : "Discussion Timer"}
          />
        </div>
      </div>

      {/* Main Content — 2 column layout */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden meeting-layout">
        {/* Left Column: Evidence + Voting */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-0">
          <AnimatePresence mode="wait">
            {/* Discussion Phase Content */}
            {isDiscussionPhase && (
              <motion.div
                key="discussion"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Players grid */}
                <GlassCard>
                  <h3 className="text-[10px] font-bold mb-3 uppercase tracking-widest text-void-muted">
                    Crew Members
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {alivePlayers.map((player, i) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-center"
                      >
                        <PlayerAvatar player={player} size="sm" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-[10px] text-void-muted/50 text-center mt-3">
                    Voting begins when discussion ends...
                  </p>
                </GlassCard>

                {/* Edit Evidence */}
                {Object.keys(editHistory).length > 0 && (
                  <GlassCard>
                    <h3 className="text-[10px] font-bold mb-3 uppercase tracking-widest text-void-muted">
                      Code Evidence
                    </h3>
                    <EditEvidence
                      editHistory={editHistory}
                      code={gameState.code}
                      players={gameState.players}
                    />
                  </GlassCard>
                )}
              </motion.div>
            )}

            {/* Voting Phase Content */}
            {isVotingPhase && (
              <motion.div
                key="voting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Vote Status */}
                <div className="text-center">
                  <span className="text-xs text-void-muted">
                    Votes cast:{" "}
                    <span className="text-void-text font-bold">
                      {gameState.voteCount}
                    </span>
                    /{totalAlive}
                  </span>
                </div>

                <GlassCard glow>
                  <h3 className="text-[10px] font-bold mb-4 uppercase tracking-widest text-void-muted">
                    Vote to Eject
                  </h3>

                  {/* Player vote targets */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {alivePlayers
                      .filter((p) => p.id !== playerId)
                      .map((player, i) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div
                            onClick={() =>
                              !alreadyVoted && setSelectedTarget(player.id)
                            }
                            className={`
                              p-3 rounded-xl border-2 text-center transition-all duration-200
                              ${alreadyVoted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                              ${selectedTarget === player.id
                                ? "border-void-danger bg-void-danger/10 shadow-[0_0_20px_rgba(255,45,85,0.2)]"
                                : "border-void-border bg-void-surface hover:border-void-muted"
                              }
                            `}
                          >
                            <PlayerAvatar player={player} size="sm" />
                          </div>
                        </motion.div>
                      ))}
                  </div>

                  {/* Skip Vote */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() =>
                      !alreadyVoted && setSelectedTarget(SKIP_VOTE)
                    }
                    className={`
                      p-3 rounded-xl border-2 text-center mb-4 transition-all duration-200
                      ${alreadyVoted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                      ${selectedTarget === SKIP_VOTE
                        ? "border-void-warning bg-void-warning/10"
                        : "border-void-border bg-void-surface/50 hover:border-void-muted"
                      }
                    `}
                  >
                    <span className="text-sm">Skip Vote</span>
                  </motion.div>

                  {/* Vote Button */}
                  <AnimatePresence>
                    {!alreadyVoted && selectedTarget && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <VoidButton
                          variant="danger"
                          onClick={handleVote}
                          className="w-full"
                          size="lg"
                        >
                          {selectedTarget === SKIP_VOTE
                            ? "Skip Vote"
                            : `Eject ${alivePlayers.find((p) => p.id === selectedTarget)?.name}`}
                        </VoidButton>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Already voted state */}
                  {alreadyVoted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4"
                    >
                      <p className="text-void-success text-sm font-bold">
                        Vote Cast
                      </p>
                      <p className="text-void-muted text-xs mt-1">
                        Waiting for other agents...
                      </p>
                    </motion.div>
                  )}
                </GlassCard>

                {/* Evidence still visible during voting */}
                {Object.keys(editHistory).length > 0 && (
                  <GlassCard>
                    <h3 className="text-[10px] font-bold mb-3 uppercase tracking-widest text-void-muted">
                      Code Evidence
                    </h3>
                    <EditEvidence
                      editHistory={editHistory}
                      code={gameState.code}
                      players={gameState.players}
                    />
                  </GlassCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Chat */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-void-border/50 flex flex-col min-h-[200px] lg:min-h-0 meeting-chat-panel">
          <ChatBox disabled={isVotingPhase} />
        </div>
      </div>
    </div>
  );
}
