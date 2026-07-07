# Deno + package.json + React 19 + Recharts

Integration test that verifies Recharts renders under [Deno](https://deno.com)
when dependencies are declared in a **`package.json`** (Deno's npm-compatibility
mode) rather than `deno.json` imports.

This complements `deno-react19` (which uses `deno.json` + `npm:` specifiers) by
exercising Deno's other dependency-resolution path. It renders a `BarChart` with
`@testing-library/react` in a jsdom environment and asserts that an `<svg>` plus
the expected bar rectangles are produced.

## Run

```sh
deno install
deno task test
```
