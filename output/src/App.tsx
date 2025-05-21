import {useEffect, useState} from 'react'
import {Bar, BarChart, CartesianGrid, XAxis, YAxis} from "recharts";

type UnitTestResult = {
    name: string,
    success: boolean,
}

type TestResult = {
    name: string,
    results: ReadonlyArray<UnitTestResult>,
}

type Details = {
    name: string,
    score: number,
}

const dependencies = [
    'react',
    'react-dom',
    'recharts',
    'react-redux',
    '@reduxjs/toolkit',
]

function calculateScore(input: TestResult): number {
    const installWorked = input.results.some((result) => result.name === 'install' && result.success);
    if (!installWorked) {
        return 0;
    }
    const buildWorked = input.results.some((result) => result.name === 'build' && result.success);
    if (!buildWorked) {
        return 1;
    }
    const testWorked = input.results.some((result) => result.name === 'unit test' && result.success);
    if (!testWorked) {
        return 2;
    }
    const uniqueDependenciesWorked = input.results.filter((result) => dependencies.includes(result.name))
        .every((result) => result.success);
    if (!uniqueDependenciesWorked) {
        return 3;
    }
    return 4;
}

function calculateDetails(input: TestResult): Details {
    const score = calculateScore(input)

    return {
        name: input.name,
        score: score,
    };
}

const tickFormatter = (value: unknown) => {
    switch (value) {
        case 0:
            return 'Failed to install';
        case 1:
            return 'Install worked';
        case 2:
            return 'Build worked';
        case 3:
            return 'Test worked';
        case 4:
            return 'Dependencies unique';
        default:
            return 'Unknown';
    }
}

const ticks = [0, 1, 2, 3, 4];

function App() {
    const [details, setDetails] = useState<ReadonlyArray<Details> | null>(null);
    useEffect(() => {
        fetch("./public/output.json").then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Network response was not ok.");
        })
            .then((body: ReadonlyArray<TestResult>) => {
                const details = body.map(calculateDetails);
                setDetails(details);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, [])

    if (details == null) {
        return <div>Loading...</div>;
    }
    console.log({details})

    return (
        <>
            <BarChart width={1000} height={300} data={details} layout='vertical' margin={{left: 250}}>
                <CartesianGrid/>
                <Bar dataKey="score" fill="#8884d8"/>
                <XAxis dataKey='score' type='number' ticks={ticks} interval={0} tickFormatter={tickFormatter}/>
                <YAxis dataKey='name' type='category'/>
            </BarChart>
        </>
    )
}

export default App
