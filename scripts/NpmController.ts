import { Controller } from './Controller.js';
import { TestResult } from './TestResult.js';

export class NpmController extends Controller {
    install(): TestResult {
        try {
            this.execSync('npm install');
            return TestResult.ok('install');
        } catch (ex) {
            return TestResult.fail('install', ex as Error);
        }
    }

    test(): TestResult {
        try {
            this.execSync('npm run test --if-present');
            return TestResult.ok('unit test');
        } catch (ex) {
            return TestResult.fail('unit test', ex as Error);
        }
    }

    build(): TestResult {
        try {
            this.execSync('npm run build');
            return TestResult.ok('build');
        } catch (ex) {
            console.error(ex);
            return TestResult.fail('build', ex as Error);
        }
    }

    pack(): string {
        return this.tgzFileNameToPackageJsonReference(this.execSync('npm pack').trim());
    }

    verifySingleDependencyVersion(dependencyName: string): TestResult {
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
            return TestResult.fail(
                dependencyName,
                new Error(`Multiple versions of ${dependencyName} are installed: ${Array.from(installedVersions).join(', ')}`)
            );
        }

        console.log(`Dependency ${dependencyName} is installed and only one version is present: ${Array.from(installedVersions).join(', ')}`);
        return TestResult.ok(dependencyName);
    }
}
