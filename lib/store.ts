interface PlayerState {
  points: number;
  solved: Set<number>;
  hintsUsed: Record<number, number>;
}

// In-memory store for a single live session. Resets on server restart.
// That's intentional: this is a one-day event, not a persistent product.
const players = new Map<string, PlayerState>();

function getOrCreate(name: string): PlayerState {
  let p = players.get(name);
  if (!p) {
    p = { points: 0, solved: new Set(), hintsUsed: {} };
    players.set(name, p);
  }
  return p;
}

export function useHint(name: string, labId: number) {
  const p = getOrCreate(name);
  p.hintsUsed[labId] = (p.hintsUsed[labId] ?? 0) + 1;
  return p.hintsUsed[labId];
}

export function submitSolve(name: string, labId: number, basePoints: number, hintCostEach: number) {
  const p = getOrCreate(name);
  if (p.solved.has(labId)) {
    return { alreadySolved: true, points: p.points };
  }
  const hints = p.hintsUsed[labId] ?? 0;
  const awarded = Math.max(Math.floor(basePoints / 2), basePoints - hints * hintCostEach);
  p.solved.add(labId);
  p.points += awarded;
  return { alreadySolved: false, points: p.points, awarded };
}

export function getLeaderboard() {
  return Array.from(players.entries())
    .map(([name, p]) => ({ name, points: p.points, solvedCount: p.solved.size }))
    .sort((a, b) => b.points - a.points);
}
