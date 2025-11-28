export class TestOutcome {
    name: string;
    error?: unknown;
    output?: string;

    constructor(name: string, error?: unknown, output?: string) {
        if (name == null) {
            throw new Error('name cannot be null');
        }
        this.name = name;
        this.error = error;
        this.output = output;
    }

    get success(): boolean {
        return this.error == null;
    }

    static ok(name: string): TestOutcome {
        return new TestOutcome(name);
    }

    static fail(name: string, error: unknown): TestOutcome {
        if (error instanceof Error && 'output' in error) {
            return new TestOutcome(name, error, String(error.output));
        }
        return new TestOutcome(name, error);
    }
}
