export class TestResult {
    name: string;
    error?: Error;

    constructor(name: string, error?: Error) {
        if (name == null) {
            throw new Error('name cannot be null');
        }
        this.name = name;
        this.error = error;
    }

    get success(): boolean {
        return this.error == null;
    }

    static ok(name: string): TestResult {
        return new TestResult(name);
    }

    static fail(name: string, error: Error): TestResult {
        return new TestResult(name, error);
    }
}
