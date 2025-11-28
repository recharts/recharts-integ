import { execSync } from "child_process";
import { replacePackageVersion } from "./replacePackageVersion.ts";
import { tgzFileNameToPackageJsonReference } from "./tgzFileNameToPackageJsonReference.ts";
import path from "path";
import fs from "fs";
import { TestOutcome } from "./TestOutcome.ts";

export abstract class Controller {
  absolutePath: string;

  constructor(absolutePath: string) {
    this.absolutePath = absolutePath;
  }

  clean(): TestOutcome {
    fs.rmSync(path.join(this.absolutePath, "node_modules"), {
      recursive: true,
      force: true,
    });
    fs.rmSync(path.join(this.absolutePath, "package-lock.json"), {
      force: true,
    });
    fs.rmSync(path.join(this.absolutePath, "yarn.lock"), { force: true });
    const files = fs.readdirSync(this.absolutePath);
    files
      .filter((file) => file.endsWith(".tgz"))
      .forEach((file) => {
        fs.rmSync(path.join(this.absolutePath, file), { force: true });
      });
    return TestOutcome.ok("clean");
  }

  execSync(cmd: string): string {
    const env = this.getEnv();
    return execSync(cmd, {
      cwd: this.absolutePath,
      encoding: "utf-8",
      env,
      stdio: "pipe",
    });
  }

  getEnv(): NodeJS.ProcessEnv {
    return {
      CI: process.env.CI,
      PATH: process.env.PATH,
      COREPACK_ENABLE_AUTO_PIN: "0",
      COREPACK_ENABLE_STRICT: "0",
    };
  }

  replacePackageJsonVersion(
    dependencyName: string,
    version: string,
  ): TestOutcome {
    const packageJsonPath = path.join(this.absolutePath, "package.json");
    return replacePackageVersion(packageJsonPath, dependencyName, version);
  }

  tgzFileNameToPackageJsonReference(tgzFileName: string): string {
    return tgzFileNameToPackageJsonReference(this.absolutePath, tgzFileName);
  }

  abstract verifySingleDependencyVersion(dependencyName: string): TestOutcome;
  abstract install(): TestOutcome;
  abstract test(): TestOutcome;
  abstract build(): TestOutcome;
  abstract pack(): string;
}
