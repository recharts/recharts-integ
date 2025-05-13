/**
 * This script will accept a path to a package.json file, dependency name, and a version string,
 * and replace the version of the dependency in the package.json file.
 *
 * This script will attempt to replace both "dependencies" and "peerDependencies" in the package.json file,
 * and it will output success if it finds the dependency in either of them.
 * It will output an error if the dependency is not found in either of them.
 *
 * If you want to pass a filename instead of a version, then that filename should be
 * prefixed with `file:`.
 *
 * Usage: node scripts/replace-package-version.js <package.json-path> <dependency-name> <version>
 *
 * Example with a version:
 * node scripts/replace-package-version.js ./package.json react 18.0.0
 *
 * Example with a file:
 * node scripts/replace-package-version.js ./package.json react file:./react-18.0.0.tgz
 */

const fs = require('fs');

exports.replacePackageVersion = function(packageJsonPath, dependencyName, version) {
    if (version == null || version === '') {
        return;
    }

    // Read the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    let replaced = false;

    // First check if the dependency is in dependencies, then in peerDependencies
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
        // Dependency not found in either dependencies or peerDependencies
        console.error(`Dependency ${dependencyName} not found in ${packageJsonPath}`);
        return;
    }

    // Write the updated package.json back to the file
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

if (require.main === module) {
    if (process.argv.length < 5) {
        console.error('Usage: node scripts/replace-package-version.js <package.json-path> <dependency-name> <version>');
        process.exit(1);
    }

    const packageJsonPath = process.argv[2];
    const dependencyName = process.argv[3];
    const version = process.argv[4];

    exports.replacePackageVersion(packageJsonPath, dependencyName, version);
}
