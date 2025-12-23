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
    if (!(error instanceof Error)) {
      return new TestOutcome(name, error);
    }
    const output = [];
    if ("stdout" in error) {
      output.push(error.stdout);
    }
    if ("stderr" in error) {
      output.push(error.stderr);
    }
    if ("output" in error) {
      output.push(error.output);
    }
    return new TestOutcome(
      name,
      error,
      output
        .map(stringify)
        .map((chunk) => chunk.trim())
        .join("\n"),
    );
  }
}
