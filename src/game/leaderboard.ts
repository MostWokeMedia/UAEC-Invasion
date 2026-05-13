import { BUILD_LABEL } from "./metadata";

const LEADERBOARD_TABLE = "leaderboard_scores";
const DEFAULT_LIMIT = 100;

export type LeaderboardEntry = {
  id: number;
  initials: string;
  score: number;
  wave: number;
  buildLabel: string;
  createdAt: string;
};

export type LeaderboardSubmission = {
  initials: string;
  score: number;
  wave: number;
  buildLabel?: string;
};

type LeaderboardRow = {
  id: number;
  initials: string;
  score: number;
  wave: number;
  build_label: string;
  created_at: string;
};

type LeaderboardConfig = {
  url: string;
  key: string;
};

export function sanitizeInitials(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
}

export function isLeaderboardConfigured(): boolean {
  return getLeaderboardConfig() !== null;
}

export async function fetchLeaderboard(
  limit = DEFAULT_LIMIT,
  fetcher: typeof fetch = fetch,
): Promise<LeaderboardEntry[]> {
  const config = getLeaderboardConfig();
  if (!config) return [];

  const endpoint = new URL(
    `/rest/v1/${LEADERBOARD_TABLE}`,
    ensureTrailingSlash(config.url),
  );
  endpoint.searchParams.set(
    "select",
    "id,initials,score,wave,build_label,created_at",
  );
  endpoint.searchParams.set("order", "score.desc,created_at.asc");
  endpoint.searchParams.set("limit", String(limit));

  const response = await fetcher(endpoint, {
    headers: getSupabaseHeaders(config),
  });

  if (!response.ok) return [];

  const rows = (await response.json()) as LeaderboardRow[];
  return rows.map(mapLeaderboardRow);
}

export async function submitLeaderboardScore(
  submission: LeaderboardSubmission,
  fetcher: typeof fetch = fetch,
): Promise<LeaderboardEntry | null> {
  const config = getLeaderboardConfig();
  if (!config) return null;

  const initials = sanitizeInitials(submission.initials);
  if (initials.length !== 3) return null;

  const endpoint = new URL(
    `/rest/v1/${LEADERBOARD_TABLE}`,
    ensureTrailingSlash(config.url),
  );
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      ...getSupabaseHeaders(config),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      initials,
      score: Math.max(0, Math.floor(submission.score)),
      wave: Math.max(1, Math.floor(submission.wave)),
      build_label: submission.buildLabel ?? BUILD_LABEL,
    }),
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as LeaderboardRow[];
  const row = rows[0];

  return row ? mapLeaderboardRow(row) : null;
}

function getLeaderboardConfig(): LeaderboardConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return { url, key };
}

function getSupabaseHeaders(config: LeaderboardConfig): HeadersInit {
  return {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    "Content-Type": "application/json",
  };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function mapLeaderboardRow(row: LeaderboardRow): LeaderboardEntry {
  return {
    id: row.id,
    initials: row.initials,
    score: row.score,
    wave: row.wave,
    buildLabel: row.build_label,
    createdAt: row.created_at,
  };
}
