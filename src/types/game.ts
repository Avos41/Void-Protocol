// ── Enums ──────────────────────────────────────────────

export enum Role {
  Crew = "crew",
  Saboteur = "saboteur",
  Spectator = "spectator",
}

export enum GamePhase {
  Home = "home",
  Lobby = "lobby",
  RoleReveal = "role_reveal",
  Playing = "playing",
  Meeting = "meeting",
  Voting = "voting",
  Ejection = "ejection",
  Results = "results",
}

export enum MessageType {
  // Client → Server
  JOIN = "JOIN",
  LEAVE = "LEAVE",
  START_GAME = "START_GAME",
  CODE_UPDATE = "CODE_UPDATE",
  CALL_MEETING = "CALL_MEETING",
  VOTE = "VOTE",
  TOGGLE_READY = "TOGGLE_READY",
  CHANGE_SETTINGS = "CHANGE_SETTINGS",
  TEST_RESULTS = "TEST_RESULTS",
  CURSOR_UPDATE = "CURSOR_UPDATE",
  CHAT_MESSAGE = "CHAT_MESSAGE",
  PLAY_AGAIN = "PLAY_AGAIN",

  // Server → Client
  GAME_STATE_SYNC = "GAME_STATE_SYNC",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  ERROR = "ERROR",
  ROLE_ASSIGNED = "ROLE_ASSIGNED",
  MEETING_CALLED = "MEETING_CALLED",
  VOTE_RESULT = "VOTE_RESULT",
  VOTE_REVEAL = "VOTE_REVEAL",
  GAME_OVER = "GAME_OVER",
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
  COUNTDOWN = "COUNTDOWN",
  TIMER_SYNC = "TIMER_SYNC",
  PHASE_CHANGE = "PHASE_CHANGE",
  CURSOR_BROADCAST = "CURSOR_BROADCAST",
  EDIT_HISTORY_SYNC = "EDIT_HISTORY_SYNC",
  SABOTAGE_TASKS = "SABOTAGE_TASKS",
  CHAT_BROADCAST = "CHAT_BROADCAST",
  PLAY_AGAIN_ACK = "PLAY_AGAIN_ACK",
}

// ── Challenge Categories & Difficulty ──────────────────

export type ChallengeCategory =
  | "data-structures"
  | "algorithms"
  | "oop-basics"
  | "string-manipulation";

export type ChallengeDifficulty = "easy" | "medium" | "hard";

export interface LobbySettings {
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
}

export const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  "data-structures": "Data Structures",
  algorithms: "Algorithms",
  "oop-basics": "OOP Basics",
  "string-manipulation": "String Manipulation",
};

export const DIFFICULTY_LABELS: Record<
  ChallengeDifficulty,
  { label: string; rank: string }
> = {
  easy: { label: "Cadet", rank: "Easy" },
  medium: { label: "Officer", rank: "Medium" },
  hard: { label: "Commander", rank: "Hard" },
};

// ── Data Interfaces ────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  isReady: boolean;
}

export interface ChallengeSabotageTask {
  id: string;
  description: string;
  hint: string;
  targetLine: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
  sabotageTargets?: string[];
  sabotageTasks?: ChallengeSabotageTask[];
}

export interface CursorPosition {
  playerId: string;
  playerName: string;
  lineNumber: number;
  column: number;
  color: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  label: string;
}

// ── Edit Attribution ──────────────────────────────────

export interface LineEdit {
  playerId: string;
  playerName: string;
  timestamp: number;
  editCount: number;
}

/** Per-line authorship map: lineNumber → most recent editor */
export type EditHistory = Record<number, LineEdit>;

// ── Sabotage Tasks ────────────────────────────────────

export interface SabotageTask {
  id: string;
  description: string;
  hint: string;
  targetLine: number;
  completed: boolean;
}

export interface VoteResult {
  playerId: string;
  playerName: string;
  votes: number;
  wasEjected: boolean;
  wasSaboteur: boolean;
}

export type WinReason =
  | "saboteur_ejected"
  | "tests_passed"
  | "timer_expired"
  | "crew_eliminated";

export interface RoundVoteRecord {
  round: number;
  votes: Record<string, string>;
  result: VoteResult;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  avatar: string;
  text: string;
  timestamp: number;
}

// ── Game State (Server‑authoritative) ──────────────────

export interface GameState {
  roomCode: string;
  players: Player[];
  phase: GamePhase;
  code: string;
  votes: Record<string, string>;
  roles: Record<string, Role>;
  currentChallenge: Challenge | null;
  roundNumber: number;
  meetingCaller: string | null;
  timeRemaining: number;
  winner: "crew" | "saboteur" | null;
  settings: LobbySettings;
  allTestsPassed: boolean;
  voteCount: number;
}

// ── Messages ───────────────────────────────────────────

// Client → Server

export interface JoinMessage {
  type: MessageType.JOIN;
  playerName: string;
  avatar: string;
}

