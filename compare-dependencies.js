// this script will compare two projects' NPM dependencies
// usage: ./compare-dependencies.js <folder1> <folder2>

import {execSync} from 'child_process';
import path from 'path';
import os from 'os';

function getInstalledDependencies(folder) {
    const resolvedFolder = path.resolve(folder.replace(/^~($|\/|\\)/, `${os.homedir()}$1`));
    return JSON.parse(execSync(`npm ls --json`, {
        cwd: resolvedFolder,
    }).toString()).dependencies;
}

const folder1 = process.argv[2];
const folder2 = process.argv[3];

if (!folder1 || !folder2) {
    console.error('Usage: ./compare-dependencies.js <folder1> <folder2>');
    process.exit(1);
}

const dependencies1 = getInstalledDependencies(folder1);
const dependencies2 = getInstalledDependencies(folder2);

const sharedDependencies = Object.keys(dependencies1).filter(dep => dependencies2[dep]);

for (const dep of sharedDependencies) {
    if (dependencies1[dep].version !== dependencies2[dep].version) {
        console.log(`DIFF ${dep}: ${dependencies1[dep].version} vs ${dependencies2[dep].version}`)
    } else {
        console.log(`SAME ${dep}: ${dependencies1[dep].version}`);
    }
}