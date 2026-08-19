import { Redis } from "@upstash/redis";

interface PlayerData {
  points: number;
  solved: number[];
  hintsUsed: Record<number, number>;
}

// The Vercel Upstash marketplace integration can land under several env
// var names depending on how it was connected: the legacy Vercel KV naming,
// a plain Upstash account's naming, or a custom prefix applied on top of
// the legacy names (which is what this project ended up with). Check all.
const redisUrl =
  process.env.KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken =
  process.env.KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// In-memory fallback for local dev without Redis configured. Resets on
// server restart, which is fine for a single local session but not for
// a serverless deployment with multiple concurrent function instances,
// which is why Redis is used whenever it's configured.
const memory = new Map<string, PlayerData>();
const AGENTS_SET = "agents";

function emptyPlayer(): PlayerData {
  return { points: 0, solved: [], hintsUsed: {} };
}

async function getPlayer(name: string): Promise<PlayerData> {
  if (redis) {
    const data = await redis.get<PlayerData>(`player:${name}`);
    return data ?? emptyPlayer();
  }
  return memory.get(name) ?? emptyPlayer();
}

async function savePlayer(name: string, data: PlayerData) {
  if (redis) {
    await redis.set(`player:${name}`, data);
    await redis.sadd(AGENTS_SET, name);
    return;
  }
  memory.set(name, data);
}

export async function useHint(name: string, labId: number): Promise<number> {
  const player = await getPlayer(name);
  player.hintsUsed[labId] = (player.hintsUsed[labId] ?? 0) + 1;
  await savePlayer(name, player);
  return player.hintsUsed[labId];
}

export async function submitSolve(
  name: string,
  labId: number,
  basePoints: number,
  hintCostEach: number
) {
  const player = await getPlayer(name);
  if (player.solved.includes(labId)) {
    return { alreadySolved: true, points: player.points };
  }
  const hints = player.hintsUsed[labId] ?? 0;
  const awarded = Math.max(Math.floor(basePoints / 2), basePoints - hints * hintCostEach);
  player.solved.push(labId);
  player.points += awarded;
  await savePlayer(name, player);
  return { alreadySolved: false, points: player.points, awarded };
}

// Removes solves (and the points they awarded) for the given lab ids from every
// player, e.g. to undo credit gained while a lab was accidentally trivial.
export async function revokeSolves(
  labIds: number[],
  pointsById: Record<number, number>,
  hintCostById: Record<number, number>
) {
  const names = redis ? await redis.smembers(AGENTS_SET) : Array.from(memory.keys());
  const affected: { name: string; removed: number[]; pointsDeducted: number }[] = [];

  for (const name of names) {
    const player = await getPlayer(name);
    const removed: number[] = [];
    let pointsDeducted = 0;

    for (const labId of labIds) {
      if (!player.solved.includes(labId)) continue;
      const hints = player.hintsUsed[labId] ?? 0;
      const basePoints = pointsById[labId] ?? 0;
      const hintCostEach = hintCostById[labId] ?? 0;
      const awarded = Math.max(Math.floor(basePoints / 2), basePoints - hints * hintCostEach);
      player.solved = player.solved.filter((id) => id !== labId);
      player.points = Math.max(0, player.points - awarded);
      removed.push(labId);
      pointsDeducted += awarded;
    }

    if (removed.length > 0) {
      await savePlayer(name, player);
      affected.push({ name, removed, pointsDeducted });
    }
  }

  return affected;
}

export async function resetLeaderboard() {
  if (redis) {
    const names = await redis.smembers(AGENTS_SET);
    if (names.length > 0) {
      await redis.del(...names.map((n) => `player:${n}`));
    }
    await redis.del(AGENTS_SET);
    return names;
  }
  const names = Array.from(memory.keys());
  memory.clear();
  return names;
}

export async function getLeaderboard() {
  if (redis) {
    const names = await redis.smembers(AGENTS_SET);
    if (names.length === 0) return [];
    const players = await Promise.all(names.map((n) => redis.get<PlayerData>(`player:${n}`)));
    return names
      .map((name, i) => {
        const p = players[i];
        return { name, points: p?.points ?? 0, solvedCount: p?.solved.length ?? 0 };
      })
      .sort((a, b) => b.points - a.points);
  }
  return Array.from(memory.entries())
    .map(([name, p]) => ({ name, points: p.points, solvedCount: p.solved.length }))
    .sort((a, b) => b.points - a.points);
}
