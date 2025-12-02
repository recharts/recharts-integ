import { Controller } from "./Controller.ts";
import { TestOutcome } from "./TestOutcome.ts";

export class PnpmController extends Controller {
  async install(): Promise<TestOutcome> {
    try {
      await this.execAsync("pnpm install");
      return TestOutcome.ok("install");
    } catch (ex: unknown) {
      return TestOutcome.fail("install", ex);
    }
  }

  async test(): Promise<TestOutcome> {
    try {
      await this.execAsync("pnpm run --if-present test");
      return TestOutcome.ok("unit test");
    } catch (ex) {
      return TestOutcome.fail("unit test", ex as Error);
    }
  }

  async build(): Promise<TestOutcome> {
    try {
      await this.execAsync("pnpm run build");
      return TestOutcome.ok("build");
    } catch (ex) {
      console.error(ex);
      return TestOutcome.fail("build", ex as Error);
    }
  }

  async pack(): Promise<string> {
    const output = await this.execAsync("pnpm pack");
    return this.tgzFileNameToPackageJsonReference(output.trim());
  }

  parsePnpmLsOutput(rawJson: string, dependencyName: string): Set<string> {
    const parsedVersions = JSON.parse(rawJson);
    const installedVersions = new Set<string>();

    function walkDependencies(dependencies: any | undefined) {
      if (!dependencies) return;
      for (const [key, value] of Object.entries(dependencies)) {
        if (key === dependencyName) {
          installedVersions.add((value as any).version);
        }
        if ((value as any).dependencies) {
          walkDependencies((value as any).dependencies);
        }
      }
    }

    walkDependencies(parsedVersions[0]?.dependencies);
    walkDependencies(parsedVersions[0]?.devDependencies);
    return installedVersions;
  }

  async verifySingleDependencyVersion(
    dependencyName: string,
  ): Promise<TestOutcome> {
    let rawJson: string;
    try {
      rawJson = await this.execAsync(
        `pnpm list ${dependencyName} --json --depth 999`,
      );
    } catch (ex) {
      return TestOutcome.fail(
        dependencyName,
        ex instanceof Error ? ex : new Error(String(ex)),
      );
    }

    const installedVersions = this.parsePnpmLsOutput(rawJson, dependencyName);

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

    const msg = `Dependency ${dependencyName} is installed and only one version is present: ${Array.from(
      installedVersions,
    ).join(", ")}`;
    return TestOutcome.ok("verify", msg);
  }
}
