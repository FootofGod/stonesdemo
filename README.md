# Stones Prototype (BMGP)
A prototype for the Stones variant of Go built off of Bare Minimum Go Program
Plans to add simple Netplay vis NetplayJS from https://github.com/rameshvarun/netplayjs

# Motivation
I want to make a version of Go with an unambiguous end, while being as close as possible to determining the same winner.
I have named this variant Stones. On a 9x9, the rules are as follows:
* generally same mechanics as traditional Go with moves, capture, etc. Self-capture is allowed if it does not repeat a position.
* Win by playing a move that gives X lead in captures or greater and captures 2 or more Stones (single capture cannot trigger a win)
* Compensation (komi in Go) to White in the form of 6 Prisoners to start
* On 9x9, it is the first to lead by 7 more than the initial position (so with Compensation, X = 1 for Black, X = 13 for white. If no Compensation, both aim to lead by 7)
* No passing - a player may return a Prisoner instead of playing if they have more Prisoners than their opponent (so both players can never return in succession)
* When a player has ONLY groups/stones of 2 or less Liberties, they may 'Stake' a remaining Liberty (a virtual move of sorts)

# Heuristics


# How to play with white?
Before making the first move open DevTools and type: "play(4)",
then hit enter. Engine would make a move, you can now play with
white stones.

# How to give engine a handicap?
Before starting the game you can set additional stones
from the DevTools, e.g. type: "board[sq] = BLACK; drawBoard();",
this would put a stone to "sq", note board is 1d array.

# Play Stones vs BMGP Engine
<a href="https://footofgod.github.io/stonesdemo/stones.html">Play now</a>
