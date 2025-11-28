import fs from 'fs';
import { TestOutcome } from './TestOutcome.ts';

export function replacePackageVersion(packageJsonPath: string, dependencyName: string, version: string): TestOutcome {
    if (version == null || version === '') {
        return TestOutcome.ok('replace-package-version');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    let replaced = false;

    if (packageJson.dependencies && packageJson.dependencies[dependencyName]) {
        console.log(`Replacing ${dependencyName} dependency in ${packageJsonPath} with '${version}'`);
        packageJson.dependencies[dependencyName] = version;
        replaced = true;
    }

    if (packageJson.peerDependencies && packageJson.peerDependencies[dependencyName]) {
        console.log(`Replacing ${dependencyName} peerDependency in ${packageJsonPath} with '${version}'`);
        packageJson.peerDependencies[dependencyName] = version;
        replaced = true;
    }

    if (!replaced) {
        console.error(`Dependency ${dependencyName} not found in ${packageJsonPath}`);
        return TestOutcome.fail('replace-package-version', new Error(`Dependency ${dependencyName} not found in ${packageJsonPath}`));
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return TestOutcome.ok('replace-package-version');
}