export interface LeaveMessage {
  type: MessageType.LEAVE;
}

export interface StartGameMessage {
  type: MessageType.START_GAME;
}

export interface CodeUpdateMessage {
  type: MessageType.CODE_UPDATE;
  code: string;
  playerId: string;
}

export interface CallMeetingMessage {
  type: MessageType.CALL_MEETING;
  callerId: string;
}

export interface VoteMessage {
  type: MessageType.VOTE;
  voterId: string;
  targetId: string;
}

export interface ToggleReadyMessage {
  type: MessageType.TOGGLE_READY;
}

export interface ChangeSettingsMessage {
  type: MessageType.CHANGE_SETTINGS;
  settings: LobbySettings;
}

export interface TestResultsMessage {
  type: MessageType.TEST_RESULTS;
  allPassed: boolean;
  passedTests: number;
  totalTests: number;
}

export interface CursorUpdateMessage {
  type: MessageType.CURSOR_UPDATE;
  playerId: string;
  playerName: string;
  lineNumber: number;
  column: number;
}

export interface ChatMessageClientMessage {
  type: MessageType.CHAT_MESSAGE;
  text: string;
}

// Server → Client

export interface GameStateSyncMessage {
  type: MessageType.GAME_STATE_SYNC;
  state: GameState;
}

export interface PlayerJoinedMessage {
  type: MessageType.PLAYER_JOINED;
  player: Player;
}

export interface PlayerLeftMessage {
  type: MessageType.PLAYER_LEFT;
  playerId: string;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  message: string;
}

export interface RoleAssignedMessage {
  type: MessageType.ROLE_ASSIGNED;
  role: Role;
}

export interface MeetingCalledMessage {
  type: MessageType.MEETING_CALLED;
  callerId: string;
  callerName: string;
}

export interface VoteResultMessage {
  type: MessageType.VOTE_RESULT;
  result: VoteResult;
}

export interface GameOverMessage {
  type: MessageType.GAME_OVER;
  winner: "crew" | "saboteur";
  roles: Record<string, Role>;
  reason: WinReason;
  voteHistory: RoundVoteRecord[];
  editHistory: EditHistory;
}

export interface SettingsChangedMessage {
  type: MessageType.SETTINGS_CHANGED;
  settings: LobbySettings;
}

export interface CountdownMessage {
  type: MessageType.COUNTDOWN;
  count: number;
}

export interface TimerSyncMessage {
  type: MessageType.TIMER_SYNC;
  timeRemaining: number;
  phase: GamePhase;
}

export interface PhaseChangeMessage {
  type: MessageType.PHASE_CHANGE;
  phase: GamePhase;
}

export interface CursorBroadcastMessage {
  type: MessageType.CURSOR_BROADCAST;
  cursors: CursorPosition[];
}

export interface EditHistorySyncMessage {
  type: MessageType.EDIT_HISTORY_SYNC;
  editHistory: EditHistory;
}

export interface SabotageTasksMessage {
  type: MessageType.SABOTAGE_TASKS;
  tasks: SabotageTask[];
}

export interface ChatBroadcastMessage {
  type: MessageType.CHAT_BROADCAST;
  message: ChatMessage;
}

export interface PlayAgainMessage {
  type: MessageType.PLAY_AGAIN;
}

export interface PlayAgainAckMessage {
  type: MessageType.PLAY_AGAIN_ACK;
}

export interface VoteRevealMessage {
  type: MessageType.VOTE_REVEAL;
  votes: Record<string, string>;
  result: VoteResult;
}

export type ClientMessage =
  | JoinMessage
  | LeaveMessage
  | StartGameMessage
  | CodeUpdateMessage
  | CallMeetingMessage
  | VoteMessage
  | ToggleReadyMessage
  | ChangeSettingsMessage
  | TestResultsMessage
  | CursorUpdateMessage
  | ChatMessageClientMessage
  | PlayAgainMessage;

export type ServerMessage =
  | GameStateSyncMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | ErrorMessage
  | RoleAssignedMessage
  | MeetingCalledMessage
  | VoteResultMessage
  | VoteRevealMessage
  | GameOverMessage
  | SettingsChangedMessage
  | CountdownMessage
  | TimerSyncMessage
  | PhaseChangeMessage
  | CursorBroadcastMessage
  | EditHistorySyncMessage
  | SabotageTasksMessage
  | ChatBroadcastMessage
  | PlayAgainAckMessage;

// ── Constants ──────────────────────────────────────────

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 5;
export const ROUND_DURATION_SECONDS = 180;
export const MEETING_DURATION_SECONDS = 60;
export const VOTING_DURATION_SECONDS = 30;
export const ROLE_REVEAL_SECONDS = 5;
export const ROOM_CODE_LENGTH = 4;
export const COUNTDOWN_SECONDS = 3;
export const EJECTION_DURATION_SECONDS = 6;
