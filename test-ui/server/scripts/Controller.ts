import { exec } from "child_process";
import { promisify } from "util";
import { replacePackageVersion } from "./replacePackageVersion.ts";
import { tgzFileNameToPackageJsonReference } from "./tgzFileNameToPackageJsonReference.ts";
import path from "path";
import fs from "fs";
import { TestOutcome } from "./TestOutcome.ts";

const execAsync = promisify(exec);

export abstract class Controller {
  absolutePath: string;

  constructor(absolutePath: string) {
    this.absolutePath = absolutePath;
  }

  async clean(): Promise<TestOutcome> {
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

  async execAsync(cmd: string): Promise<string> {
    const env = this.getEnv();
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: this.absolutePath,
      encoding: "utf-8",
      env,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    return stdout;
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

  abstract verifySingleDependencyVersion(dependencyName: string): Promise<TestOutcome>;
  abstract install(): Promise<TestOutcome>;
  abstract test(): Promise<TestOutcome>;
  abstract build(): Promise<TestOutcome>;
  abstract pack(): Promise<string>;
}
