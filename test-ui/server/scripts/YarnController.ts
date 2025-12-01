import fs from "fs";
import path from "path";
import { Controller } from "./Controller.ts";
import { exec } from "child_process";
import { promisify } from "util";
import { TestOutcome } from "./TestOutcome.ts";

const execAsync = promisify(exec);

interface YarnPackJson {
  type: string;
  data: string;
}

interface YarnTreeEntry {
  type: string;
  data?: {
    trees?: YarnPackage[];
  };
}

interface YarnPackage {
  name: string;
  children?: YarnPackage[];
}

export class YarnController extends Controller {
  async clean(): Promise<TestOutcome> {
    await super.clean();
    await this.execAsync("yarn cache clean");
    return TestOutcome.ok("clean");
  }

  async install(): Promise<TestOutcome> {
    try {
      await this.execAsync("yarn install");
      return TestOutcome.ok("install");
    } catch (e) {
      return TestOutcome.fail("install", e as Error);
    }
  }

  async test(): Promise<TestOutcome> {
    const packageJsonPath = path.join(this.absolutePath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      console.log(
        `No package.json found at ${packageJsonPath}. Skipping 'yarn run test'.`,
      );
      return TestOutcome.fail(
        "unit test",
        new Error(`No package.json found at ${packageJsonPath}`),
      );
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (!(packageJson.scripts && packageJson.scripts.test)) {
        console.log(
          `No 'test' script found in package.json at ${this.absolutePath}. Skipping 'yarn run test'.`,
        );
        return TestOutcome.ok("unit test");
      }

      try {
        await this.execAsync("yarn run test");
        return TestOutcome.ok("unit test");
      } catch (e) {
        return TestOutcome.fail("unit test", e as Error);
      }
    } catch (error: any) {
      console.error(
        `Error reading or parsing package.json at ${packageJsonPath}: ${error.message}. Skipping 'yarn run test'.`,
      );
      return TestOutcome.fail("unit test", error);
    }
  }

  async build(): Promise<TestOutcome> {
    try {
      await this.execAsync("yarn run build");
      return TestOutcome.ok("build");
    } catch (e) {
      return TestOutcome.fail("build", e as Error);
    }
  }

  async pack(): Promise<string> {
    const output = await this.execAsync("yarn pack --json");
    const trimmed = output.trim();
    try {
      const jsonOutput: YarnPackJson = JSON.parse(trimmed);
      if (jsonOutput.type === "success" && jsonOutput.data) {
        const match = jsonOutput.data.match(/"(.+\.tgz)"/);
        if (match) {
          return `file:${match[1]}`;
        }
        throw new Error(`Could not extract tgz path from: ${jsonOutput.data}`);
      } else {
        throw new Error(`Unexpected output format from yarn pack: ${trimmed}`);
      }
    } catch (error: any) {
      console.error(`Error parsing yarn pack output: ${error.message}`);
      throw error;
    }
  }

  async verifySingleDependencyVersion(
    dependencyName: string,
  ): Promise<TestOutcome> {
    const command = `yarn list --pattern "${dependencyName}" --json --no-progress`;
    let rawOutput: string;

    try {
      const result = await execAsync(command, {
        encoding: "utf-8",
        cwd: this.absolutePath,
        env: this.getEnv(),
        maxBuffer: 10 * 1024 * 1024,
      });
      rawOutput = result.stdout;
    } catch (error: any) {
      rawOutput = error.stdout || "";
      const errOutput = error.stderr || "";

      if (
        errOutput.includes(`Package "${dependencyName}" not found`) ||
        errOutput.includes(
          `pattern "${dependencyName}" did not match any packages`,
        )
      ) {
        return TestOutcome.fail(
          dependencyName,
          new Error(`Dependency ${dependencyName} is not installed.`),
        );
      }
    }

    if (!rawOutput) {
      return TestOutcome.fail(
        dependencyName,
        new Error(
          `No output received from 'yarn list' command for ${dependencyName}.`,
        ),
      );
    }

    const installedVersions = this.parseYarnListOutput(
      rawOutput,
      dependencyName,
    );

    if (installedVersions.size === 0) {
      return TestOutcome.fail(
        dependencyName,
        new Error(
          `Dependency ${dependencyName} is not installed or no versions could be identified.`,
        ),
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

    const message = `Dependency ${dependencyName} is installed with a single version: ${Array.from(installedVersions)[0]}`;
    return TestOutcome.ok(dependencyName, message);
  }

  parseYarnListOutput(rawOutput: string, dependencyName: string): Set<string> {
    const installedVersions = new Set<string>();
    const lines = rawOutput.trim().split("\n");

    const processPackage = (pkg: YarnPackage) => {
      const nameParts = pkg.name.split("@");
      if (nameParts.length < 2) return;

      const version = nameParts.pop()!;
      const name = nameParts.join("@");

      if (name === dependencyName) {
        installedVersions.add(version);
      }

      if (pkg.children && Array.isArray(pkg.children)) {
        pkg.children.forEach((child) => processPackage(child));
      }
    };

    lines.forEach((line) => {
      try {
        const entry: YarnTreeEntry = JSON.parse(line);
        if (entry.type === "tree" && entry.data && entry.data.trees) {
          entry.data.trees.forEach((pkg) => processPackage(pkg));
        }
      } catch (e) {
        // Silently ignore invalid JSON lines
      }
    });

    return installedVersions;
  }
}
