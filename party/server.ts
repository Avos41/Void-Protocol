import type * as Party from "partykit/server";
import type {
  ClientMessage,
  GameState,
  Player,
  Challenge,
  LobbySettings,
  CursorPosition,
  EditHistory,
  LineEdit,
  SabotageTask,
  ChatMessage,
  VoteResult,
  RoundVoteRecord,
  WinReason,
} from "../src/types/game";
import {
  MessageType,
  GamePhase,
  Role,
  MIN_PLAYERS,
  MAX_PLAYERS,
  ROUND_DURATION_SECONDS,
  MEETING_DURATION_SECONDS,
  VOTING_DURATION_SECONDS,
  ROLE_REVEAL_SECONDS,
  COUNTDOWN_SECONDS,
  EJECTION_DURATION_SECONDS,
} from "../src/types/game";
import { checkWinCondition } from "./winCondition";

// ── Challenges (embedded for server-side use) ──────────

const CHALLENGES: Challenge[] = [
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    category: "algorithms",
    difficulty: "easy",
    description: 'Write a function that returns "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for both, or the number as a string.',
    starterCode: `def fizzbuzz(n):\n    # TODO: Return "Fizz", "Buzz", "FizzBuzz", or str(n)\n    if n % 15 == 0:\n        return "FizzBuzz"\n    elif n % 3 == 0:\n        return "Fizz"\n    elif n % 5 == 0:\n        return "Buzz"\n    else:\n        return str(n)`,
    testCases: [
      { input: "1", expectedOutput: '"1"', label: "fizzbuzz(1) → '1'" },
      { input: "3", expectedOutput: '"Fizz"', label: "fizzbuzz(3) → 'Fizz'" },
      { input: "5", expectedOutput: '"Buzz"', label: "fizzbuzz(5) → 'Buzz'" },
      { input: "15", expectedOutput: '"FizzBuzz"', label: "fizzbuzz(15) → 'FizzBuzz'" },
      { input: "7", expectedOutput: '"7"', label: "fizzbuzz(7) → '7'" },
    ],
    sabotageTargets: ["line 3: change % 15 to % 10", "line 5: change % 3 to % 4"],
    sabotageTasks: [
      { id: "fizz-mod", description: "Change the modulo operator on the Fizz check", hint: "Make % 3 into % 4", targetLine: 5 },
      { id: "fizzbuzz-mod", description: "Break the FizzBuzz condition", hint: "Change % 15 to % 10", targetLine: 3 },
    ],
  },
  {
    id: "count-vowels",
    title: "Count Vowels",
    category: "algorithms",
    difficulty: "easy",
    description: "Write a function that counts the number of vowels (a, e, i, o, u) in a string, case-insensitive.",
    starterCode: `def count_vowels(s):\n    # TODO: Count vowels in the string\n    count = 0\n    for char in s:\n        if char.lower() in 'aeiou':\n            count += 1\n    return count`,
    testCases: [
      { input: '"hello world"', expectedOutput: "3", label: 'count_vowels("hello world") → 3' },
      { input: '"AEIOU"', expectedOutput: "5", label: 'count_vowels("AEIOU") → 5' },
      { input: '"rhythm"', expectedOutput: "0", label: 'count_vowels("rhythm") → 0' },
      { input: '"Programming"', expectedOutput: "3", label: 'count_vowels("Programming") → 3' },
    ],
    sabotageTargets: ["line 5: remove a vowel from 'aeiou'", "line 6: change += 1 to += 0"],
    sabotageTasks: [
      { id: "vowel-set", description: "Remove a vowel from the check set", hint: "Drop 'u' from 'aeiou'", targetLine: 5 },
      { id: "vowel-count", description: "Break the counter increment", hint: "Change += 1 to += 0", targetLine: 6 },
    ],
  },
  {
    id: "binary-search",
    title: "Fix Binary Search",
    category: "algorithms",
    difficulty: "medium",
    description: "The binary search function has 3 bugs. Fix them all so it correctly finds the target index or returns -1.",
    starterCode: `def binary_search(arr, target):\n    # TODO: Fix the 3 bugs in this binary search\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
    testCases: [
      { input: "[1,2,3,4,5], 3", expectedOutput: "2", label: "binary_search([1,2,3,4,5], 3) → 2" },
      { input: "[1,2,3,4,5], 6", expectedOutput: "-1", label: "binary_search([1,2,3,4,5], 6) → -1" },
      { input: "[1,3,5,7,9], 7", expectedOutput: "3", label: "binary_search([1,3,5,7,9], 7) → 3" },
      { input: "[2,4,6], 6", expectedOutput: "2", label: "binary_search([2,4,6], 6) → 2" },
      { input: "[10], 10", expectedOutput: "0", label: "binary_search([10], 10) → 0" },
    ],
    sabotageTargets: ["line 3: change len(arr) - 1 to len(arr)", "line 5: change // 2 to / 2"],
    sabotageTasks: [
      { id: "bs-bound", description: "Introduce an off-by-one in the boundary", hint: "Change len(arr) - 1 to len(arr)", targetLine: 3 },
      { id: "bs-div", description: "Break the midpoint calculation", hint: "Change // 2 to / 2", targetLine: 5 },
      { id: "bs-advance", description: "Prevent the left pointer from advancing", hint: "Change mid + 1 to mid", targetLine: 9 },
    ],
  },
  {
    id: "sorting-bubble",
    title: "Bubble Sort",
    category: "algorithms",
    difficulty: "medium",
    description: "Implement bubble sort to sort a list of numbers in ascending order. Return the sorted list.",
    starterCode: `def bubble_sort(arr):\n    # TODO: Implement bubble sort\n    n = len(arr)\n    result = arr.copy()\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if result[j] > result[j + 1]:\n                result[j], result[j + 1] = result[j + 1], result[j]\n    return result`,
    testCases: [
      { input: "[5, 3, 8, 1, 2]", expectedOutput: "[1, 2, 3, 5, 8]", label: "bubble_sort([5,3,8,1,2]) → [1,2,3,5,8]" },
      { input: "[1]", expectedOutput: "[1]", label: "bubble_sort([1]) → [1]" },
      { input: "[3, 1]", expectedOutput: "[1, 3]", label: "bubble_sort([3,1]) → [1,3]" },
      { input: "[1, 2, 3]", expectedOutput: "[1, 2, 3]", label: "bubble_sort([1,2,3]) → [1,2,3]" },
    ],
    sabotageTargets: ["line 7: change > to <", "line 6: change n - i - 1 to n - i"],
    sabotageTasks: [
      { id: "bubble-cmp", description: "Flip the comparison operator", hint: "Change > to <", targetLine: 7 },
      { id: "bubble-range", description: "Cause an index out of range error", hint: "Change n - i - 1 to n - i", targetLine: 6 },
    ],
  },
  {
    id: "two-pointer",
    title: "Two Pointer — Pair Sum",
    category: "algorithms",
    difficulty: "hard",
    description: "Given a SORTED list, find two numbers that add up to the target. Return them as [a, b]. If no pair, return empty list.",
    starterCode: `def pair_sum(arr, target):\n    # TODO: Use two pointers on sorted array\n    left, right = 0, len(arr) - 1\n    while left < right:\n        total = arr[left] + arr[right]\n        if total == target:\n            return [arr[left], arr[right]]\n        elif total < target:\n            left += 1\n        else:\n            right -= 1\n    return []`,
    testCases: [
      { input: "[1, 2, 3, 4, 5], 7", expectedOutput: "[2, 5]", label: "pair_sum([1,2,3,4,5], 7) → [2,5]" },
      { input: "[1, 3, 5, 7], 10", expectedOutput: "[3, 7]", label: "pair_sum([1,3,5,7], 10) → [3,7]" },
      { input: "[1, 2, 3], 10", expectedOutput: "[]", label: "pair_sum([1,2,3], 10) → []" },
      { input: "[1, 5], 6", expectedOutput: "[1, 5]", label: "pair_sum([1,5], 6) → [1,5]" },
    ],
    sabotageTargets: ["line 4: change < to <=", "line 9: change += 1 to -= 1"],
    sabotageTasks: [
      { id: "tp-loop", description: "Create an infinite loop condition", hint: "Change < to <=", targetLine: 4 },
      { id: "tp-direction", description: "Reverse a pointer direction", hint: "Change left += 1 to left -= 1", targetLine: 9 },
    ],
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    category: "string-manipulation",
    difficulty: "easy",
    description: "Write a function that reverses a string without using the built-in reverse or [::-1].",
    starterCode: `def reverse_string(s):\n    # TODO: Reverse the string manually\n    result = ""\n    for char in s:\n        result = char + result\n    return result`,
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"', label: 'reverse_string("hello") → "olleh"' },
      { input: '"ab"', expectedOutput: '"ba"', label: 'reverse_string("ab") → "ba"' },
      { input: '""', expectedOutput: '""', label: 'reverse_string("") → ""' },
      { input: '"a"', expectedOutput: '"a"', label: 'reverse_string("a") → "a"' },
    ],
    sabotageTargets: ["line 5: change char + result to result + char"],
    sabotageTasks: [
      { id: "rev-order", description: "Swap the concatenation order", hint: "Change char + result to result + char", targetLine: 5 },
      { id: "rev-init", description: "Corrupt the initial value", hint: "Start result as a space instead of empty", targetLine: 3 },
    ],
  },
  {
    id: "palindrome-check",
    title: "Palindrome Check",
    category: "string-manipulation",
    difficulty: "easy",
    description: "Write a function that returns True if a string is a palindrome (ignoring case and non-alphanumeric characters).",
    starterCode: `def is_palindrome(s):\n    # TODO: Check if string is a palindrome\n    cleaned = ''.join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]`,
    testCases: [
      { input: '"racecar"', expectedOutput: "True", label: 'is_palindrome("racecar") → True' },
      { input: '"A man a plan a canal Panama"', expectedOutput: "True", label: 'is_palindrome("A man a plan...") → True' },
      { input: '"hello"', expectedOutput: "False", label: 'is_palindrome("hello") → False' },
      { input: '"Was it a car or a cat I saw"', expectedOutput: "True", label: 'is_palindrome("Was it a car...") → True' },
    ],
    sabotageTargets: ["line 3: remove .lower()", "line 4: change [::-1] to [::1]"],
    sabotageTasks: [
      { id: "pal-case", description: "Break case-insensitive comparison", hint: "Remove .lower()", targetLine: 3 },
      { id: "pal-slice", description: "Break the reversal slice", hint: "Change [::-1] to [::1]", targetLine: 4 },
    ],
  },
  {
    id: "anagram-check",
    title: "Anagram Checker",
    category: "string-manipulation",
    difficulty: "medium",
    description: "Write a function that checks if two strings are anagrams of each other (ignoring case and spaces).",
    starterCode: `def is_anagram(s1, s2):\n    # TODO: Check if s1 and s2 are anagrams\n    clean1 = s1.replace(' ', '').lower()\n    clean2 = s2.replace(' ', '').lower()\n    return sorted(clean1) == sorted(clean2)`,
    testCases: [
      { input: '"listen", "silent"', expectedOutput: "True", label: 'is_anagram("listen","silent") → True' },
      { input: '"hello", "world"', expectedOutput: "False", label: 'is_anagram("hello","world") → False' },
      { input: '"Astronomer", "Moon starer"', expectedOutput: "True", label: 'is_anagram("Astronomer","Moon starer") → True' },
      { input: '"abc", "abcd"', expectedOutput: "False", label: 'is_anagram("abc","abcd") → False' },
    ],
    sabotageTargets: ["line 3: remove .lower()", "line 5: change == to !="],
    sabotageTasks: [
      { id: "ana-case", description: "Break case handling on one string", hint: "Remove .lower() from clean1 only", targetLine: 3 },
      { id: "ana-cmp", description: "Invert the final comparison", hint: "Change == to !=", targetLine: 5 },
    ],
  },
  {
    id: "two-sum",
    title: "Two Sum",
    category: "data-structures",
    difficulty: "medium",
    description: "Given a list of numbers and a target, return the indices of two numbers that add up to the target.",
    starterCode: `def two_sum(nums, target):\n    # TODO: Find two indices that add to target\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []`,
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0, 1]", label: "two_sum([2,7,11,15], 9) → [0,1]" },
      { input: "[3,2,4], 6", expectedOutput: "[1, 2]", label: "two_sum([3,2,4], 6) → [1,2]" },
      { input: "[1,5,3,7], 8", expectedOutput: "[1, 2]", label: "two_sum([1,5,3,7], 8) → [1,2]" },
    ],
    sabotageTargets: ["line 5: change target - num to target + num", "line 7: swap the return order"],
    sabotageTasks: [
      { id: "ts-complement", description: "Break the complement calculation", hint: "Change target - num to target + num", targetLine: 5 },
      { id: "ts-store", description: "Store the wrong key in the hashmap", hint: "Change seen[num] = i to seen[i] = num", targetLine: 8 },
    ],
  },
  {
    id: "flatten-list",
    title: "Flatten Nested List",
    category: "data-structures",
    difficulty: "medium",
    description: "Write a function that flattens a nested list into a single flat list.",
    starterCode: `def flatten(lst):\n    # TODO: Flatten nested lists recursively\n    result = []\n    for item in lst:\n        if isinstance(item, list):\n            result.extend(flatten(item))\n        else:\n            result.append(item)\n    return result`,
    testCases: [
      { input: "[[1, 2], [3, [4, 5]], 6]", expectedOutput: "[1, 2, 3, 4, 5, 6]", label: "flatten([[1,2],[3,[4,5]],6]) → [1,2,3,4,5,6]" },
      { input: "[1, [2, [3, [4]]]]", expectedOutput: "[1, 2, 3, 4]", label: "flatten([1,[2,[3,[4]]]]) → [1,2,3,4]" },
      { input: "[1, 2, 3]", expectedOutput: "[1, 2, 3]", label: "flatten([1,2,3]) → [1,2,3]" },
    ],
    sabotageTargets: ["line 6: change extend to append"],
    sabotageTasks: [
      { id: "flat-extend", description: "Use the wrong list method", hint: "Change extend to append", targetLine: 6 },
      { id: "flat-check", description: "Break the type check", hint: "Change isinstance(item, list) to type(item) == list", targetLine: 5 },
    ],
  },
  {
    id: "stack-min",
    title: "Min Stack",
    category: "data-structures",
    difficulty: "hard",
    description: "Implement a MinStack class with push, pop, top, and get_min methods. get_min must be O(1).",
    starterCode: `class MinStack:\n    def __init__(self):\n        # TODO: Initialize the stack\n        self.stack = []\n        self.min_stack = []\n\n    def push(self, val):\n        self.stack.append(val)\n        if not self.min_stack or val <= self.min_stack[-1]:\n            self.min_stack.append(val)\n\n    def pop(self):\n        val = self.stack.pop()\n        if val == self.min_stack[-1]:\n            self.min_stack.pop()\n\n    def top(self):\n        return self.stack[-1]\n\n    def get_min(self):\n        return self.min_stack[-1]`,
    testCases: [
      { input: "push(3), push(1), push(2), get_min()", expectedOutput: "1", label: "push 3,1,2 → get_min() → 1" },
      { input: "push(3), push(1), pop(), get_min()", expectedOutput: "3", label: "push 3,1, pop → get_min() → 3" },
    ],
    sabotageTargets: ["line 9: change <= to <", "line 14: remove the min_stack pop"],
    sabotageTasks: [
      { id: "ms-cmp", description: "Break the min-stack push condition", hint: "Change <= to <", targetLine: 9 },
      { id: "ms-pop", description: "Prevent min tracking on pop", hint: "Remove the min_stack.pop()", targetLine: 14 },
    ],
  },
  {
    id: "animal-speak",
    title: "Animal Speak",
    category: "oop-basics",
    difficulty: "easy",
    description: 'Create an Animal base class with a speak() method. Dog returns "Woof", Cat returns "Meow". Each also has a name property.',
    starterCode: `class Animal:\n    def __init__(self, name):\n        # TODO: Store the name\n        self.name = name\n\n    def speak(self):\n        raise NotImplementedError\n\nclass Dog(Animal):\n    def speak(self):\n        return "Woof"\n\nclass Cat(Animal):\n    def speak(self):\n        return "Meow"`,
    testCases: [
      { input: 'Dog("Rex").speak()', expectedOutput: '"Woof"', label: 'Dog("Rex").speak() → "Woof"' },
      { input: 'Cat("Mimi").speak()', expectedOutput: '"Meow"', label: 'Cat("Mimi").speak() → "Meow"' },
      { input: 'Dog("Rex").name', expectedOutput: '"Rex"', label: 'Dog("Rex").name → "Rex"' },
    ],
    sabotageTargets: ["line 11: change 'Woof' to 'Bark'", "line 4: change self.name to self._name"],
    sabotageTasks: [
      { id: "animal-return", description: "Change a return value subtly", hint: "Change 'Woof' to 'Bark'", targetLine: 11 },
      { id: "animal-attr", description: "Break the name attribute", hint: "Change self.name to self._name", targetLine: 4 },
    ],
  },
  {
    id: "shape-area",
    title: "Shape Area — Inheritance",
    category: "oop-basics",
    difficulty: "medium",
    description: "Create a Shape base class, then Rectangle and Circle subclasses. Each must implement an area() method.",
    starterCode: `import math\n\nclass Shape:\n    def area(self):\n        raise NotImplementedError\n\nclass Rectangle(Shape):\n    def __init__(self, width, height):\n        self.width = width\n        self.height = height\n\n    def area(self):\n        return self.width * self.height\n\nclass Circle(Shape):\n    def __init__(self, radius):\n        self.radius = radius\n\n    def area(self):\n        return math.pi * self.radius ** 2`,
    testCases: [
      { input: "Rectangle(3, 4).area()", expectedOutput: "12", label: "Rectangle(3,4).area() → 12" },
      { input: "Rectangle(5, 5).area()", expectedOutput: "25", label: "Rectangle(5,5).area() → 25" },
      { input: "round(Circle(1).area(), 5)", expectedOutput: "3.14159", label: "Circle(1).area() → 3.14159" },
      { input: "round(Circle(3).area(), 4)", expectedOutput: "28.2743", label: "Circle(3).area() → 28.2743" },
    ],
    sabotageTargets: ["line 13: change * to +", "line 20: change ** 2 to * 2"],
    sabotageTasks: [
      { id: "shape-op", description: "Change the Rectangle area operator", hint: "Change * to +", targetLine: 13 },
      { id: "shape-pow", description: "Break the Circle area formula", hint: "Change ** 2 to * 2", targetLine: 20 },
    ],
  },
];

