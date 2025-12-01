import { PhaseName } from "../types.ts";

export const phaseOrder: ReadonlyArray<PhaseName> = [
  "clean",
  "setVersion",
  "install",
  "test",
  "build",
  "verify",
];
