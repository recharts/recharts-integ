const path = require("path");

const {NpmController} = require("./NpmController.js");
const {YarnController} = require("./YarnController");

function verifyAllSingleDependencyVersions(controller) {
    return [
        controller.verifySingleDependencyVersion('recharts'),
        controller.verifySingleDependencyVersion('react'),
        controller.verifySingleDependencyVersion('react-dom'),
        controller.verifySingleDependencyVersion('react-redux'),
        controller.verifySingleDependencyVersion('@reduxjs/toolkit')
    ]
}

function runDirectDependencyAppTest(controller, rechartsVersion) {
    return [
        controller.clean(),
        controller.replacePackageJsonVersion("recharts", rechartsVersion),
        controller.install(),
        controller.test(),
        controller.build(),
        ...verifyAllSingleDependencyVersions(controller)
    ]
}

function runLibraryInLibraryTest(libController, appController, rechartsVersion) {
    libController.clean();
    libController.replacePackageJsonVersion("recharts", rechartsVersion);
    libController.install();
    libController.test();
    libController.build();
    verifyAllSingleDependencyVersions(libController)
    const myChartsTgzFile = libController.pack()

    return [
        appController.clean(),
        appController.replacePackageJsonVersion("my-charts", myChartsTgzFile),
        appController.install(),
        appController.test(),
        appController.build(),
        ...verifyAllSingleDependencyVersions(appController)
    ]
}

function runTest(absolutePath, rechartsVersion) {
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

    console.table(results);

    const errors = results.filter(result => !result.success);

    if (errors.length > 0) {
        console.error(`${errors.length} tests failed:`);
        errors.forEach(error => {
            console.error(`- ${error.name}: ${error.message}`);
        });
        process.exit(1);
    } else {
        console.log(`${results.length} tests passed successfully.`);
    }
}
