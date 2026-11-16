## What makes a Sudoku hard

Hard puzzles start with around **28 givens**. After the first few minutes, progress depends on candidates: you will spend more time reading notes than scanning. The puzzles are designed to need the same logic as medium ones, applied more often and in combination, plus a few new patterns.

A note on how levels work here: difficulty is set by how many givens remain while the puzzle still has a single solution. That correlates well with real difficulty, but not perfectly, so an occasional hard puzzle will fall quickly and an occasional one will feel like expert.

## Fill in candidates for the whole grid

On hard puzzles it pays to write candidates for **every** empty cell early on, once scanning stops giving answers. It takes a few minutes, but afterwards every technique below becomes a matter of looking for shapes rather than recalculating.

## Techniques for hard puzzles

**Naked triples.** Three cells in one unit whose candidates, taken together, are only three digits, such as {2, 5}, {5, 9} and {2, 9}. Those three digits are locked into those three cells; remove them from the rest of the unit. Note that no single cell needs all three candidates.

**Hidden pairs.** Two digits that, within one unit, appear as candidates in exactly the same two cells and nowhere else. Those cells must hold those digits, so every other candidate in those two cells can be erased.

**Box-line reduction.** The reverse of a pointing pair. If, within a row, a digit can only go in cells that all belong to one box, then it cannot go anywhere else in that box.

**X-Wing.** Look at one digit. If in two different rows it can only go in the same two columns, then the four cells form a rectangle and the digit must occupy two opposite corners. Either way, it fills both columns, so it can be removed from every other cell in those two columns. The same pattern works with rows and columns swapped.

## When you are stuck

- Recheck candidates in the area you last worked on. A single missed erasure hides most patterns.
- Look for bivalue cells (exactly two candidates). Pairs, X-Wings and chains all start from them.
- Pick one digit and look at all its candidate positions across the grid. Pointing pairs and X-Wings are much easier to see one digit at a time.

## Typical times

Experienced players usually need **15 to 30 minutes**. Being stuck for several minutes is normal at this level and is where most of the satisfaction comes from.

## Other levels

Ready for longer chains of logic? Try [expert Sudoku](expert-sudoku). Want something calmer? [Medium Sudoku](medium-sudoku) uses the same notes with fewer patterns.
