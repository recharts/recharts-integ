import fs from 'fs';
import path from 'path';
import { Controller } from './Controller.js';
import { execSync } from 'child_process';
import { TestResult } from './TestResult.js';

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
    clean(): TestResult {
        super.clean();
        this.execSync('yarn cache clean');
        return TestResult.ok('clean');
    }

    install(): TestResult {
        try {
            this.execSync('yarn install');
            return TestResult.ok('install');
        } catch (e) {
            return TestResult.fail('install', e as Error);
        }
    }

    test(): TestResult {
        const packageJsonPath = path.join(this.absolutePath, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            console.log(`No package.json found at ${packageJsonPath}. Skipping 'yarn run test'.`);
            return TestResult.fail('unit test', new Error(`No package.json found at ${packageJsonPath}`));
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (!(packageJson.scripts && packageJson.scripts.test)) {
                console.log(`No 'test' script found in package.json at ${this.absolutePath}. Skipping 'yarn run test'.`);
                return TestResult.ok('unit test');
            }

            try {
                this.execSync('yarn run test');
                return TestResult.ok('unit test');
            } catch (e) {
                return TestResult.fail('unit test', e as Error);
            }
        } catch (error: any) {
            console.error(`Error reading or parsing package.json at ${packageJsonPath}: ${error.message}. Skipping 'yarn run test'.`);
            return TestResult.fail('unit test', error);
        }
    }

    build(): TestResult {
        try {
            this.execSync('yarn run build');
            return TestResult.ok('build');
        } catch (e) {
            return TestResult.fail('build', e as Error);
        }
    }

    pack(): string {
        const output = this.execSync('yarn pack --json').trim();
        try {
            const jsonOutput: YarnPackJson = JSON.parse(output);
            if (jsonOutput.type === 'success' && jsonOutput.data) {
                const match = jsonOutput.data.match(/"(.+\.tgz)"/);
                if (match) {
                    return `file:${match[1]}`;
                }
                throw new Error(`Could not extract tgz path from: ${jsonOutput.data}`);
            } else {
                throw new Error(`Unexpected output format from yarn pack: ${output}`);
            }
        } catch (error: any) {
            console.error(`Error parsing yarn pack output: ${error.message}`);
            throw error;
        }
    }

    verifySingleDependencyVersion(dependencyName: string): TestResult {
        const command = `yarn list --pattern "${dependencyName}" --json --no-progress`;
        let rawOutput: string;

        try {
            rawOutput = execSync(command, { 
                encoding: 'utf-8', 
                cwd: this.absolutePath, 
                stdio: 'pipe', 
                env: this.getEnv() 
            });
        } catch (error: any) {
            rawOutput = error.stdout || "";
            const errOutput = error.stderr || "";

            if (errOutput.includes(`Package "${dependencyName}" not found`) || 
                errOutput.includes(`pattern "${dependencyName}" did not match any packages`)) {
                return TestResult.fail(dependencyName, new Error(`Dependency ${dependencyName} is not installed.`));
            }
        }

        if (!rawOutput) {
            return TestResult.fail(dependencyName, new Error(`No output received from 'yarn list' command for ${dependencyName}.`));
        }

        const installedVersions = this.parseYarnListOutput(rawOutput, dependencyName);

        if (installedVersions.size === 0) {
            return TestResult.fail(dependencyName, new Error(`Dependency ${dependencyName} is not installed or no versions could be identified.`));
        }

        if (installedVersions.size > 1) {
            return TestResult.fail(dependencyName, new Error(`Multiple versions of ${dependencyName} are installed: ${Array.from(installedVersions).join(', ')}`));
        }

        console.log(`Dependency ${dependencyName} is installed with a single version: ${Array.from(installedVersions)[0]}`);
        return TestResult.ok(dependencyName);
    }

    parseYarnListOutput(rawOutput: string, dependencyName: string): Set<string> {
        const installedVersions = new Set<string>();
        const lines = rawOutput.trim().split('\n');

        const processPackage = (pkg: YarnPackage) => {
            const nameParts = pkg.name.split('@');
            if (nameParts.length < 2) return;

            const version = nameParts.pop()!;
            const name = nameParts.join('@');

            if (name === dependencyName) {
                installedVersions.add(version);
            }

            if (pkg.children && Array.isArray(pkg.children)) {
                pkg.children.forEach(child => processPackage(child));
            }
        };

        lines.forEach(line => {
            try {
                const entry: YarnTreeEntry = JSON.parse(line);
                if (entry.type === 'tree' && entry.data && entry.data.trees) {
                    entry.data.trees.forEach(pkg => processPackage(pkg));
                }
            } catch (e) {
                // Silently ignore invalid JSON lines
            }
        });

        return installedVersions;
    }
}
