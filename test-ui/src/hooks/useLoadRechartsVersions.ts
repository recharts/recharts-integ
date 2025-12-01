import { setLoadingVersions, setAvailableVersions } from "../store/testsSlice";
import { AppDispatch } from "../store";

export async function loadRechartsVersions(dispatch: AppDispatch) {
  try {
    dispatch(setLoadingVersions(true));
    // Fetch from npm registry
    const response = await fetch("https://registry.npmjs.org/recharts");
    const data = await response.json();

    // Get versions and sort from latest to oldest
    const versions = Object.keys(data.versions || {})
      .filter((v) => !v.includes("-")) // Filter out pre-release versions
      .sort((a, b) => {
        // Compare version numbers (simple sort by version string works for semver)
        const aParts = a.split(".").map(Number);
        const bParts = b.split(".").map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = aParts[i] || 0;
          const bVal = bParts[i] || 0;
          if (aVal !== bVal) {
            return bVal - aVal; // Descending order
          }
        }
        return 0;
      })
      .slice(0, 50); // Limit to 50 most recent versions

    dispatch(setAvailableVersions(versions));
  } catch (err) {
    console.error("Failed to load Recharts versions:", err);
    dispatch(setLoadingVersions(false));
  }
}
