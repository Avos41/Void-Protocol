import type { Player } from "../src/types/game";
import { Role } from "../src/types/game";

export type WinResult =
  | { winner: "crew"; reason: "saboteur_ejected" | "tests_passed" }
  | { winner: "saboteur"; reason: "timer_expired" | "crew_eliminated" }
  | null;

/**
 * Server-authoritative win condition checker.
 *
 * CREW WINS when:
 *   - All test cases pass (allTestsPassed = true)
 *   - All Saboteurs have been ejected (voted out)
 *
 * SABOTEUR WINS when:
 *   - Coding timer runs out while tests are still failing
 *   - Enough Crew members are ejected that Saboteurs >= remaining Crew
 */
export function checkWinCondition(
  players: Player[],
  roles: Record<string, Role>,
  allTestsPassed: boolean,
  timerExpired: boolean
): WinResult {
  const alive = players.filter((p) => p.isAlive);
  const aliveSaboteurs = alive.filter((p) => roles[p.id] === Role.Saboteur);
  const aliveCrew = alive.filter((p) => roles[p.id] === Role.Crew);

  // Crew win: all saboteurs ejected
  if (aliveSaboteurs.length === 0) {
    return { winner: "crew", reason: "saboteur_ejected" };
  }

  // Crew win: all tests pass
  if (allTestsPassed) {
    return { winner: "crew", reason: "tests_passed" };
  }

  // Saboteur win: saboteurs outnumber or equal crew
  if (aliveSaboteurs.length >= aliveCrew.length) {
    return { winner: "saboteur", reason: "crew_eliminated" };
  }

  // Saboteur win: timer expired with failing tests
  if (timerExpired && !allTestsPassed) {
    return { winner: "saboteur", reason: "timer_expired" };
  }

  return null;
}
