class TestResult {
    constructor(name, error) {
        if (name == null) {
            throw new Error('name cannot be null');
        }
        this.name = name;
        this.error = error;
    }

    get success() {
        return this.error == null;
    }

    /**
     * @param {string} name
     * @returns {TestResult}
     */
    static ok(name) {
        return new TestResult(name)
    }

    /**
     * @param {string} name
     * @param {Error} error
     * @returns {TestResult}
     */
    static fail(name, error) {
        return new TestResult(name, error)
    }
}

exports.TestResult = TestResult