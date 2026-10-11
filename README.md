# Feel My Drawing

*One draws. One feels. Both connect.*  **DRAW → FEEL → GUESS → REWARD**

A two-player tactile drawing game for the **Dot Pad**. Player A draws a secret
prompt on a simulated Dot Pad; Player B — who may be blind — feels three
progressively detailed snapshots and guesses by voice and the Dot Pad’s buttons.

React · TypeScript · Tailwind CSS v4 · Framer Motion · Vite.

```bash
npm install && npm run dev     # http://localhost:5173
npm run build                  # static site in dist/ — deploys on Vercel as-is
```

Demo Mode works without hardware. Open `/?dev` for the developer panel (Dot Pad
preview, reset hearts, reset prize, sleep now) — hidden in normal play.

## Gameplay

**One experience. Two ways to draw.** One prompt for both
modes: *“A man is playing the guitar.”*

**Mode 1 — YOU DRAW, I FEEL.** Sighted player draws, blind player feels and
guesses. 30 s drawing (starts on *Ready*) → sent to the Dot Pad (the game waits
for the update) → handoff → one guess. Wrong? The artist gets **10 more seconds
on a blank board to draw the beats** as a clue → the beat clue is sent to the
Dot Pad; the guesser can switch between the clue (F3) and the first drawing
(F2) → one final guess. Instructions are spoken; there are no other hints.

**Mode 2 — I DRAW, YOU GUESS.** Blind player draws, sighted player guesses, on
one shared screen. The prompt is only spoken to the artist (the guesser looks
away), never shown. 90 s drawing with the existing input → the finished drawing
is shown (and sent to the Dot Pad) → one final guess.

> **Prototype limitation:** drawing input a blind person can use independently
> is not implemented. The keyboard pen (Tab to the board, arrows, Space) works
> without a mouse but gives no audio or tactile position feedback, so the
> artist may need support. The game says so on screen.

**Results → SWITCH ROLES** to the other mode, fresh drawing and timers. Stars:
right first time ★★★, right after the beat clue ★★, never ☆☆☆ (−1 heart).
Correct rounds win puzzle pieces.

**Answer checking** (`src/game/scene.ts`): an explicit accepted-answers list plus a
small rule (a guitar word and a playing/music word, or “guitarist”). No AI.

**Design principle:** *Preserve meaningful outlines, not every visual detail.*

**Research credit:** Inspired by tactile drawing research, including John M.
Kennedy (2014), “Tactile Drawing Aesthetics and a Blind Woman’s Drawings of
Sounds.”

## Tactile feedback (raised pins only)

The Dot Pad is treated as a refreshable pin display — no vibration is assumed.
Every update goes through `TactileQueue` (`src/dotpad/tactileQueue.ts`), which
sends one frame at a time (≥ 1 s apart on hardware) and cancels superseded
sequences, so commands never overlap. Patterns (`src/game/tactilePatterns.ts`):
★★★ expanding frames + tick, ★★ tick then diamonds, ★ tick, wrong = cross
twice, heart lost = heart then broken heart, heart restored = heart, game over
= skull in a double frame — each ending on a stars-and-hearts summary. Every
pattern has a sound and an on-screen mirror.

## Player B controls (Dot Pad X button row: ◀ F1 F2 F3 F4 ▶)

F1 speak a guess · F4 send (or say “yes”) · ◀ ▶ replay the hint. Handoffs:
F1 continues. On results: F1 feel the drawing, F2 feel stars & hearts, F4 continue. The
keyboard mirrors these (1/Space, 4/Enter, ← →) and the button picture is
clickable in Demo Mode. Keys come from the SDK’s documented `onKeyDown`
callback — run `python3 tools/listen-keys.py` to confirm them on your device.

## Look

Pixel art × Swiss × indie: *Press Start 2P* headings; body text in **Minion
Pro** if installed locally (Adobe-licensed, not shipped), otherwise **Crimson
Pro** (SIL OFL). Palette #F8F6EF · #171717 · #2454FF · #FF5148 · #FFD84D ·
#61C98B. Pixel frames, chunky buttons, animated pixel hearts and stars,
confetti, screen shake, pixel-wipe transitions; `prefers-reduced-motion` is
respected throughout.

## Code map

`src/game/` scene (prompt, hints, masks, answers, credit), modes, stars, hearts,
prize, round state, tactile patterns, speech · `src/dotpad/` adapter interface, mock, real (official Web SDK 3.0.3),
tactile queue · `src/screens/` Home, HowTo, Roles, ArtistFeel, FeelGuess, SoundDraw, Handoff,
Validation, Reward, OutOfHearts · `src/components/` PinBoard (drawing canvas),
PixelIcon, GameBits (hearts, stars, confetti, tactile mirror), DotPadButtons.
