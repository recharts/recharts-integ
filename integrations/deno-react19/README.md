# Deno + React 19 + Recharts

Integration test that verifies Recharts renders under [Deno](https://deno.com)
using `npm:` specifiers (no `npm install` / `node_modules` required).

It renders a `BarChart` with `@testing-library/react` in a jsdom environment and
asserts that an `<svg>` and the expected bar rectangles are produced.

## Run

```sh
deno task test
```

Deno reads dependencies from `deno.json` and resolves `react`, `react-dom`,
`recharts`, and `@testing-library/react` straight from npm.