// ── Helper Utilities ───────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `VOID-${code}`;
}

function pickChallenge(
  settings: LobbySettings,
  challenges: Challenge[]
): Challenge {
  let pool = challenges.filter(
    (c) => c.category === settings.category && c.difficulty === settings.difficulty
  );
  if (pool.length === 0) {
    pool = challenges.filter((c) => c.category === settings.category);
  }
  if (pool.length === 0) {
    pool = challenges.filter((c) => c.difficulty === settings.difficulty);
  }
  if (pool.length === 0) {
    pool = challenges;
  }
  // Cryptographically fair selection
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return pool[bytes[0] % pool.length];
}

/**
 * Cryptographically fair role assignment using crypto.getRandomValues.
 *
 * 3 players: 1 Saboteur, 2 Crew
 * 4 players: 1 Saboteur, 3 Crew
 * 5 players: 1 Saboteur, 4 Crew (or 2 Saboteurs for hard mode)
 */
function assignRoles(
  playerIds: string[],
  hardMode: boolean
): Record<string, Role> {
  const count = playerIds.length;
  const saboteurCount = count === 5 && hardMode ? 2 : 1;

  // Fisher-Yates shuffle with crypto randomness to pick saboteur indices
  const indices = playerIds.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const j = bytes[0] % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const roles: Record<string, Role> = {};
  for (let i = 0; i < playerIds.length; i++) {
    const originalIndex = indices[i];
    roles[playerIds[originalIndex]] =
      i < saboteurCount ? Role.Saboteur : Role.Crew;
  }
  return roles;
}

