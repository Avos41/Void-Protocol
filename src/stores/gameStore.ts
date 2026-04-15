import { create } from "zustand";
import type { GameState, Player, ServerMessage, CursorPosition, EditHistory, SabotageTask, ChatMessage, VoteResult, RoundVoteRecord, WinReason } from "../types/game";
import { GamePhase, MessageType, Role } from "../types/game";

interface GameStore {
  // Connection
  playerId: string | null;
  playerName: string;
  avatar: string;
  roomCode: string;
  isConnected: boolean;

  // Local player state
  myRole: Role | null;
  remoteCursors: CursorPosition[];
  editHistory: EditHistory;
  sabotageTasks: SabotageTask[];

  // Chat & voting
  chatMessages: ChatMessage[];
  voteResult: VoteResult | null;
  revealedVotes: Record<string, string>;

  // Results
  winReason: WinReason | null;
  voteHistory: RoundVoteRecord[];

  // Server-authoritative game state
  gameState: GameState;

  // UI state
  error: string | null;
  countdown: number | null; // null = not counting, 3/2/1/0 = active

  // Actions
  setPlayerInfo: (name: string, avatar: string) => void;
  setRoomCode: (code: string) => void;
  setPlayerId: (id: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  handleServerMessage: (message: ServerMessage) => void;
  resetToHome: () => void;
}

const initialGameState: GameState = {
  roomCode: "",
  players: [],
  phase: GamePhase.Home,
  code: "",
  votes: {},
  roles: {},
  currentChallenge: null,
  roundNumber: 0,
  meetingCaller: null,
  timeRemaining: 0,
  winner: null,
  settings: { category: "algorithms", difficulty: "easy" },
  allTestsPassed: false,
  voteCount: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  playerId: null,
  playerName: "",
  avatar: "🧑‍💻",
  roomCode: "",
  isConnected: false,
  myRole: null,
  remoteCursors: [],
  editHistory: {},
  sabotageTasks: [],
  chatMessages: [],
  voteResult: null,
  revealedVotes: {},
  winReason: null,
  voteHistory: [],
  gameState: initialGameState,
  error: null,
  countdown: null,

  setPlayerInfo: (name, avatar) => set({ playerName: name, avatar }),
  setRoomCode: (code) => set({ roomCode: code }),
  setPlayerId: (id) => set({ playerId: id }),
  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),

  handleServerMessage: (message: ServerMessage) => {
    switch (message.type) {
      case MessageType.GAME_STATE_SYNC:
        set({ gameState: message.state, error: null });
        break;

      case MessageType.PLAYER_JOINED:
        set((state) => ({
          gameState: {
            ...state.gameState,
            players: [...state.gameState.players, message.player],
          },
        }));
        break;

      case MessageType.PLAYER_LEFT:
        set((state) => ({
          gameState: {
            ...state.gameState,
            players: state.gameState.players.filter(
              (p: Player) => p.id !== message.playerId
            ),
          },
        }));
        break;

      case MessageType.ROLE_ASSIGNED:
        set({ myRole: message.role });
        break;

      case MessageType.ERROR:
        set({ error: message.message });
        break;

      case MessageType.MEETING_CALLED:
        // Clear chat messages for new meeting
        set({ chatMessages: [], voteResult: null, revealedVotes: {} });
        break;

      case MessageType.VOTE_RESULT:
        set({ voteResult: message.result });
        break;

      case MessageType.VOTE_REVEAL:
        set({ revealedVotes: message.votes, voteResult: message.result });
        break;

      case MessageType.CHAT_BROADCAST:
        set((state) => ({
          chatMessages: [...state.chatMessages, message.message],
        }));
        break;

      case MessageType.GAME_OVER:
        set((state) => ({
          gameState: {
            ...state.gameState,
            winner: message.winner,
            roles: message.roles,
            phase: GamePhase.Results,
          },
          winReason: message.reason,
          voteHistory: message.voteHistory,
          editHistory: message.editHistory,
        }));
        break;

      case MessageType.SETTINGS_CHANGED:
        set((state) => ({
          gameState: {
            ...state.gameState,
            settings: message.settings,
          },
        }));
        break;

      case MessageType.COUNTDOWN:
        // count=3,2,1 → show overlay; count=0 → game launching, clear countdown
        set({ countdown: message.count > 0 ? message.count : 0 });
        // Auto-clear countdown after showing "0" (LAUNCH) briefly
        if (message.count === 0) {
          setTimeout(() => set({ countdown: null }), 800);
        }
        break;

      case MessageType.TIMER_SYNC:
        set((state) => ({
          gameState: {
            ...state.gameState,
            timeRemaining: message.timeRemaining,
          },
        }));
        break;

      case MessageType.PHASE_CHANGE:
        set((state) => ({
          gameState: {
            ...state.gameState,
            phase: message.phase,
          },
        }));
        break;

      case MessageType.CURSOR_BROADCAST:
        set({ remoteCursors: message.cursors });
        break;

      case MessageType.EDIT_HISTORY_SYNC:
        set({ editHistory: message.editHistory });
        break;

      case MessageType.SABOTAGE_TASKS:
        set({ sabotageTasks: message.tasks });
        break;

      case MessageType.PLAY_AGAIN_ACK:
        set({
          winReason: null,
          voteHistory: [],
          editHistory: {},
          sabotageTasks: [],
          chatMessages: [],
          voteResult: null,
          revealedVotes: {},
          myRole: null,
          countdown: null,
          error: null,
        });
        break;
    }
  },

  resetToHome: () => {
    const current = get();
    set({
      roomCode: "",
      isConnected: false,
      myRole: null,
      remoteCursors: [],
      editHistory: {},
      sabotageTasks: [],
      chatMessages: [],
      voteResult: null,
      revealedVotes: {},
      winReason: null,
      voteHistory: [],
      gameState: initialGameState,
      error: null,
      countdown: null,
      playerName: current.playerName,
      avatar: current.avatar,
    });
  },
}));
