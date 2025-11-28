import { Controller } from "./Controller.ts";
import { TestOutcome } from "./TestOutcome.ts";

export class NpmController extends Controller {
  install(): TestOutcome {
    try {
      this.execSync("npm install");
      return TestOutcome.ok("install");
    } catch (ex: unknown) {
      return TestOutcome.fail("install", ex);
    }
  }

  test(): TestOutcome {
    try {
      this.execSync("npm run test --if-present");
      return TestOutcome.ok("unit test");
    } catch (ex) {
      return TestOutcome.fail("unit test", ex as Error);
    }
  }

  build(): TestOutcome {
    try {
      this.execSync("npm run build");
      return TestOutcome.ok("build");
    } catch (ex) {
      console.error(ex);
      return TestOutcome.fail("build", ex as Error);
    }
  }

  pack(): string {
    return this.tgzFileNameToPackageJsonReference(
      this.execSync("npm pack").trim(),
    );
  }

  verifySingleDependencyVersion(dependencyName: string): TestOutcome {
    const versions = this.execSync(`npm ls ${dependencyName} --json`);
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
