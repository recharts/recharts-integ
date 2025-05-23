const {listAllTests} = require("../list.js");
const {run} = require("./run.js");
const fs = require("fs");

if (require.main === module) {
    const outputPath = process.argv[2];
    if (!outputPath) {
        console.error('Usage: node scripts/run-everything.js <output-path>');
        process.exit(1);
    }
    const tests = listAllTests(false)

    const output = tests.map(name => {
        console.log('running test', name);
        const results = run(name).map(result => ({ name: result.name, success: result.success, error: result.error }));
        return { name, results };
    })

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
}
