# Recharts Peer Dependencies Testing

## Recharts variants

Okay so we have the default recharts in version 3.0.0-beta.1. This version has everything in `dependencies`.
No `peerDependencies`.

Next I will create variants with different definitions of `dependencies` and `peerDependencies`.

Variants:
- `peerDependencies-react`: only `react` in `peerDependencies`, everything else in `dependencies`
- `peerDependencies-react-dom`: `react` + `react-dom` in `peerDependencies`, everything else in `dependencies`
- `peerDependencies-react-dom-is`: `react` + `react-dom` + `react-is` in `peerDependencies`, everything else in `dependencies`
- `peerDependencies-only`: all dependencies in `peerDependencies`

Each of these variants gets its own .tgz file and its own json file with test results.

Now I will run one "everything" script for each variant:

```shell
node scripts/run-everything.js output/public/baseline.json
node scripts/run-everything.js output/public/peerDependencies-react.json $(realpath ../recharts/recharts.peerDependencies-react.tgz)
node scripts/run-everything.js output/public/peerDependencies-react-dom.json $(realpath ../recharts/recharts.peerDependencies-react-dom.tgz)
node scripts/run-everything.js output/public/peerDependencies-react-dom-is.json $(realpath ../recharts/recharts.peerDependencies-react-dom-is.tgz)
node scripts/run-everything.js output/public/peerDependencies-only.json $(realpath ../recharts/recharts.peerDependencies-only.tgz)
```

## App variants

We have two basic app variants:
1. App that depends directly on Recharts
2. App that depends on Recharts via a library (called `my-charts`) that has Recharts as a dependency

Each of these two variants has sub-variants for different React versions.
The library variants also have sub-sub-variants where the library has multiple React versions as peer dependencies,
and the app depends on various different React versions.

Then there are three specialties:
- `ts-react16` uses just the usual vanilla package.json
- `ts-react-overrides` has a special `overrides` section in package.json to force installation of React 16
  - this works with npm but not yarn
  - https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides
- `ts-react-resolutions` has a special `resolutions` section in package.json to force installation of React 16
  - this works with yarn but not npm
  - https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/

This creates a total of 28 different app variants.

## Running the tests

I made a script that runs all the tests for all the app variants against all the Recharts variants.
The source code is in https://github.com/recharts/recharts-integ/tree/main/scripts and it's thoroughly uninteresting node.js code so let's look at the results instead.

There are 5 recharts variants and 28 app variants, so we have 140 combinations to test.

## Baseline

Everything yarn fails because yarn installs the latest React 19 from recharts. Does not attempt to dedupe.

`npm:my-charts-react16:app-react16` and `npm:my-charts-react19:app-react17` are the same, install React 19 from recharts. Fails to run unit tests as a result.

The ts-react16 app with overrides package.json passes the npm test but not yarn test, as expected.
Also as expected, the ts-react16 app with resolutions package.json passes the yarn test but not npm test.
ts-react16 app with no overrides or resolutions fails with both npm and yarn tests, as expected.

| Framework | install | unit test | build | recharts | react | react-dom | @reduxjs/toolkit | react-redux |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| npm:integrations/ts-react16 | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-resolutions | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts4-react17 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:integrations/ts-react16-overrides | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:integrations/ts-react16-resolutions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react18 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts4-react17 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react18:app-react18 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react19:app-react18 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| yarn:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## React in peerDependencies

npm with react16 fails to run `npm ls react`, it says invalid react@16.14.0? Not sure what that means.

`yarn:integrations/ts-react16` and other yarn test install multiple versions of react-dom and fail to run unit tests as a result.

| Framework | install | unit test | build | recharts | react | react-dom | @reduxjs/toolkit | react-redux |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| npm:integrations/ts-react16 | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-resolutions | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts4-react17 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:integrations/ts-react16-resolutions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts4-react17 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| yarn:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## React + react-dom in peerDependencies

| Framework | install | unit test | build | recharts | react | react-dom | @reduxjs/toolkit | react-redux |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| npm:integrations/ts-react16 | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-resolutions | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts4-react17 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16-resolutions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts4-react17 | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## React + react-dom + react-is in peerDependencies

