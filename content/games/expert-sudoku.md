## What to expect from expert puzzles

Expert puzzles start with **about 24 givens**, sometimes a few more, which is close to the fewest a generator can reliably leave while keeping a unique solution. (The proven minimum for any Sudoku with a unique solution is 17.) With so little to start from, almost every step depends on full candidate notes and on spotting patterns that span several units at once.

You will not need to guess. Every puzzle has exactly one solution, and logic always leads there, though at this level the logic can take a while to find.

## Set-up for an expert puzzle

1. Scan for the obvious singles first; there are usually a few.
2. Write candidates in every empty cell. Be meticulous: one missing candidate can make a correct pattern look impossible.
3. Look for pairs, triples, pointing pairs and box-line reductions, as in [hard Sudoku](hard-sudoku), before searching for anything more advanced.

## Advanced techniques

**Swordfish.** An X-Wing with three rows instead of two. If a digit's candidates in three rows all fall within the same three columns, the digit must occupy those three columns within those rows, and can be removed from the rest of those columns. Each row needs only two or three of the positions, not all three.

**XY-Wing.** Three bivalue cells. A pivot with candidates {A, B} sees two pincers, one {A, C} and one {B, C}. Whatever the pivot turns out to be, one of the pincers must be C. So C can be removed from any cell that sees both pincers.

**XYZ-Wing.** As above, but the pivot holds {A, B, C}. C can then be removed only from cells that see the pivot and both pincers.

**Simple colouring.** Choose one digit and find units where it has exactly two candidate cells. Link those cells, and alternately colour the chain in two colours. One colour is all true, the other all false. If two cells of the same colour see each other, that colour is false everywhere; if a cell sees both colours, the digit can be removed from it.

**Unique rectangles.** Because the puzzle has one solution, four cells in two rows, two columns and two boxes cannot all end up as the same pair of digits. If three corners are a pair {A, B} and the fourth has {A, B} plus extras, the fourth cell cannot be A or B.

## Working habits that help

- Tackle one digit at a time when searching for fish and colouring patterns.
- Keep notes tidy. After each placement, glance at the cell's row, column and box to confirm candidates were cleared.
- Take a break. Patterns that are invisible after twenty minutes often jump out after two minutes away.

## Typical times

Expect **30 minutes to an hour** or more. Speed matters less here than finishing without hints; the mistake and hint counters show how cleanly you solved.

For a different pace, [hard Sudoku](hard-sudoku) uses most of the same tools with more help from the givens.
