# VOID PROTOCOL

> **Among Us meets LeetCode** — a real-time multiplayer social-deduction game where a crew of coders races to ship a working algorithm before a hidden **Saboteur** breaks it from the inside.

A group of players is trapped on a derelict space station. To escape, they must collaboratively solve a coding challenge in a shared editor. But one of them is a Saboteur, secretly planted to introduce bugs, mislead the crew, and make sure the code never runs. Everyone can edit. Everyone is a suspect. Trust no one.

---

## How it Plays

1. **Lobby** — Someone creates a mission and shares the room code. 3–8 players dock into the same station.
2. **Role Reveal** — One player is secretly assigned the **Saboteur**. Everyone else is **Crew**. Roles are shown only to you.
3. **Coding Phase** — A coding challenge appears. Everyone shares one editor. Crew try to write a correct solution. The Saboteur tries to sneak in subtle bugs without getting caught.
4. **Emergency Meeting** — Anyone can call a meeting. Players discuss in chat, review the edit history, and accuse each other.
5. **Voting** — Vote to eject a player, or skip. Majority decides.
6. **Ejection** — A dramatic airlock animation reveals the ejected player's role.
7. **Win Conditions**
   - **Crew wins** if the code passes all tests, or if the Saboteur is ejected.
   - **Saboteur wins** if the timer runs out, or if enough crew are ejected.
8. **Results** — Full reveal: roles, edit history per player, voting history, and a diff view highlighting every sabotage edit.

## Features

- **Real-time collaborative code editor** — shared cursor positions, character-level edit attribution
- **Edit history / heatmap** — see who touched which line, when, and how often
- **Server-authoritative state machine** — no client can cheat the phase or vote
- **Voting system** with live tallies and tie-break logic
- **Dramatic results screen** — phased reveal with particles, role flip cards, MVP badge, code diff
- **Visual polish** — canvas star field with parallax twinkling, shooting stars, nebula gradients, CRT scanlines, screen transitions
- **Sound design** — ambient hum, UI clicks, alarm, victory/defeat cues (with global mute)
- **Responsive** — mobile, tablet, desktop layouts
- **Accessible** — `prefers-reduced-motion`, focus rings, ARIA roles

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (custom Deep-Space theme) |
| Animation | Framer Motion + CSS keyframes + HTML canvas |
| State | Zustand |
| Multiplayer | [PartyKit](https://partykit.io) (WebSocket server) |
| Code Runner | Sandboxed JS evaluator with test cases |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Local Development

```bash
# 1. Install deps
npm install

# 2. Start the PartyKit dev server (terminal 1)
npx partykit dev

# 3. Start the Vite dev server (terminal 2)
npm run dev
```

Open http://localhost:5173 in **two tabs** to simulate two players. Create a mission in one tab and join with the room code from the other.

### Build

```bash
npm run build    # type-check + production bundle
npm run preview  # preview the production build locally
```

## Deployment

Void Protocol has two deployable pieces — **they must be deployed separately**.

### 1. Deploy the PartyKit server

```bash
npx partykit deploy
```

It prints a URL like `void-protocol.<username>.partykit.dev`. Copy it.

### 2. Deploy the frontend to Vercel (or Netlify / Cloudflare Pages)

- Import the repo in Vercel — it auto-detects Vite
- Add an environment variable:
  - **Key:** `VITE_PARTYKIT_HOST`
  - **Value:** `void-protocol.<username>.partykit.dev` *(no `https://`, no trailing slash)*
- Deploy

Without `VITE_PARTYKIT_HOST` set in production, the client falls back to localhost and multiplayer won't work.

## Project Structure

```
.
├── party/
│   ├── server.ts          # PartyKit room — game state machine, phases, voting, win conditions
│   └── winCondition.ts    # Pure win-check logic
├── src/
│   ├── components/
│   │   ├── screens/       # Landing, Lobby, RoleReveal, Game, Meeting, Ejection, Results
│   │   ├── editor/        # Shared code editor
│   │   ├── effects/       # StarField canvas, ScreenTransition
│   │   └── ui/            # Buttons, inputs, timer, chat, avatars, heatmap, mute
│   ├── stores/gameStore.ts  # Zustand — mirrors server state + dispatches messages
│   ├── hooks/usePartySocket.ts
│   ├── types/game.ts      # Shared message & state types (client ↔ server)
│   ├── data/challenges.ts # Coding challenge bank
│   ├── utils/
│   │   ├── codeRunner.ts  # Sandboxed JS execution with test harness
│   │   └── SoundManager.ts
│   └── index.css          # Tailwind theme + keyframe animations
└── partykit.json
```

## Game Design Notes

- **Server-authoritative**: the PartyKit room is the single source of truth for phase, roles, votes, and timers. Clients can only *request* transitions.
- **Edit attribution** is tracked per-character server-side so no client can forge whodunnit evidence.
- **Room codes** are derived directly from the PartyKit room ID, so the code players see is always the room they're actually in.
- **Win reasons** (saboteur ejected / tests passed / timer expired / crew eliminated) are surfaced to the client so the results screen can show a tailored reveal.

## Controls

- Any player can **call an emergency meeting** from the game screen
- **Mute toggle** in the corner (persists across sessions)
- Meeting chat auto-scrolls; edit history is always visible during meetings

## License

MIT

---

Built with paranoia and too much coffee.