const DEFAULT_SETTINGS: LobbySettings = {
  category: "algorithms",
  difficulty: "easy",
};

// ── PartyKit Server ────────────────────────────────────
//
// State machine:
//   LOBBY → ROLE_REVEAL → CODING → MEETING → VOTING → RESULTS
//                           ↑         │
//                           └─────────┘ (back to CODING if no ejection)
//

// Cursor colors for collaborative editing
const CURSOR_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff", "#ff9500"];

export default class VoidProtocolServer implements Party.Server {
  private state: GameState;
  private roundTimer: ReturnType<typeof setInterval> | null = null;
  private meetingTimer: ReturnType<typeof setInterval> | null = null;
  private votingTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;
  private roleRevealTimer: ReturnType<typeof setTimeout> | null = null;
  private ejectionTimer: ReturnType<typeof setTimeout> | null = null;
  private cursorPositions: Map<string, CursorPosition> = new Map();
  private cursorBroadcastTimer: ReturnType<typeof setInterval> | null = null;

  // Edit attribution: tracks who last edited each line
  private editHistory: EditHistory = {};
  private previousCode: string = "";

  // Sabotage tasks: per-saboteur tracking
  private sabotageTasks: Map<string, SabotageTask[]> = new Map();

  // Chat message counter for IDs
  private chatMessageCounter: number = 0;

