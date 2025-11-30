import path from "path";
import { fileURLToPath } from "url";
import { NpmController } from "../test-ui/server/scripts/NpmController.ts";
import { YarnController } from "../test-ui/server/scripts/YarnController.ts";
import type { Controller } from "../test-ui/server/scripts/Controller.ts";
import type { TestOutcome } from "../test-ui/server/scripts/TestOutcome.ts";
import {getTestMetadata} from "../test-ui/server/scripts/test-registry.ts";
import type {TestMetadata} from "../test-ui/server/scripts/test-registry.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyAllSingleDependencyVersions(controller: Controller): Promise<TestOutcome[]> {
    return await Promise.all([
        controller.verifySingleDependencyVersion('recharts'),
        controller.verifySingleDependencyVersion('react'),
        controller.verifySingleDependencyVersion('react-dom'),
        controller.verifySingleDependencyVersion('react-redux'),
        controller.verifySingleDependencyVersion('@reduxjs/toolkit')
    ]);
}

async function runDirectDependencyAppTest(controller: Controller, rechartsVersion: string): Promise<TestOutcome[]> {
    const results: TestOutcome[] = [];

    results.push(await controller.clean());
    results.push(await controller.replacePackageJsonVersion("recharts", rechartsVersion));
    const installResult = await controller.install();
    results.push(installResult);
    if (!installResult.success) {
        console.warn('Failed to install the app. Skipping test and build checks because those are guaranteed to fail too!');
        return results;
    }
    results.push(await controller.test());
    results.push(await controller.build());
    results.push(...await verifyAllSingleDependencyVersions(controller));
    return results;
}

async function runLibraryInLibraryTest(libController: Controller, appController: Controller, rechartsVersion: string): Promise<TestOutcome[]> {
    await libController.clean();
    await libController.replacePackageJsonVersion("recharts", rechartsVersion);
    await libController.install();
    await libController.test();
    await libController.build();
    await verifyAllSingleDependencyVersions(libController);
    const myChartsTgzFile = await libController.pack();

    const results: TestOutcome[] = [];

    results.push(await appController.clean());
    results.push(await appController.replacePackageJsonVersion("my-charts", myChartsTgzFile));
    const installResult = await appController.install();
    results.push(installResult);
    if (!installResult.success) {
        console.warn('Failed to install the app. Skipping test and build checks because those are guaranteed to fail too!');
        return results;
    }

    results.push(await appController.test());
    results.push(await appController.build());
    results.push(...await verifyAllSingleDependencyVersions(appController));
    return results;
}

function getControllerConstructor(packageManager: string): typeof NpmController | typeof YarnController {
    if (packageManager === "npm") {
        return NpmController;
    } else if (packageManager === "yarn") {
        return YarnController;
    } else {
        throw new Error(`Unknown package manager: ${packageManager}`);
    }
}

async function runLibraryTest(metadata: TestMetadata, rechartsVersion: string): Promise<TestOutcome[]> {
    if (!metadata.libraryName || !metadata.appName) {
        throw new Error(`Library test "${metadata.name}" missing required libraryName or appName`);
    }
    const libPath = path.join(__dirname, "../libraries", metadata.libraryName);
    const appPath = path.join(__dirname, "../apps-3rd-party", metadata.appName);
    const Controller = getControllerConstructor(metadata.packageManager);
    return await runLibraryInLibraryTest(new Controller(libPath), new Controller(appPath), rechartsVersion);
}

async function runDirectDependencyTest(metadata: TestMetadata, rechartsVersion: string): Promise<TestOutcome[]> {
    if (!metadata.integrationPath) {
        throw new Error(`Direct test "${metadata.name}" missing required integrationPath`);
    }
    const Controller = getControllerConstructor(metadata.packageManager);
    return await runDirectDependencyAppTest(new Controller(metadata.integrationPath), rechartsVersion);
}

export async function runTest(testName: string, rechartsVersion: string): Promise<TestOutcome[]> {
    // First try to get metadata from registry
    const metadata = getTestMetadata(testName);

    if (!metadata) {
        throw new Error(`Test "${testName}" not found in registry.`);
    }
    if (metadata.type === 'library') {
        return await runLibraryTest(metadata, rechartsVersion);
    } else if (metadata.type === 'direct') {
        return await runDirectDependencyTest(metadata, rechartsVersion);
    } else {
        throw new Error(`Unknown test type: ${(metadata as TestMetadata).type}`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    if (process.argv.length < 3 || process.argv.length > 4) {
        console.error('Usage: node scripts/run.mts <absolute-path> [<recharts-version>]');
        process.exit(1);
    }

    const absolutePath = process.argv[2];
    const rechartsVersion = process.argv[3];

    const results = await runTest(absolutePath, rechartsVersion);

    const errors = results.filter(result => result.success === false);
    const skipped = results.filter(result => result.success == null);
    const passed = results.filter(result => result.success === true);

    if (passed.length > 0) {
        passed.forEach(result => {
            console.log(`✅ ${result.name}`);
        });
    }

    if (skipped.length > 0) {
        skipped.forEach(result => {
            console.warn(`⏭️  ${result.name}: ${result.error}`);
        });
    }

    if (errors.length > 0) {
        errors.forEach(result => {
            console.error(`❌ ${result.name}: ${result.error}`);
        });
        process.exit(1);
    }
    if (passed.length === 0 && skipped.length === 0) {
        console.error('No tests were run.');
        process.exit(1);
    }
    process.exit(0);
}
