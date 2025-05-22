import {useEffect, useState} from 'react'
import {Bar, BarChart, CartesianGrid, XAxis, YAxis, ScatterChart, Scatter, Tooltip, Legend, ZAxis} from "recharts";

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

type ScatterPoint = {
    test: string,
    framework: string,
    success: boolean,
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

const frameworkSortOrder = (a: string, b: string): number => {
    return b - a
};

const scatterTicks = ['install', 'unit test', 'build', 'recharts', 'react', 'react-dom', '@reduxjs/toolkit', 'react-redux'];

function generateScatterData(testResults: ReadonlyArray<TestResult>): ScatterPoint[] {
    const scatterData: ScatterPoint[] = [];

    testResults
        .forEach(result => {
            result.results
                .filter(test => scatterTicks.includes(test.name))
                .forEach(test => {
                    scatterData.push({
                        test: test.name,
                        framework: result.name,
                        success: test.success,
                    });
                });
        });

    return scatterData.sort((a, b) => {
        return a - b
    })
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

const CustomTooltip = ({active, payload}: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{backgroundColor: '#333', padding: '10px', border: '1px solid #ccc'}}>
                <p><strong>Framework:</strong> {data.framework}</p>
                <p><strong>Test:</strong> {data.test}</p>
                <p><strong>Status:</strong> {data.success ? 'Success' : 'Failed'}</p>
            </div>
        );
    }
    return null;
};

function App() {
    const [details, setDetails] = useState<ReadonlyArray<Details> | null>(null);
    const [scatterData, setScatterData] = useState<ScatterPoint[] | null>(null);

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
                setScatterData(generateScatterData(body));
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, [])

    if (details == null || scatterData == null) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <h2>Test Score Summary</h2>
            <BarChart width={1000} height={500} data={details} layout='vertical' margin={{left: 250, bottom: 80, right: 20}}>
                <CartesianGrid/>
                <Bar dataKey="score" fill="#8884d8"/>
                <XAxis dataKey='score'
                       type='number'
                       ticks={ticks}
                       angle={-25}
                       interval={0}
                       textAnchor="end"
                       tickFormatter={tickFormatter}/>
                <YAxis dataKey='name'
                       type='category'
                       interval={0}
                />
            </BarChart>

            <h2>Detailed Test Results</h2>
            <ScatterChart
                width={1000}
                height={500}
                margin={{top: 20, right: 20, bottom: 80, left: 250}}
            >
                <XAxis
                    dataKey="test"
                    type="category"
                    allowDuplicatedCategory={false}
                    name="Test"
                    angle={-25}
                    textAnchor="end"
                    tick={{fontSize: 12}}
                />
                <YAxis
                    dataKey="framework"
                    type="category"
                    allowDuplicatedCategory={false}
                    interval={0}
                    name="Framework"
                    width={240}
                    scale="band"
                />
                <ZAxis type='number' range={[200, 200]}/>
                <Tooltip content={<CustomTooltip/>} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{paddingTop: 30}}
                />
                <Scatter
                    name="Success"
                    data={scatterData.filter(d => d.success)}
                    fill="#4CAF50"
                    shape="star"
                />
                <Scatter
                    name="Failure"
                    data={scatterData.filter(d => !d.success)}
                    fill="#F44336"
                    shape="diamond"
                />
            </ScatterChart>
        </>
    )
}

export default App