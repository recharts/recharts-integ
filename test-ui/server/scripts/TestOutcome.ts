function stringify(output: unknown): string {
  if (output == null) {
    return "";
  }
  if (typeof output === "string") {
    return output;
  }
  if (Array.isArray(output)) {
    return output.map((item) => stringify(item)).join("\n");
  }
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}

export class TestOutcome {
  name: string;
  error?: unknown;
  output?: string;

  constructor(name: string, error?: unknown, output?: string) {
    if (name == null) {
      throw new Error("name cannot be null");
    }
    this.name = name;
    this.error = error;
    this.output = output;
  }

  get success(): boolean {
    return this.error == null;
  }

  static ok(name: string, output?: string): TestOutcome {
    return new TestOutcome(name, undefined, output);
  }

  static fail(name: string, error: unknown): TestOutcome {
    if (error instanceof Error && "output" in error) {
      return new TestOutcome(name, error, stringify(error.output).trim());
    }
    if (error instanceof Error && "stdout" in error) {
      return new TestOutcome(name, error, stringify(error.stdout).trim());
    }
    if (error instanceof Error && "stderr" in error) {
      return new TestOutcome(name, error, stringify(error.stderr).trim());
    }
    return new TestOutcome(name, error);
  }
}
