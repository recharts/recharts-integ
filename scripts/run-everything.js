const {listAllTests} = require("../list.js");
const {run} = require("./run.js");
const fs = require("fs");

if (require.main === module) {
    const outputPath = process.argv[2];
    if (!outputPath) {
        console.error('Usage: node scripts/run-everything.js <output-path>');
        process.exit(1);
    }
    const version = process.argv[3] || null;
    const tests = listAllTests(false)

    const output = tests.map((name, index) => {
        console.log(`running test ${name} (${index + 1} of ${tests.length})`);
        const results = run(name, version).map(result => {
            // Error by default serializes to an empty object, so we need to handle it explicitly
            let errorInfo;
            if (result.error instanceof Error) {
                errorInfo = result.error.message || String(result.error)
            } else {
                errorInfo = result.error || null;
            }
            return {
                name: result.name,
                success: result.success,
                error: errorInfo
            };
        });
        return { name, results };
    })

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
}
