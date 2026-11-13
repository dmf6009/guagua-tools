## How to play Minesweeper

The board hides a fixed number of mines. Uncover every square that does **not** contain a mine and you win; uncover a mine and the game ends.

Each uncovered square shows a number: the count of mines in the eight squares touching it. A blank square has no mines around it, so the game opens its neighbours for you, which is why one click can clear a large area. Your first click is always safe, and in this version it always lands on a blank square so you get an opening to work from.

## Controls

| Action | Mouse | Touch | Keyboard |
|---|---|---|---|
| Uncover a square | Left click | Tap | <kbd>Enter</kbd> or <kbd>Space</kbd> |
| Place or remove a flag | Right click | Long press, or turn on Flag mode and tap | <kbd>F</kbd> |
| Open around a number (chord) | Click the number | Tap the number | <kbd>Enter</kbd> on the number |
| Move | — | — | Arrow keys |

**Chording** saves most of your clicks. When a number already has that many flags next to it, clicking the number opens all its other neighbours at once. If one of your flags is wrong, chording will set off a mine, so flag carefully.

The counter on the left shows mines minus flags. The timer starts on your first click, and your best time for each level is stored in this browser.

## Levels

| Level | Board | Mines | Mine density |
|---|---|---|---|
| Beginner | 9 × 9 | 10 | 12% |
| Intermediate | 16 × 16 | 40 | 16% |
| Expert | 30 × 16 | 99 | 21% |

These are the classic sizes. Density matters more than board size: at 21%, Expert boards contain many more situations that need careful counting.

## Basic logic

Two rules solve the majority of every board.

1. **If a number equals its count of unopened neighbours, they are all mines.** A `1` touching exactly one covered square has found its mine. Flag it.
2. **If a number already has that many flags, every other neighbour is safe.** Open them, or chord.

Apply the two rules back and forth: each flag makes some other number "satisfied", which opens squares, which reveals new numbers.

## Patterns worth memorising

Along a straight wall of covered squares, some number sequences always mean the same thing.

- **1-2-1**: the mines are under the two `1`s and the square under the `2` is safe.
- **1-2-2-1**: the mines are under the two `2`s and the squares under the `1`s are safe.
- **1-1 starting at an edge**: the third square along, beside the second `1`, is safe, because the first `1` already accounts for the mine shared by both.

These come from a more general idea: compare two neighbouring numbers. If one number's covered neighbours are a subset of the other's, the difference between the numbers tells you how many mines are in the leftover squares.

## When logic runs out

Minesweeper does not guarantee a solvable board. Sometimes two squares remain and the numbers give no way to tell which holds the mine. When you must guess:

- Prefer the guess that, if it succeeds, opens the most new information.
- Count remaining mines. Near the end, the counter often settles a position that the numbers alone cannot.
- An untouched square far from any number has roughly the board's average density, which is often safer than a 50/50 next to a number.
- If a guess is unavoidable and nothing can change the odds, take it early rather than after ten more minutes of work.

## Where it comes from

Mine-hunting grid games appeared on mainframes and home computers in the 1960s to 1980s. The version most people know was written by Robert Donner and Curt Johnson and shipped with Windows 3.1 in 1992, which is where the three classic board sizes became standard.
