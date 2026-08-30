import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile("node_modules/recharts/package.json", "utf8"),
);

assert.equal(
  packageJson.peerDependencies?.["@types/react"],
  "*",
  "Recharts must declare @types/react as a peer dependency",
);
assert.equal(
  packageJson.peerDependenciesMeta?.["@types/react"]?.optional,
  true,
  "Recharts must mark @types/react as an optional peer dependency",
);
