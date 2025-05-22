type UnitTestResult = {
    name: string,
    success: boolean,
}
export type TestResult = {
    name: string,
    results: ReadonlyArray<UnitTestResult>,
}
export type Details = {
    name: string,
    score: number,
}
export type ScatterPoint = {
    test: string,
    framework: string,
    success: boolean,
}