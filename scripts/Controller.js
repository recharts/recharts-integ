const {execSync} = require('child_process');
const {replacePackageVersion} = require("./replacePackageVersion");
const {tgzFileNameToPackageJsonReference} = require('./tgzFileNameToPackageJsonReference.js');
const path = require("path");

exports.Controller = class Controller {
    constructor(absolutePath) {
        this.absolutePath = absolutePath;
    }

    execSync(cmd) {
        return execSync(cmd, {cwd: this.absolutePath, encoding: 'utf-8'});
    }

    replacePackageJsonVersion(dependencyName, version) {
        const packageJsonPath = path.join(this.absolutePath, 'package.json');
        return replacePackageVersion(packageJsonPath, dependencyName, version)
    }

    tgzFileNameToPackageJsonReference(tgzFileName) {
        return tgzFileNameToPackageJsonReference(this.absolutePath, tgzFileName);
    }
}