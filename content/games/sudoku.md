## How to play Sudoku

A Sudoku grid has 81 cells arranged in nine rows, nine columns and nine 3×3 boxes. Some cells are filled in at the start; these are the givens and cannot be changed. Your job is to fill every empty cell so that **each row, each column and each box contains the digits 1 to 9 exactly once**.

There is no arithmetic involved. The digits are just nine different symbols, and every puzzle here has exactly one solution that can be reached by logic.

## Controls

| Action | Mouse or touch | Keyboard |
|---|---|---|
| Select a cell | Click or tap it | Arrow keys |
| Enter a digit | Use the number pad | <kbd>1</kbd>–<kbd>9</kbd> |
| Clear a cell | Erase | <kbd>Backspace</kbd> or <kbd>Delete</kbd> |
| Switch pencil notes on or off | Notes | <kbd>N</kbd> |
| Undo | Undo | <kbd>Ctrl</kbd>+<kbd>Z</kbd> |

A wrong digit turns orange and adds one to the mistake counter; it is not removed for you, so you can decide whether to erase it. When you place a correct digit, matching pencil notes in the same row, column and box are cleared automatically. The small number under each pad button shows how many of that digit are still missing. Your puzzle is saved in this browser, so you can close the tab and continue later.

## Difficulty levels

| Level | Givens | What to expect |
|---|---|---|
| Easy | About 40 | Solvable by scanning rows, columns and boxes |
| Medium | About 33 | Needs pencil notes in a few places |
| Hard | About 28 | Regular use of pairs and box-line interactions |
| Expert | About 24 | Long chains of deductions; notes are essential |

Difficulty here is set by how many givens are removed while the puzzle still has a single solution. Fewer givens usually means a harder puzzle, though not always: two puzzles with the same number of clues can feel quite different.

## Solving techniques, from first to last resort

**Scanning.** Pick a digit and look at one 3×3 box where it is missing. Rows and columns that already contain the digit rule out cells in that box. If only one cell is left, the digit goes there. This alone solves most easy puzzles.

**Single candidate.** Look at one empty cell and list which digits are still possible given its row, column and box. If only one digit remains, place it.

**Pencil notes.** When scanning stops working, switch on Notes and write the candidates into cells that have two or three possibilities. Notes turn guesses into facts you can see.

**Pairs.** If two cells in the same row, column or box can each only hold the same two digits, those two digits are used up by those cells. Remove them from every other cell in that unit.

**Box-line reduction.** If, inside a box, a digit can only go in one row, then that digit cannot appear anywhere else along that row outside the box. The same holds for columns.

**Do not guess.** A puzzle with one solution never requires it. If you are stuck, a missed single or pair is almost always the reason. The Hint button fills the selected cell, or a random empty one, and is counted in your result.

## A little background

The modern puzzle was published in 1979 by the American magazine publisher Dell under the name *Number Place*; it is generally credited to Howard Garns. The Japanese publisher Nikoli introduced it in 1984 and gave it the name that stuck, an abbreviation of a phrase meaning roughly "the digits must remain single". It became a worldwide newspaper feature in 2004 and 2005.

Two numbers are worth knowing. There are 6,670,903,752,021,072,936,960 valid completed grids. And in 2012 an exhaustive computer search showed that no puzzle with only 16 givens has a unique solution: 17 is the minimum.
