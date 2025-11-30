import path from 'path';

export function tgzFileNameToPackageJsonReference(absolutePath: string, tgzFileName: string): string {
    return 'file:' + path.join(absolutePath, tgzFileName);
}
