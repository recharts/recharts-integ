import { Controller } from "./Controller.ts";
import { TestOutcome } from "./TestOutcome.ts";

export class NpmController extends Controller {
  async install(): Promise<TestOutcome> {
    try {
      await this.execAsync("npm install");
      return TestOutcome.ok("install");
    } catch (ex: unknown) {
      return TestOutcome.fail("install", ex);
    }
  }

  async test(): Promise<TestOutcome> {
    try {
      await this.execAsync("npm run test --if-present");
      return TestOutcome.ok("unit test");
    } catch (ex) {
      return TestOutcome.fail("unit test", ex as Error);
    }
  }

  async build(): Promise<TestOutcome> {
    try {
      await this.execAsync("npm run build");
      return TestOutcome.ok("build");
    } catch (ex) {
      console.error(ex);
      return TestOutcome.fail("build", ex as Error);
    }
  }

  async pack(): Promise<string> {
    const output = await this.execAsync("npm pack");
    return this.tgzFileNameToPackageJsonReference(output.trim());
  }

  async verifySingleDependencyVersion(dependencyName: string): Promise<TestOutcome> {
    const versions = await this.execAsync(`npm ls ${dependencyName} --json`);
    const parsedVersions = JSON.parse(versions);

    const installedVersions = new Set<string>();

    function walkDependencies(dependencies: any) {
      for (const [key, value] of Object.entries(dependencies)) {
        if (key === dependencyName) {
          installedVersions.add((value as any).version);
        }
        if ((value as any).dependencies) {
          walkDependencies((value as any).dependencies);
        }
      }
    }

    walkDependencies(parsedVersions.dependencies);

    if (installedVersions.size > 1) {
      return TestOutcome.fail(
        dependencyName,
        new Error(
          `Multiple versions of ${dependencyName} are installed: ${Array.from(installedVersions).join(", ")}`,
        ),
      );
    }

    const msg = `Dependency ${dependencyName} is installed and only one version is present: ${Array.from(installedVersions).join(", ")}`;
    console.log(msg);
    return TestOutcome.ok(msg);
  }
}
