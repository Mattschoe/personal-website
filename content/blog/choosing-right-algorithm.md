---
title: How to choose the right approach for Competitive Programming
date: 2026-06-10
excerpt: Being able to choose the right algorithm and datastructure for a exercise is essential for competitive-style programming exercises. Here's a list of my methods to analyze any question.
caption: Being able to choose the right algorithm and datastructure for a exercise is essential for competitive-style programming exercises. Here's a list of my methods to analyze any question.
---
Being able to choose the right algorithm and datastructure for a algorithmic problem is essential for 
competitive-style programming exercises. Here's a list of my methods to analyze any question.
# Meta Analysis of Input Constraints
The best and quickest thing you can do is always analyzing the input constraints. Assuming a standard 
time-limit of 1 second, allowing roughly $10^6$ operations use this table to get a quick and rough 
idea of what potentiel solutions you should be looking at.
| **Input Size (N)** | **Required Complexity** | **Algorithm Candidates**                                                                          |
| ---------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| N $\leq$ 20        | O($2^N$) or O($N!$)     | Backtracking, Recursion, Bitmask DP. (Complete search is feasible).                                    |
| N $\leq$ 2.000     | O($N^2$)                | DP (2D state), Graph (Dense / Adjacency Matrix), Selection/Insertion Sort (rare).                      |
| N $\leq 10^5$      | O($N$ *log* $N$)        | Sorting, Greedy, Heap (Priority Queue), Binary Search, Segment Tree, Graph (Dijkstra/BFS on Adj List). |
| N $\leq 10^6$      | O($N$)                  | Two Pointers, Sliding Window, KMP, Union-Find, Linear DP.                                              |
| N $\leq 10^{18}$   | O(*log N*) or O(1)      | Math (Number Theory), Matrix Exponentiation, Binary Search on Answer.                                  |
# Problem Type Keywords
Once you have narrowed the field with the input constraint, it's often a very good idea to analyse
the text of the problem and see if you can recognize some common phrases used for specific types
of problems. Finding the phrase often means finding the algorithm behind it. Here is a list of
what i typically look for and what i try to do next.
## "Find the Minimum/Maximum/Longest/Shortest..." (Optimization)
**Candidate 1: Greedy.** \
*Can I make a locally optimal choice that never leads to a mistake?*

**Candidate 2: Dynamic Programming.** \
*Do I need to check multiple futures? Do overlapping subproblems exist?*

**Candidate 3: Binary Search on Answer.** \
*Is the answer monotonic? E.g., "Can we do it in $K$ cost?"*

**Candidate 4: Shortest Path (BFS/Dijkstra).** \
*Can the state be modeled as a graph?*

## "Find the number of ways to..." (Counting)
Almost exclusively **Dynamic Programming** or **Combinatorics**. Greedy is rarely used for counting 
unless the construction is unique and deterministic.

## "Is it possible to..." (Existence)
- **Graph Traversal (DFS/BFS)** (Reachability).
- **Union-Find** (Connectivity).
- **2-SAT** (Logic satisfaction).
## Misc
Here's a list of some other keywords i often see pointing me towards a certain algorithmic choice:
| Algorithm                     | Keywords                                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sliding Window (Two Pointers) | "Contiguous subarrary" combined with "at most K" or "sum at most X"                                                                                                                                                        |
| Binary search on Answer       | "Minimize the maximum time" "Find the minimum time to reach a target" If the answer space is monotonic (if *X* is valid, *X+1* is also) Constraints on *result* is huge, but verifying a specific value is cheap. |
| Heap (PQ)                     | "Find the K-th smallest/Largest" (No need to sort array, just maintain top *K* elements)                                                                                                                                   |
| Dynamic Programming           | "Count the number of ways" "Longest increasing subsequence"/"Longest common ..." (Decision at index *i* depends on history of decision before it).                                                                      |
| Two Pointers                  | "Palindrome"                                                                                                                                                                                                               |
| BFS                           | "Shortest path" when it's unweighed                                                                                                                                                                                        |
| Djikstra                      | "Shortest path" when it's weighed                                                                                                                                                                                          |
| Union-Find                    | "Connectivity" "Groups" "Sets" When you don't care about path, only about membership, like: "Is A in the same group as B?"                                                                                        |

# Greedy vs. Dynamic
The hardest distinction to make is always if greedy is the optimal solution or if DP is necessary. 
Greedy often *feels* correct, even when it is wrong. Here it's important to remember that Greedy is 
**only** the solution when: A local optimal choice can be proofed to lead to a global optimal solution 
without ever needing to reconsider.

But how do we go on about proofing this? Well, the most common strategy is using the *Exchange Argument*, 
which goes as follows:
1. Imagine an Optimal Solution ($O$) that _disagrees_ with your Greedy Choice ($G$) at the very first step.
2. Can you swap the piece from $O$ with your piece $G$ and still result in a valid solution that is just as good or better?
3. If **YES:** then Greedy is safe.
4. If **NO**: (sometimes the swap breaks validity or lowers value), Greedy is dead.

## What does that look like? (Example):
**Example: Interval Scheduling (Maximize # of meetings)**

*Greedy Hypothesis*: "Pick the meeting with the shortest duration first."

**The Test:**
- My Greedy choice ($G$): A short meeting from 12:00 to 12:30 (Duration: 30m).
- The Hypothetical Optimal ($O$): It didn't pick $G$. Instead, it picked a meeting from 11:00 to 12:15 and another from 12:20 to 13:30.
- _The Exchange:_ Can I force $G$ into the Optimal set?
- If I force $G$ in (12:00-12:30), I have to remove the two overlapping meetings from $O$.
- **Result:** I traded 1 meeting ($G$) for 2 meetings ($O$). My solution got worse.
- **Conclusion:** Shortest Duration is **incorrect**.

**It's important that** whenever you have a Greedy hunch to not test with random numbers. 
Always test with edge cases, designed to punish short-sightedness. Here are 3 archetypes to build 
these tests:
### A. When weights/values are involved.
**Scenario: Pathfinding or Knapsack-style problems.** \
_Greedy:_ "Go to the node with the lowest cost edge." \
_Trap:_ Make the cheap edge lead to a "dead end" of expensive edges.
- Path A (Greedy): Cost 1 $\rightarrow$ Cost 100 $\rightarrow$ Cost 100. (Total: 201)
- Path B (Ignored): Cost 5 $\rightarrow$ Cost 5 $\rightarrow$ Cost 5. (Total: 15)

#### B. When picking an item consumes resources (time/space) needed for others.
**Scenario: Scheduling.** \
_Greedy:_ "Start the earliest task possible." \
_Trap:_ Create one long task that starts at $T=0$ and ends at $T=100$. Create 99 short tasks that 
start at $T=1$.
- If you pick the $0\text{-}100$ task first, you "burn the bridge" for all 99 other tasks.    

#### C. Used for bin packing or making change.
**_Scenario:_ Coin change (Minimize coins).** \
_Greedy:_ "Take largest coin." \
_Trap:_ Create a denomination gap.
- Coins: $\{1, 15, 25\}$. Target: $30$.
- Greedy picks $25$. Remainder $5$. Must use five $1$s. Total coins: $6$ ($25+1+1+1+1+1$).
- Optimal ignores $25$. Picks $15 + 15$. Total coins: $2$.
