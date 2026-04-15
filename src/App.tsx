import { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameStore } from "./stores/gameStore";
import { GamePhase } from "./types/game";
import { StarField } from "./components/effects/StarField";
import {
  ScreenTransition,
  getTransitionType,
} from "./components/effects/ScreenTransition";
import { MuteButton } from "./components/ui/MuteButton";
import { LandingPage } from "./components/screens/LandingPage";
import { LobbyScreen } from "./components/screens/LobbyScreen";
import { RoleRevealScreen } from "./components/screens/RoleRevealScreen";
import { GameScreen } from "./components/screens/GameScreen";
import { MeetingScreen } from "./components/screens/MeetingScreen";
import { EjectionAnimation } from "./components/screens/EjectionAnimation";
import { ResultsScreen } from "./components/screens/ResultsScreen";

function App() {
  const phase = useGameStore((s) => s.gameState.phase);
  const prevPhaseRef = useRef<GamePhase | null>(null);

  // Track previous phase for transition selection
  useEffect(() => {
    return () => {
      prevPhaseRef.current = phase;
    };
  }, [phase]);

  const transitionType = getTransitionType(prevPhaseRef.current, phase);

  const renderScreen = () => {
    switch (phase) {
      case GamePhase.Home:
        return (
          <ScreenTransition key="home" type={transitionType}>
            <LandingPage />
          </ScreenTransition>
        );
      case GamePhase.Lobby:
        return (
          <ScreenTransition key="lobby" type={transitionType}>
            <LobbyScreen />
          </ScreenTransition>
        );
      case GamePhase.RoleReveal:
        return (
          <ScreenTransition key="role-reveal" type={transitionType}>
            <RoleRevealScreen />
          </ScreenTransition>
        );
      case GamePhase.Playing:
        return (
          <ScreenTransition key="playing" type={transitionType}>
            <GameScreen />
          </ScreenTransition>
        );
      case GamePhase.Meeting:
        return (
          <ScreenTransition key="meeting" type={transitionType}>
            <MeetingScreen />
          </ScreenTransition>
        );
      case GamePhase.Voting:
        return (
          <ScreenTransition key="voting" type={transitionType}>
            <MeetingScreen />
          </ScreenTransition>
        );
      case GamePhase.Ejection:
        return (
          <ScreenTransition key="ejection" type={transitionType}>
            <EjectionAnimation />
          </ScreenTransition>
        );
      case GamePhase.Results:
        return (
          <ScreenTransition key="results" type={transitionType}>
            <ResultsScreen />
          </ScreenTransition>
        );
      default:
        return (
          <ScreenTransition key="home" type="default">
            <LandingPage />
          </ScreenTransition>
        );
    }
  };

  return (
    <div className="min-h-screen bg-void-bg text-void-text scanlines">
      {/* Global canvas star field behind everything */}
      <StarField />

      {/* Screen content with transitions */}
      <AnimatePresence mode="wait">{renderScreen()}</AnimatePresence>

      {/* Global mute toggle */}
      <MuteButton />
    </div>
  );
}

export default App;
