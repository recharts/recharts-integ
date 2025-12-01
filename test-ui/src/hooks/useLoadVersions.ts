const API_BASE = "/api";

export async function loadVersions(
  setVersions: (versions: { node: string; npm: string; yarn: string; pnpm: string }) => void,
) {
  try {
    const response = await fetch(`${API_BASE}/versions`);
    const data = await response.json();
    setVersions(data);
  } catch (err) {
    console.error("Failed to load versions:", err);
  }
}
