const {Controller} = require("./Controller");
const {TestResult} = require("./TestResult");

class NpmController extends Controller {

    /**
     * This function will install all dependencies in the given directory.
     */
    install() {
        /*
         * Install dependencies. In the integration test, we do not want to generate a package-lock.json file,
         * however `npm ls` will not work without it so we generate one anyway and remove it after.
        */
        try {
            this.execSync('npm install');
            return TestResult.ok('install');
        } catch (ex) {
            return TestResult.fail('install', ex);
        }

    }

    /**
     * This function will run the tests in the given directory,
     * if a test script is present in the package.json file.
     */
    test() {
        try {
            this.execSync('npm run test --if-present');
            return TestResult.ok('unit test');
        } catch (ex) {
            return TestResult.fail('unit test', ex);
        }
    }

    build() {
        try {
            this.execSync('npm run build');
            return TestResult.ok('build');
        } catch (ex) {
            return TestResult.fail('build', ex);
        }
    }

    pack() {
        return this.tgzFileNameToPackageJsonReference(this.execSync('npm pack').trim());
    }

    /**
     * This function will verify that the given dependency is installed
     * and that it's only installed once in a single version.
     *
     * If the dependency is not installed, it will throw an error.
     *
     * If the dependency is installed in multiple versions, it will throw an error.
     *
     * @param {string} dependencyName
     */
    verifySingleDependencyVersion(dependencyName) {
        // Get the list of all versions of the dependency installed
        const versions = this.execSync(`npm ls ${dependencyName} --json`);
        const parsedVersions = JSON.parse(versions);

        const installedVersions = new Set()

        function walkDependencies(dependencies) {
            for (const [key, value] of Object.entries(dependencies)) {
                // npm ls lists dependencies of dependencies, so let's skip the transitive ones
                if (key === dependencyName) {
                    installedVersions.add(value.version);
                }
                if (value.dependencies) {
                    walkDependencies(value.dependencies);
                }
            }
        }

        // Walk through the dependencies to find all versions of the dependency
        walkDependencies(parsedVersions.dependencies);

        // Check if there are multiple versions installed
        if (installedVersions.size > 1) {
            return TestResult.fail(dependencyName, new Error(`Multiple versions of ${dependencyName} are installed: ${Array.from(installedVersions).join(', ')}`));
        }

        console.log(`Dependency ${dependencyName} is installed and only one version is present: ${Array.from(installedVersions).join(', ')}`);
        return TestResult.ok(dependencyName);
    }
}

exports.NpmController = NpmController
