const path = require("path");

exports.tgzFileNameToPackageJsonReference = function tgzFileNameToPackageJsonReference(absolutePath, tgzFileName) {
    return 'file:' + path.join(absolutePath, tgzFileName);
}
