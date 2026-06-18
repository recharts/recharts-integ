import fs from "fs";
import path from "path";
import { Controller } from "./Controller.ts";
import { TestOutcome } from "./TestOutcome.ts";

export class DenoController extends Controller {
  // Deno resolves modules through its own cache (DENO_DIR / HOME), so those need
  // to be forwarded on top of the base environment.
  override getEnv(): NodeJS.ProcessEnv {
    return {
      ...super.getEnv(),
      HOME: process.env.HOME,
      DENO_DIR: process.env.DENO_DIR,
    };
  }

  // Deno keeps dependencies in `deno.json` (under `imports`) rather than a
  // `package.json`, so the recharts version under test is patched there.
  override replacePackageJsonVersion(
    dependencyName: string,
    version: string,
  ): TestOutcome {
    if (version == null || version === "") {
      return TestOutcome.ok("replace-package-version");
    }

    const denoJsonPath = path.join(this.absolutePath, "deno.json");
    let denoJson: { imports?: Record<string, string>; [key: string]: unknown };
    try {
      denoJson = JSON.parse(fs.readFileSync(denoJsonPath, "utf8"));
    } catch (error) {
      return TestOutcome.fail(
        "replace-package-version",
        new Error(`Failed to read ${denoJsonPath}: ${error}`),
      );
    }

    if (denoJson.imports?.[dependencyName]) {
      // `version` may be a plain version ("3.8.2"), a `file:` tarball, or an
      // already-prefixed specifier; only bare versions need the `npm:` prefix.
      const specifier =
        version.startsWith("npm:") ||
        version.startsWith("jsr:") ||
        version.startsWith("file:") ||
        version.startsWith("http")
          ? version
          : `npm:${dependencyName}@${version}`;
      denoJson.imports[dependencyName] = specifier;
      fs.writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, 2) + "\n");
    }

    return TestOutcome.ok("replace-package-version");
  }

  async install(): Promise<TestOutcome> {
    try {
      await this.execAsync("deno install");
      return TestOutcome.ok("install");
    } catch (ex: unknown) {
      return TestOutcome.fail("install", ex);
    }
  }

  async test(): Promise<TestOutcome> {
    try {
      await this.execAsync("deno task test");
      return TestOutcome.ok("unit test");
    } catch (ex) {
      return TestOutcome.fail("unit test", ex as Error);
    }
  }

  async build(): Promise<TestOutcome> {
    // Deno runs TypeScript directly, so there is no bundling step; type-check
    // the project as the equivalent "build" verification.
    try {
      await this.execAsync("deno check src/App.test.tsx");
      return TestOutcome.ok("build");
    } catch (ex) {
      console.error(ex);
      return TestOutcome.fail("build", ex as Error);
    }
  }

  async pack(): Promise<string> {
    throw new Error("pack is not supported for Deno integrations");
  }

  async verifySingleDependencyVersion(
    dependencyName: string,
  ): Promise<TestOutcome> {
    const lockPath = path.join(this.absolutePath, "deno.lock");

    let lock: any;
    try {
      lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
    } catch (ex) {
      return TestOutcome.fail(
        dependencyName,
        new Error("Failed to read or parse deno.lock"),
      );
    }

    // deno.lock npm keys look like `react@19.2.7` or, with peer dependencies,
    // `recharts@3.8.1_react@19.2.7_react-dom@19.2.7__react@19.2.7`. Strip the
    // peer-dependency suffix, then split the name from the version on the last
    // `@` (so scoped packages like `@scope/name@1.2.3` work too).
    const installedVersions = new Set<string>();
    for (const key of Object.keys(lock.npm ?? {})) {
      const base = key.split("_")[0];
      const at = base.lastIndexOf("@");
      if (at <= 0) continue;
      const name = base.slice(0, at);
      const version = base.slice(at + 1);
      if (name === dependencyName) {
        installedVersions.add(version);
      }
    }

    if (installedVersions.size === 0) {
      return TestOutcome.fail(
        dependencyName,
        new Error(`Dependency ${dependencyName} is not installed`),
      );
    }

    if (installedVersions.size > 1) {
      return TestOutcome.fail(
        dependencyName,
        new Error(
          `Multiple versions of ${dependencyName} are installed: ${Array.from(installedVersions).join(", ")}`,
        ),
      );
    }

    return TestOutcome.ok(
      "verify",
      `Dependency ${dependencyName} is installed and only one version is present: ${Array.from(installedVersions).join(", ")}`,
    );
  }
}
