const fs = require('fs');
const path = require('path');
const {Controller} = require("./Controller");
const {execSync} = require("child_process");
const {TestResult} = require("./TestResult");

class YarnController extends Controller {

    clean() {
        super.clean()
        /*
         * Clean yarn cache too because yarn caches tgz files too based on the filename,
         * and it makes some tests fail because the tgz file name is the same
         * but contents are different.
         */
        this.execSync('yarn cache clean')
        return TestResult.ok('clean');
    }

    /**
     * This function will install all dependencies in the given directory using Yarn.
     */
    install() {
        /*
         * Install dependencies using Yarn.
         * Yarn automatically manages the yarn.lock file.
        */
        try {
            this.execSync('yarn install');
            return TestResult.ok('install');
        } catch (e) {
            return TestResult.fail('install', e);
        }
    }

    /**
     * This function will run the tests in the given directory using Yarn,
     * if a test script is present in the package.json file.
     */
    test() {
        const packageJsonPath = path.join(this.absolutePath, 'package.json');

        // yarn does not support the --if-present option so we have to parse the package.json file
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
                return TestResult.fail('unit test', e);
            }
        } catch (error) {
            console.error(`Error reading or parsing package.json at ${packageJsonPath}: ${error.message}. Skipping 'yarn run test'.`);
            return TestResult.fail('unit test', error);
        }
    }

    /**
     * This function will run the build script in the given directory using Yarn,
     * if a build script is present in the package.json file.
     */
    build() {
        try {
            this.execSync('yarn run build');
            return TestResult.ok('build');
        } catch (e) {
            return TestResult.fail('build', e);
        }
    }

    /**
     * This function will create a tgz file using Yarn and return the name of the file prefixed with file:
     * so that it is ready to be used in the package.json file.
     * @returns {string} The file reference created by yarn pack to be used in the package.json file.
     */
    pack() {
        const output = this.execSync('yarn pack --json').trim();
        try {
            // Parse the JSON output from yarn pack --json
            const jsonOutput = JSON.parse(output);
            if (jsonOutput.type === 'success' && jsonOutput.data) {
                // Extract the tgz filename from the path in the response
                const tgzPath = jsonOutput.data.match(/"(.+\.tgz)"/)[1];
                return `file:${tgzPath}`
            } else {
                throw new Error(`Unexpected output format from yarn pack: ${output}`);
            }
        } catch (error) {
            console.error(`Error parsing yarn pack output: ${error.message}`);
            throw error;
        }
    }

    /**
     * This function will verify that the given dependency is installed
     * and that it's only installed once in a single version using Yarn.
     *
     * If the dependency is not installed, it will throw an error.
     *
     * If the dependency is installed in multiple versions, it will throw an error.
     *
     * @param {string} dependencyName The name of the dependency to verify.
     * @returns {TestResult} The result of the verification.
     */
    verifySingleDependencyVersion(dependencyName) {
        const command = `yarn list --pattern "${dependencyName}" --json --no-progress`;
        let rawOutput;

        try {
            rawOutput = execSync(command, { encoding: 'utf-8', cwd: this.absolutePath, stdio: 'pipe', env: this.getEnv() });
        } catch (error) {
            // 'yarn list' exits with a non-zero code if the package is not found or other errors.
            // error.stdout might contain partial output.
            // error.stderr contains error messages.
            rawOutput = error.stdout || ""; // Prefer stdout content if available.
            const errOutput = error.stderr || "";

            // Check if stderr indicates the package was not found.
            if (errOutput.includes(`Package "${dependencyName}" not found`) || errOutput.includes(`pattern "${dependencyName}" did not match any packages`)) {
                return TestResult.fail(dependencyName, new Error(`Dependency ${dependencyName} is not installed.`));
            }
            // If it's another error, but we got some stdout, we'll try to parse it.
            // If stdout is empty, and it wasn't a "not found" error, the parsing below will likely result in 0 versions found.
        }

        if (!rawOutput) {
            return TestResult.fail(dependencyName, new Error(`No output received from 'yarn list' command for ${dependencyName}.`));
        }
        const installedVersions = this.parseYarnListOutput(rawOutput, dependencyName);

        if (installedVersions.size === 0) {
            // This condition is met if the package was not found (either by execSync error or by parsing yielding no versions).
            return TestResult.fail(dependencyName, new Error(`Dependency ${dependencyName} is not installed or no versions could be identified.`));
        }

        if (installedVersions.size > 1) {
            return TestResult.fail(dependencyName, new Error(`Multiple versions of ${dependencyName} are installed: ${Array.from(installedVersions).join(', ')}`));
        }

        console.log(`Dependency ${dependencyName} is installed with a single version: ${Array.from(installedVersions)[0]}`);
        return TestResult.ok(dependencyName);
    }

    /**
     *
     * @param {string} rawOutput from `yarn list --json` stdout
     * @param {string} dependencyName The name of the dependency to parse versions for.
     * @returns {Set<string>} A set of installed versions of the specified dependency.
     */
    parseYarnListOutput(rawOutput, dependencyName) {
        /**
         * @type {Set<string>}
         */
        const installedVersions = new Set();
        const lines = rawOutput.trim().split('\n');

        /**
         * Helper function to process a package and its children recursively
         * @param {Object} pkg The package object from yarn list
         */
        const processPackage = (pkg) => {
            /**
             * pkg.name is typically "packageName@versionString" or "@scope/packageName@versionString"
             * @type {string[]}
             */
            const nameParts = pkg.name.split('@');
            if (nameParts.length < 2) return; // Malformed entry, skip.

            const version = nameParts.pop(); // The last part is the version.
            const name = nameParts.join('@'); // The rest joined is the package name.

            if (name === dependencyName) {
                installedVersions.add(version);
            }

            // Process children recursively if they exist
            if (pkg.children && Array.isArray(pkg.children)) {
                pkg.children.forEach(child => processPackage(child));
            }
        };

        lines.forEach(line => {
            try {
                const entry = JSON.parse(line);
                // Yarn list --json output stream contains objects; those of type 'tree' list dependencies.
                if (entry.type === 'tree' && entry.data && entry.data.trees) {
                    entry.data.trees.forEach(pkg => processPackage(pkg));
                }
            } catch (e) {
                // Silently ignore lines that are not valid JSON or don't match the expected structure.
                // These could be info lines or other non-data messages from yarn.
            }
        });
        return installedVersions;
    }
}

exports.YarnController = YarnController;