  // Vote history across rounds for results screen
  private voteHistory: RoundVoteRecord[] = [];

  readonly room: Party.Room;

  constructor(room: Party.Room) {
    this.room = room;
    this.state = this.createInitialState();
  }

  /** Derive the display room code from the PartyKit room ID.
   *  Client connects with room "void-abcd" → we display "VOID-ABCD". */
  private getRoomCode(): string {
    return this.room.id.toUpperCase();
  }

  private createInitialState(): GameState {
    return {
      roomCode: this.getRoomCode(),
      players: [],
      phase: GamePhase.Lobby,
      code: "",
      votes: {},
      roles: {},
      currentChallenge: null,
      roundNumber: 0,
      meetingCaller: null,
      timeRemaining: 0,
      winner: null,
      settings: { ...DEFAULT_SETTINGS },
      allTestsPassed: false,
      voteCount: 0,
    };
  }

  // ── Connection Lifecycle ─────────────────────────────

  onConnect(conn: Party.Connection) {
    const existingPlayer = this.state.players.find((p) => p.id === conn.id);
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      this.broadcastState();
    }
  }

  onClose(conn: Party.Connection) {
    const player = this.state.players.find((p) => p.id === conn.id);
    if (player) {
      player.isConnected = false;

      if (this.state.phase === GamePhase.Lobby) {
        this.state.players = this.state.players.filter((p) => p.id !== conn.id);

        if (player.isHost && this.state.players.length > 0) {
          this.state.players[0].isHost = true;
        }
      }

      this.broadcastState();

      this.room.broadcast(
        JSON.stringify({
          type: MessageType.PLAYER_LEFT,
          playerId: conn.id,
        })
      );

      // Reset if all players disconnect mid-game
      if (
        this.state.phase !== GamePhase.Lobby &&
        this.state.players.every((p) => !p.isConnected)
      ) {
        this.resetGame();
      }
    }
  }

  onError(conn: Party.Connection, error: Error) {
    console.error(`Connection error for ${conn.id}:`, error.message);
  }

  // ── Message Handler ──────────────────────────────────

  onMessage(message: string, sender: Party.Connection) {
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message) as ClientMessage;
    } catch {
      this.sendError(sender, "Invalid message format");
      return;
    }

    switch (parsed.type) {
      case MessageType.JOIN:
        this.handleJoin(sender, parsed.playerName, parsed.avatar);
        break;
      case MessageType.LEAVE:
        this.handleLeave(sender);
        break;
      case MessageType.START_GAME:
        this.handleStartGame(sender);
        break;
      case MessageType.CODE_UPDATE:
        this.handleCodeUpdate(sender, parsed.code);
        break;
      case MessageType.CALL_MEETING:
        this.handleCallMeeting(sender);
        break;
      case MessageType.VOTE:
        this.handleVote(sender, parsed.targetId);
        break;
      case MessageType.TOGGLE_READY:
        this.handleToggleReady(sender);
        break;
      case MessageType.CHANGE_SETTINGS:
        this.handleChangeSettings(sender, parsed.settings);
        break;
      case MessageType.TEST_RESULTS:
        this.handleTestResults(sender, parsed.allPassed);
        break;
      case MessageType.CURSOR_UPDATE:
        this.handleCursorUpdate(sender, parsed);
        break;
      case MessageType.CHAT_MESSAGE:
        this.handleChatMessage(sender, parsed.text);
        break;
      case MessageType.PLAY_AGAIN:
        this.handlePlayAgain();
        break;
      default:
        this.sendError(sender, "Unknown message type");
    }
  }

  // ── Action Handlers ──────────────────────────────────

  private handleJoin(conn: Party.Connection, playerName: string, avatar: string) {
    if (this.state.phase !== GamePhase.Lobby) {
      const existing = this.state.players.find((p) => p.id === conn.id);
      if (existing) {
        existing.isConnected = true;
        this.sendState(conn);
        const role = this.state.roles[conn.id];
        if (role) {
          conn.send(JSON.stringify({ type: MessageType.ROLE_ASSIGNED, role }));
          // Resend sabotage tasks if saboteur
          const tasks = this.sabotageTasks.get(conn.id);
          if (role === Role.Saboteur && tasks) {
            conn.send(JSON.stringify({ type: MessageType.SABOTAGE_TASKS, tasks }));
          }
        }
        this.broadcastState();
        return;
      }
      this.sendError(conn, "Game already in progress");
      return;
    }

    if (this.state.players.length >= MAX_PLAYERS) {
      this.sendError(conn, "Room is full");
      return;
    }

    if (this.state.players.some((p) => p.id === conn.id)) {
      this.sendError(conn, "Already in room");
      return;
    }

    const player: Player = {
      id: conn.id,
      name: playerName.slice(0, 16),
      avatar,
      isHost: this.state.players.length === 0,
      isAlive: true,
      isConnected: true,
      isReady: false,
    };

    this.state.players.push(player);

    this.room.broadcast(
      JSON.stringify({
        type: MessageType.PLAYER_JOINED,
        player,
      })
    );

    this.broadcastState();
  }

  private handleLeave(conn: Party.Connection) {
    this.state.players = this.state.players.filter((p) => p.id !== conn.id);

    if (this.state.players.length > 0 && !this.state.players.some((p) => p.isHost)) {
      this.state.players[0].isHost = true;
    }

    this.room.broadcast(
      JSON.stringify({
        type: MessageType.PLAYER_LEFT,
        playerId: conn.id,
      })
    );

    this.broadcastState();
  }

  private handleToggleReady(conn: Party.Connection) {
    if (this.state.phase !== GamePhase.Lobby) return;

    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player) return;

    player.isReady = !player.isReady;
    this.broadcastState();
  }

  private handleChangeSettings(conn: Party.Connection, settings: LobbySettings) {
    if (this.state.phase !== GamePhase.Lobby) return;

    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player?.isHost) {
      this.sendError(conn, "Only the host can change settings");
      return;
    }

    this.state.settings = settings;

    this.room.broadcast(
      JSON.stringify({
        type: MessageType.SETTINGS_CHANGED,
        settings,
      })
    );

    this.broadcastState();
  }

  // ── LOBBY → COUNTDOWN → ROLE_REVEAL ─────────────────

  private handleStartGame(conn: Party.Connection) {
    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player?.isHost) {
      this.sendError(conn, "Only the host can start the game");
      return;
    }

    if (this.state.players.length < MIN_PLAYERS) {
      this.sendError(conn, `Need at least ${MIN_PLAYERS} players to start`);
      return;
    }

    this.startCountdown();
  }

  private startCountdown() {
    let count = COUNTDOWN_SECONDS;

    const tick = () => {
      this.room.broadcast(
        JSON.stringify({ type: MessageType.COUNTDOWN, count })
      );

      if (count > 0) {
        count--;
        this.countdownTimer = setTimeout(tick, 1000);
      } else {
        // Countdown done — assign roles and enter role reveal
        this.enterRoleReveal();
      }
    };

    tick();
  }

  // ── ROLE_REVEAL phase ────────────────────────────────

  private enterRoleReveal() {
    const playerIds = this.state.players.map((p) => p.id);
    const hardMode = this.state.settings.difficulty === "hard";
    this.state.roles = assignRoles(playerIds, hardMode);

    this.state.currentChallenge = pickChallenge(this.state.settings, CHALLENGES);
    this.state.code = this.state.currentChallenge.starterCode;
    this.state.phase = GamePhase.RoleReveal;
    this.state.roundNumber = 1;
    this.state.timeRemaining = ROLE_REVEAL_SECONDS;
    this.state.winner = null;
    this.state.allTestsPassed = false;

    // Reset edit tracking
    this.editHistory = {};
    this.previousCode = this.state.code;
    this.voteHistory = [];
    this.sabotageTasks.clear();

    // Reset ready states
    for (const p of this.state.players) {
      p.isReady = false;
      p.isAlive = true;
    }

    // Generate sabotage tasks from challenge definitions
    const challengeTasks = this.state.currentChallenge?.sabotageTasks ?? [];

    // Send each player their role privately + sabotage tasks for saboteurs
    for (const p of this.state.players) {
      const connection = this.room.getConnection(p.id);
      if (!connection) continue;

      const role = this.state.roles[p.id];
      connection.send(
        JSON.stringify({ type: MessageType.ROLE_ASSIGNED, role })
      );

      // Send sabotage tasks only to saboteurs
      if (role === Role.Saboteur && challengeTasks.length > 0) {
        // Pick 2-3 tasks for this saboteur
        const taskCount = Math.min(challengeTasks.length, Math.random() < 0.5 ? 2 : 3);
        const shuffled = [...challengeTasks].sort(() => Math.random() - 0.5);
        const tasks: SabotageTask[] = shuffled.slice(0, taskCount).map((t) => ({
          id: t.id,
          description: t.description,
          hint: t.hint,
          targetLine: t.targetLine,
          completed: false,
        }));
        this.sabotageTasks.set(p.id, tasks);

        connection.send(
          JSON.stringify({ type: MessageType.SABOTAGE_TASKS, tasks })
        );
      }
    }

    this.broadcastState();

    // Auto-advance to CODING after 5 seconds
    this.roleRevealTimer = setTimeout(() => {
      this.enterCodingPhase();
    }, ROLE_REVEAL_SECONDS * 1000);
  }

  // ── CODING phase ─────────────────────────────────────

  private enterCodingPhase() {
    this.state.phase = GamePhase.Playing;
    this.state.timeRemaining = ROUND_DURATION_SECONDS;
    this.previousCode = this.state.code;

    this.room.broadcast(
      JSON.stringify({ type: MessageType.PHASE_CHANGE, phase: GamePhase.Playing })
    );

    this.broadcastState();
    this.startRoundTimer();
    this.startCursorBroadcast();
  }

  private handleCodeUpdate(conn: Party.Connection, code: string) {
    if (this.state.phase !== GamePhase.Playing) return;

    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player) return;

    // Diff old vs new code to find which lines changed
    const oldLines = this.previousCode.split("\n");
    const newLines = code.split("\n");
    const now = Date.now();

    for (let i = 0; i < newLines.length; i++) {
      if (oldLines[i] !== newLines[i]) {
        const lineNum = i + 1; // 1-based
        const existing = this.editHistory[lineNum];
        this.editHistory[lineNum] = {
          playerId: conn.id,
          playerName: player.name,
          timestamp: now,
          editCount: (existing?.editCount ?? 0) + 1,
        };
      }
    }

    this.previousCode = code;
    this.state.code = code;
    this.broadcastState();
  }

  private handleTestResults(_conn: Party.Connection, allPassed: boolean) {
    if (this.state.phase !== GamePhase.Playing) return;

    this.state.allTestsPassed = allPassed;

    if (allPassed) {
      const result = checkWinCondition(
        this.state.players,
        this.state.roles,
        true,
        false
      );
      if (result) {
        this.endGame(result.winner, result.reason);
      }
    }
  }

  // ── Chat ─────────────────────────────────────────────

  private handleChatMessage(conn: Party.Connection, text: string) {
    // Only allow chat during meeting (discussion) phase
    if (this.state.phase !== GamePhase.Meeting) return;

    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player?.isAlive) return;

    const sanitizedText = text.slice(0, 200).trim();
    if (!sanitizedText) return;

    this.chatMessageCounter++;

    const chatMsg: ChatMessage = {
      id: `msg-${this.chatMessageCounter}`,
      playerId: conn.id,
      playerName: player.name,
      avatar: player.avatar,
      text: sanitizedText,
      timestamp: Date.now(),
    };

    this.room.broadcast(
      JSON.stringify({
        type: MessageType.CHAT_BROADCAST,
        message: chatMsg,
      })
    );
  }

  // ── Cursor Sync ──────────────────────────────────────

  private handleCursorUpdate(
    conn: Party.Connection,
    msg: { playerId: string; playerName: string; lineNumber: number; column: number }
  ) {
    if (this.state.phase !== GamePhase.Playing) return;

    const playerIndex = this.state.players.findIndex((p) => p.id === conn.id);
    const color = CURSOR_COLORS[playerIndex % CURSOR_COLORS.length];

    this.cursorPositions.set(conn.id, {
      playerId: msg.playerId,
      playerName: msg.playerName,
      lineNumber: msg.lineNumber,
      column: msg.column,
      color,
    });
  }

  private startCursorBroadcast() {
    this.cursorPositions.clear();
    this.cursorBroadcastTimer = setInterval(() => {
      if (this.cursorPositions.size === 0) return;
      const cursors = Array.from(this.cursorPositions.values());
      this.room.broadcast(
        JSON.stringify({ type: MessageType.CURSOR_BROADCAST, cursors })
      );
    }, 200);
  }

  private stopCursorBroadcast() {
    if (this.cursorBroadcastTimer) {
      clearInterval(this.cursorBroadcastTimer);
      this.cursorBroadcastTimer = null;
    }
    this.cursorPositions.clear();
  }

  // ── MEETING phase (discussion only, no voting) ──────

  private handleCallMeeting(conn: Party.Connection) {
    if (this.state.phase !== GamePhase.Playing) return;

    const caller = this.state.players.find((p) => p.id === conn.id);
    if (!caller?.isAlive) return;

    this.clearTimers();
    this.stopCursorBroadcast();

    this.state.phase = GamePhase.Meeting;
    this.state.meetingCaller = conn.id;
    this.state.votes = {};
    this.state.timeRemaining = MEETING_DURATION_SECONDS;

    this.room.broadcast(
      JSON.stringify({
        type: MessageType.MEETING_CALLED,
        callerId: conn.id,
        callerName: caller.name,
      })
    );

    // Send edit history to all players for deduction
    this.room.broadcast(
      JSON.stringify({
        type: MessageType.EDIT_HISTORY_SYNC,
        editHistory: this.editHistory,
      })
    );

    this.broadcastState();
    this.startMeetingTimer();
  }

  // ── VOTING phase ─────────────────────────────────────

  private enterVotingPhase() {
    this.clearTimers();

    this.state.phase = GamePhase.Voting;
    this.state.timeRemaining = VOTING_DURATION_SECONDS;
    this.state.votes = {};
    this.state.voteCount = 0;

    this.room.broadcast(
      JSON.stringify({ type: MessageType.PHASE_CHANGE, phase: GamePhase.Voting })
    );

    this.broadcastState();
    this.startVotingTimer();
  }

  private handleVote(conn: Party.Connection, targetId: string) {
    if (this.state.phase !== GamePhase.Voting) return;

    const voter = this.state.players.find((p) => p.id === conn.id);
    if (!voter?.isAlive) return;

    // Prevent double voting
    if (this.state.votes[conn.id] !== undefined) return;

    this.state.votes[conn.id] = targetId;
    this.state.voteCount = Object.keys(this.state.votes).length;

    // Broadcast state with redacted votes (broadcastState handles this)
    this.broadcastState();

    const alivePlayers = this.state.players.filter((p) => p.isAlive);
    const allVoted = alivePlayers.every((p) => this.state.votes[p.id] !== undefined);

    if (allVoted) {
      this.resolveVotes();
    }
  }

  // ── Vote Resolution ──────────────────────────────────

  private resolveVotes() {
    this.clearTimers();

    const voteCounts: Record<string, number> = {};
    for (const targetId of Object.values(this.state.votes)) {
      if (targetId === "__SKIP__") continue;
      voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
    }

    let maxVotes = 0;
    let ejectedId: string | null = null;
    let isTie = false;

    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        ejectedId = playerId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    // Tie or all skips → no ejection
    if (isTie || maxVotes === 0) {
      ejectedId = null;
    }

    let wasEjected = false;
    let wasSaboteur = false;

    if (ejectedId) {
      const ejectedPlayer = this.state.players.find((p) => p.id === ejectedId);
      if (ejectedPlayer) {
        ejectedPlayer.isAlive = false;
        wasEjected = true;
        wasSaboteur = this.state.roles[ejectedId] === Role.Saboteur;
      }
    }

    const result: VoteResult = {
      playerId: ejectedId ?? "",
      playerName:
        this.state.players.find((p) => p.id === ejectedId)?.name ?? "No one",
      votes: maxVotes,
      wasEjected,
      wasSaboteur,
    };

    // Accumulate vote history for results screen
    this.voteHistory.push({
      round: this.state.roundNumber,
      votes: { ...this.state.votes },
      result,
    });

    // Reveal all votes to all players
    this.room.broadcast(
      JSON.stringify({
        type: MessageType.VOTE_REVEAL,
        votes: this.state.votes,
        result,
      })
    );

    // Also send the old VOTE_RESULT for backward compat
    this.room.broadcast(JSON.stringify({ type: MessageType.VOTE_RESULT, result }));

    // Enter ejection phase — show vote results + ejection animation
    this.state.phase = GamePhase.Ejection;
    this.state.timeRemaining = EJECTION_DURATION_SECONDS;
    this.broadcastState();

    // After ejection animation, check win conditions and transition
    this.ejectionTimer = setTimeout(() => {
      const winResult = checkWinCondition(
        this.state.players,
        this.state.roles,
        this.state.allTestsPassed,
        false
      );

      if (winResult) {
        this.endGame(winResult.winner, winResult.reason);
        return;
      }

      // No winner → back to CODING
      this.state.roundNumber++;
      this.returnToCoding();
    }, EJECTION_DURATION_SECONDS * 1000);
  }

  private returnToCoding() {
    this.state.phase = GamePhase.Playing;
    this.state.votes = {};
    this.state.voteCount = 0;
    this.state.meetingCaller = null;
    this.state.timeRemaining = ROUND_DURATION_SECONDS;
    this.previousCode = this.state.code;
    this.chatMessageCounter = 0;

    this.room.broadcast(
      JSON.stringify({ type: MessageType.PHASE_CHANGE, phase: GamePhase.Playing })
    );

    this.broadcastState();
    this.startRoundTimer();
    this.startCursorBroadcast();
  }

  // ── Game End & Reset ─────────────────────────────────

  private endGame(winner: "crew" | "saboteur", reason: WinReason) {
    this.clearTimers();
    this.stopCursorBroadcast();
    this.state.phase = GamePhase.Results;
    this.state.winner = winner;

    this.room.broadcast(
      JSON.stringify({
        type: MessageType.GAME_OVER,
        winner,
        roles: this.state.roles,
        reason,
        voteHistory: this.voteHistory,
        editHistory: this.editHistory,
      })
    );

    this.broadcastState();
  }

  private resetGame() {
    this.clearTimers();
    this.stopCursorBroadcast();
    this.state = this.createInitialState();
    this.voteHistory = [];
    this.editHistory = {};
  }

  private handlePlayAgain() {
    if (this.state.phase !== GamePhase.Results) return;

    this.clearTimers();
    this.stopCursorBroadcast();

    const players = this.state.players.map((p) => ({
      ...p,
      isAlive: true,
      isReady: false,
    }));

    this.state = this.createInitialState();
    this.state.players = players;
    this.editHistory = {};
    this.voteHistory = [];
    this.sabotageTasks.clear();
    this.chatMessageCounter = 0;

    this.room.broadcast(
      JSON.stringify({ type: MessageType.PLAY_AGAIN_ACK })
    );
    this.broadcastState();
  }

  // ── Timers ───────────────────────────────────────────

  private startRoundTimer() {
    this.roundTimer = setInterval(() => {
      this.state.timeRemaining--;

      if (this.state.timeRemaining <= 0) {
        // Timer expired — saboteur wins if tests still failing
        const winResult = checkWinCondition(
          this.state.players,
          this.state.roles,
          this.state.allTestsPassed,
          true
        );
        if (winResult) {
          this.endGame(winResult.winner, winResult.reason);
        } else {
          // Edge case: tests passed at the buzzer
          this.endGame("saboteur", "timer_expired");
        }
      } else if (this.state.timeRemaining % 5 === 0) {
        // Sync timer to clients every 5 seconds
        this.room.broadcast(
          JSON.stringify({
            type: MessageType.TIMER_SYNC,
            timeRemaining: this.state.timeRemaining,
            phase: this.state.phase,
          })
        );
        this.broadcastState();
      }
    }, 1000);
  }

  private startMeetingTimer() {
    this.meetingTimer = setInterval(() => {
      this.state.timeRemaining--;

      if (this.state.timeRemaining <= 0) {
        // Discussion over — move to voting
        this.enterVotingPhase();
      } else if (this.state.timeRemaining % 5 === 0) {
        this.room.broadcast(
          JSON.stringify({
            type: MessageType.TIMER_SYNC,
            timeRemaining: this.state.timeRemaining,
            phase: this.state.phase,
          })
        );
        this.broadcastState();
      }
    }, 1000);
  }

  private startVotingTimer() {
    this.votingTimer = setInterval(() => {
      this.state.timeRemaining--;

      if (this.state.timeRemaining <= 0) {
        // Time's up — resolve whatever votes are in
        this.resolveVotes();
      } else if (this.state.timeRemaining % 5 === 0) {
        this.room.broadcast(
          JSON.stringify({
            type: MessageType.TIMER_SYNC,
            timeRemaining: this.state.timeRemaining,
            phase: this.state.phase,
          })
        );
        this.broadcastState();
      }
    }, 1000);
  }

  private clearTimers() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.meetingTimer) {
      clearInterval(this.meetingTimer);
      this.meetingTimer = null;
    }
    if (this.votingTimer) {
      clearInterval(this.votingTimer);
      this.votingTimer = null;
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.roleRevealTimer) {
      clearTimeout(this.roleRevealTimer);
      this.roleRevealTimer = null;
    }
    if (this.ejectionTimer) {
      clearTimeout(this.ejectionTimer);
      this.ejectionTimer = null;
    }
  }

  // ── Broadcasting ─────────────────────────────────────

  private broadcastState() {
    const publicState: GameState = {
      ...this.state,
      roles: {},
      // Hide individual votes during voting — only reveal count
      votes: this.state.phase === GamePhase.Voting ? {} : this.state.votes,
      voteCount: Object.keys(this.state.votes).length,
    };
    this.room.broadcast(
      JSON.stringify({
        type: MessageType.GAME_STATE_SYNC,
        state: publicState,
      })
    );
  }

  private sendState(conn: Party.Connection) {
    const publicState: GameState = {
      ...this.state,
      roles: {},
      votes: this.state.phase === GamePhase.Voting ? {} : this.state.votes,
      voteCount: Object.keys(this.state.votes).length,
    };
    conn.send(
      JSON.stringify({
        type: MessageType.GAME_STATE_SYNC,
        state: publicState,
      })
    );
  }

  private sendError(conn: Party.Connection, message: string) {
    conn.send(JSON.stringify({ type: MessageType.ERROR, message }));
  }
}
