## How to play FreeCell

FreeCell uses one 52-card deck, dealt **face up** into eight columns: the first four get seven cards, the other four get six. Nothing is hidden, so every game is a puzzle you can think through rather than a gamble on what lies underneath.

The goal is to move all 52 cards to the four **foundations** at the top right, one per suit, from Ace up to King.

You have three places to move a card:

- **Free cells.** The four spaces at the top left each hold any single card. They are your working room, and running out of them is how most games are lost.
- **Foundations.** A card goes up when the card below it in the same suit is already there.
- **Tableau.** Build down in alternating colours: a black 8 on a red 9, a red Jack on a black Queen. Any card can go into an empty column.

## Controls

**Tap or click a card** and it moves to the best legal spot: a foundation, then a column, then an empty column, then a free cell. **Drag** when you want to choose the destination yourself. Undo has no limit (<kbd>Ctrl</kbd>+<kbd>Z</kbd> works too), and Hint outlines a card worth moving.

Cards that can never be needed again in the tableau go to the foundations automatically. A card is sent up only once both foundations of the opposite colour have reached one rank below it, so the automatic move can never strand a card you might still want to build on.

## Moving several cards at once

The rules only allow one card to move at a time, but moving a run through free cells and empty columns is tedious, so the game does it for you when there is room. The largest run you can move is:

| Free cells empty | Empty columns | Cards you can move |
|---|---|---|
| 0 | 0 | 1 |
| 1 | 0 | 2 |
| 2 | 0 | 3 |
| 3 | 0 | 4 |
| 4 | 0 | 5 |
| 2 | 1 | 6 |
| 4 | 1 | 10 |
| 2 | 2 | 12 |

The formula is (empty free cells + 1) × 2 to the power of the empty columns. When the destination is itself an empty column, that column does not count. If a tap does nothing on a long run, this limit is usually why, and the game says so.

## Numbered deals

Every deal has a number from 1 to 1,000,000, shown above the table. The numbers use the same shuffle as the version of FreeCell that came with Windows, so deal #1 here is the same layout as deal #1 there. Type a number into **Deal #** to replay a deal, or share a link ending in `#` and the number so a friend can play the identical game.

Of the original 32,000 Windows deals, only one, **#11982**, is known to have no solution. Every other deal in that range can be won, which makes FreeCell unusual among patience games: a loss is almost always a mistake you can find.

## Strategy

- **Free the Aces and Twos early.** Look at where they are buried before the first move, and plan to dig towards them.
- **Treat free cells as a loan.** Each card you park is one less way out. Before filling the last cell, check that you have a way to empty one again.
- **An empty column is worth two free cells.** It doubles the length of run you can move. Clearing a short column is often the best move on the board.
- **Do not fill an empty column with one low card** unless it unlocks something immediately. Save it for a long run or a King.
- **Build long runs.** A tidy descending run is easy to move later; scattered single cards are not.
- **Use undo to look ahead.** Since nothing is hidden, trying a line and taking it back costs nothing and teaches you how the deal is structured.

## A short history

Paul Alfille wrote the first computer version of FreeCell in 1978 on the PLATO educational system at the University of Illinois. A later version by Jim Horne was distributed with Microsoft Windows in the 1990s, and its numbered deals became a shared reference: players could compare notes on the same game by quoting its number. That is why the numbers are kept here.
