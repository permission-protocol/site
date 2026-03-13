import { GH_API, ghHeaders } from "./shared";

const RERUN_RETRY_DELAYS = [1500, 3000];
const DEPLOY_GATE_CHECK_NAME = "Deploy Gate / Permission Protocol";
const MANUAL_RERUN_WINDOW_MS = 5 * 60 * 1000;
const MANUAL_RERUN_LIMIT = 5;

export type RerunResult = { ok: boolean; strategy?: string; error?: string };

const manualRerunAttempts = new Map<string, number[]>();

async function tryRerun(url: string, token: string, strategy: string): Promise<RerunResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (res.ok || res.status === 201) {
      return { ok: true, strategy };
    }
    return { ok: false, strategy, error: `${strategy} returned ${res.status}` };
  } catch (err) {
    return { ok: false, strategy, error: (err as Error).message };
  }
}

async function findDeployGateCheckRun(params: {
  owner: string;
  repo: string;
  sha: string;
  githubToken: string;
}): Promise<{ checkRunId: string; runId: string | null } | null> {
  try {
    const res = await fetch(
      `${GH_API}/repos/${params.owner}/${params.repo}/commits/${params.sha}/check-runs?per_page=100`,
      { headers: ghHeaders(params.githubToken) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      check_runs?: Array<{
        id?: number;
        name?: string;
        details_url?: string;
      }>;
    };
    const deployGateRun = data.check_runs?.find(
      (cr) =>
        cr.name?.includes("Deploy Gate") ||
        cr.name?.includes("Permission Protocol") ||
        cr.name === DEPLOY_GATE_CHECK_NAME
    );
    if (!deployGateRun?.id) return null;

    const runIdMatch = deployGateRun.details_url?.match(/\/actions\/runs\/(\d+)/);
    return {
      checkRunId: String(deployGateRun.id),
      runId: runIdMatch?.[1] ?? null,
    };
  } catch {
    return null;
  }
}

export async function triggerGitHubRerun(params: {
  owner: string;
  repo: string;
  prNumber: number;
  githubToken: string;
  checkRunId: string | null;
  runId: string | null;
}): Promise<RerunResult> {
  let { checkRunId, runId } = params;

  if (!checkRunId && !runId) {
    const prRes = await fetch(
      `${GH_API}/repos/${params.owner}/${params.repo}/pulls/${params.prNumber}`,
      { headers: ghHeaders(params.githubToken) }
    );
    const prData = (await prRes.json().catch(() => ({}))) as { head?: { sha?: string } };
    const sha = prData.head?.sha;
    if (sha) {
      const found = await findDeployGateCheckRun({
        owner: params.owner,
        repo: params.repo,
        sha,
        githubToken: params.githubToken,
      });
      if (found) {
        checkRunId = found.checkRunId;
        runId = found.runId;
      }
    }
  }

  if (checkRunId) {
    for (let attempt = 0; attempt <= RERUN_RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, RERUN_RETRY_DELAYS[attempt - 1]));
      }
      const result = await tryRerun(
        `${GH_API}/repos/${params.owner}/${params.repo}/check-runs/${checkRunId}/rerequest`,
        params.githubToken,
        "check_run"
      );
      if (result.ok) return result;
      if (result.error?.includes("404")) break;
      if (!result.error?.includes("429") && !result.error?.includes("50")) break;
    }
  }

  if (runId) {
    for (let attempt = 0; attempt <= RERUN_RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, RERUN_RETRY_DELAYS[attempt - 1]));
      }
      const result = await tryRerun(
        `${GH_API}/repos/${params.owner}/${params.repo}/actions/runs/${runId}/rerun`,
        params.githubToken,
        "actions_run"
      );
      if (result.ok) return result;
      if (!result.error?.includes("429") && !result.error?.includes("50")) break;
    }
  }

  if (!checkRunId && !runId) {
    return { ok: false, error: "No check run or workflow run ID available for rerun" };
  }
  return { ok: false, error: "All rerun strategies exhausted" };
}

export function takeManualRerunAttempt(requestId: string) {
  const now = Date.now();
  const recentAttempts = (manualRerunAttempts.get(requestId) ?? []).filter(
    (timestamp) => now - timestamp < MANUAL_RERUN_WINDOW_MS
  );

  if (recentAttempts.length >= MANUAL_RERUN_LIMIT) {
    manualRerunAttempts.set(requestId, recentAttempts);
    return {
      allowed: false as const,
      attemptsRemaining: 0,
      retryAfterMs: MANUAL_RERUN_WINDOW_MS - (now - recentAttempts[0]),
    };
  }

  recentAttempts.push(now);
  manualRerunAttempts.set(requestId, recentAttempts);
  return {
    allowed: true as const,
    attemptsRemaining: MANUAL_RERUN_LIMIT - recentAttempts.length,
  };
}

export const manualRerunLimit = MANUAL_RERUN_LIMIT;
export const manualRerunWindowMs = MANUAL_RERUN_WINDOW_MS;
