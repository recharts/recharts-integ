import { describe, expect, it } from "vitest";
import exampleOutput from "./pnpm-list-sample-output.json";
import { PnpmController } from "../../../server/scripts/PnpmController.ts";

describe("PnpmController", () => {
  it("should parse pnpm ls output to extract dependency versions", () => {
    const controller = new PnpmController("");
    const actual = controller.parsePnpmLsOutput(
      JSON.stringify(exampleOutput),
      "react",
    );
    const expected = new Set(["18.3.1", "19.1.0"]);
    // Convert sets to arrays for better comparison
    const actualArray = Array.from(actual).sort();
    const expectedArray = Array.from(expected).sort();
    expect(actualArray).toEqual(expectedArray);
  });
});