| Framework | install | unit test | build | recharts | react | react-dom | @reduxjs/toolkit | react-redux |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| npm:integrations/ts-react16 | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-resolutions | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts4-react17 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16-resolutions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts4-react17 | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react16:app-react16 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react17:app-react16 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react17:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react18:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react19:app-react17 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## All dependencies in peerDependencies

As expected, everything yarn fails because yarn does not install peer dependencies by default.

| Framework | install | unit test | build | recharts | react | react-dom | @reduxjs/toolkit | react-redux |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| yarn:integrations/ts-react16 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:integrations/ts-react16-overrides | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:integrations/ts-react16-resolutions | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:integrations/ts-react18 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:integrations/ts-react19 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:integrations/ts4-react17 | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react16:app-react16 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react17:app-react16 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react17:app-react17 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react18:app-react17 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react18:app-react18 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react19:app-react17 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react19:app-react18 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| yarn:my-charts-react19:app-react19 | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |

## Summary

baseline isn't doing well.

Putting only react into `peerDependencies` is not helping, because it needs a matching `react-dom` version to work.

Putting everything into `peerDependencies` is not helping either, because yarn does not install peer dependencies by default.

So it appears to me that the best solution is to put `react`, `react-dom`, and `react-is` into `peerDependencies`, and everything else into `dependencies`.

| Framework | baseline.json | peerDependencies-only.json | peerDependencies-react-dom-is.json | peerDependencies-react-dom.json | peerDependencies-react.json |
| --- | --- | --- | --- | --- | --- |
| npm:integrations/ts-react16 | ❌ | ❌ | ❌ | ❌ | ❌ |
| npm:integrations/ts-react16-overrides | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react16-resolutions | ❌ | ❌ | ❌ | ❌ | ❌ |
| npm:integrations/ts-react18 | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts-react19 | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:integrations/ts4-react17 | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react16:app-react16 | ❌ | ❌ | ❌ | ❌ | ❌ |
| npm:my-charts-react17:app-react16 | ❌ | ❌ | ❌ | ❌ | ❌ |
| npm:my-charts-react17:app-react17 | ❌ | ❌ | ❌ | ❌ | ❌ |
| npm:my-charts-react18:app-react17 | ❌ | ❌ | ❌ | ❌ | ❌ |
| npm:my-charts-react18:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react17 | ❌ | ❌ | ❌ | ❌ | ❌ |
| npm:my-charts-react19:app-react18 | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm:my-charts-react19:app-react19 | ✅ | ✅ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react16 | ❌ | ❌ | ✅ | ✅ | ❌ |
| yarn:integrations/ts-react16-overrides | ❌ | ❌ | ✅ | ✅ | ❌ |
| yarn:integrations/ts-react16-resolutions | ✅ | ❌ | ✅ | ✅ | ✅ |
| yarn:integrations/ts-react18 | ❌ | ❌ | ✅ | ✅ | ❌ |
| yarn:integrations/ts-react19 | ✅ | ❌ | ✅ | ✅ | ✅ |
| yarn:integrations/ts4-react17 | ❌ | ❌ | ❌ | ❌ | ❌ |
| yarn:my-charts-react16:app-react16 | ❌ | ❌ | ❌ | ❌ | ❌ |
| yarn:my-charts-react17:app-react16 | ❌ | ❌ | ❌ | ❌ | ❌ |
| yarn:my-charts-react17:app-react17 | ❌ | ❌ | ❌ | ❌ | ❌ |
| yarn:my-charts-react18:app-react17 | ❌ | ❌ | ❌ | ❌ | ❌ |
| yarn:my-charts-react18:app-react18 | ❌ | ❌ | ✅ | ✅ | ❌ |
| yarn:my-charts-react19:app-react17 | ❌ | ❌ | ❌ | ❌ | ❌ |
| yarn:my-charts-react19:app-react18 | ❌ | ❌ | ✅ | ✅ | ❌ |
| yarn:my-charts-react19:app-react19 | ✅ | ❌ | ✅ | ✅ | ✅ |
