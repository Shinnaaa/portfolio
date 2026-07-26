import { DATA_VERSION } from "./storage";

const GIST_FILENAME = "permanent-portfolio.json";
const GIST_DESCRIPTION = "Permanent Portfolio data (auto-synced)";

async function githubRequest(token, method, path = "", body = null) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// Finds the existing gist by id, or the first gist owning our data file, or
// creates a fresh empty one.
export async function getOrCreateGist(token, gistId) {
  if (gistId) {
    try {
      return await githubRequest(token, "GET", `/gists/${gistId}`);
    } catch {
      // fall through to search/create
    }
  }
  const gists = await githubRequest(token, "GET", "/gists?per_page=100");
  const existing = gists.find((g) => g.files && g.files[GIST_FILENAME]);
  if (existing) {
    return githubRequest(token, "GET", `/gists/${existing.id}`);
  }
  return githubRequest(token, "POST", "/gists", {
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(
          { version: DATA_VERSION, holdings: {}, settings: {}, snapshots: [] },
          null,
          2
        ),
      },
    },
  });
}

export async function readGist(token, gistId) {
  const gist = await githubRequest(token, "GET", `/gists/${gistId}`);
  const file = gist.files[GIST_FILENAME];
  if (!file) throw new Error("File not found in gist");
  const content = file.truncated
    ? await fetch(file.raw_url).then((r) => r.text())
    : file.content;
  return { data: JSON.parse(content), updatedAt: gist.updated_at };
}

export async function updateGist(token, gistId, data) {
  const res = await githubRequest(token, "PATCH", `/gists/${gistId}`, {
    files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
  });
  return { updatedAt: res.updated_at };
}

export async function verifyToken(token) {
  return githubRequest(token, "GET", "/user");
}

export { GIST_FILENAME };
