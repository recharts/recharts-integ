const path = require("path");

const {NpmController} = require("./NpmController.js");
const {YarnController} = require("./YarnController");

/**
 * @param {Controller} controller
 * @returns {TestResult[]}
 */
function verifyAllSingleDependencyVersions(controller) {
    return [
        controller.verifySingleDependencyVersion('recharts'),
        controller.verifySingleDependencyVersion('react'),
        controller.verifySingleDependencyVersion('react-dom'),
        controller.verifySingleDependencyVersion('react-redux'),
        controller.verifySingleDependencyVersion('@reduxjs/toolkit')
    ]
}

/**
 * @param {Controller} controller
 * @param {string} rechartsVersion
 * @returns {TestResult[]}
 */
function runDirectDependencyAppTest(controller, rechartsVersion) {
    /**
     * @type {TestResult[]}
     */
    const results = []

    results.push(controller.clean())
    results.push(controller.replacePackageJsonVersion("recharts", rechartsVersion))
    const installResult = controller.install()
    results.push(installResult)
    if (!installResult.success) {
        console.warn('Failed to install the app. Skipping test and build checks because those are guaranteed to fail too!');
        return results;
    }
    results.push(controller.test())
    results.push(controller.build())
    results.push(...verifyAllSingleDependencyVersions(controller))
}

/**
 *
 * @param {Controller} libController
 * @param {Controller} appController
 * @param {string} rechartsVersion
 * @returns {TestResult[]}
 */
function runLibraryInLibraryTest(libController, appController, rechartsVersion) {
    libController.clean();
    libController.replacePackageJsonVersion("recharts", rechartsVersion);
    libController.install();
    libController.test();
    libController.build();
    verifyAllSingleDependencyVersions(libController)
    const myChartsTgzFile = libController.pack()

    /**
     * @type {TestResult[]}
     */
    const results = []

    results.push(appController.clean())
    results.push(appController.replacePackageJsonVersion("my-charts", myChartsTgzFile))
    const installResult = appController.install()
    results.push(installResult)
    if (!installResult.success) {
        console.warn('Failed to install the app. Skipping test and build checks because those are guaranteed to fail too!');
        return results
    }

    results.push(appController.test())
    results.push(appController.build())
    results.push(...verifyAllSingleDependencyVersions(appController))
    return results;
}

/**
 * @param {string} packageManager
 * @returns {Controller}
 */
function getControllerConstructor(packageManager) {
    if (packageManager === "npm") {
        return NpmController;
    } else if (packageManager === "yarn") {
        return YarnController;
    } else {
        throw new Error(`Unknown package manager: ${packageManager}`);
    }
}

function runLibraryTest(testName, rechartsVersion) {
    const [packageManager, library, app] = testName.split(":");
    const libPath = path.join(__dirname, "../libraries", library);
    const appPath = path.join(__dirname, "../apps-3rd-party", app);
    const Controller = getControllerConstructor(packageManager);
    return runLibraryInLibraryTest(new Controller(libPath), new Controller(appPath), rechartsVersion);
}

function runDirectDependencyTest(testName, rechartsVersion) {
    const [packageManager, testType] = testName.split(":");
    const Controller = getControllerConstructor(packageManager);
    return runDirectDependencyAppTest(new Controller(testType), rechartsVersion);
}

/**
 * @param {string} testName
 * @param {string | undefined} rechartsVersion
 * @returns {TestResult[]}
 */
function runTest(testName, rechartsVersion) {
    if (testName.split(":").length > 2) {
        return runLibraryTest(testName, rechartsVersion);
    }
    if (testName.split(":").length === 2) {
        return runDirectDependencyTest(testName, rechartsVersion);
    }

    const absolutePath = path.resolve(__dirname, "../", testName);
    if (absolutePath.includes('npm')) {
        return runDirectDependencyAppTest(new NpmController(absolutePath), rechartsVersion);
    } else if (absolutePath.includes('yarn')) {
        return runDirectDependencyAppTest(new YarnController(absolutePath), rechartsVersion);
    } else if (absolutePath.includes('library-inside-library')) {
        const libPath = path.join(absolutePath, 'my-charts');
        const appPath = path.join(absolutePath, 'app');
        return runLibraryInLibraryTest(new NpmController(libPath), new NpmController(appPath), rechartsVersion);
    } else {
        console.error('Unknown test type. Please provide a valid test path.');
        process.exit(1);
    }
}

exports.run = runTest;

if (require.main === module) {
    if (process.argv.length < 3 || process.argv.length > 4) {
        console.error('Usage: node scripts/run.js <absolute-path> [<recharts-version>]');
        process.exit(1);
    }

    const absolutePath = process.argv[2];
    const rechartsVersion = process.argv[3];

    const results = runTest(absolutePath, rechartsVersion);

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
