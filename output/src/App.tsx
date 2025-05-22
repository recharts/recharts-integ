import {useEffect, useState} from 'react'
import {Bar, BarChart, CartesianGrid, Legend, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis} from "recharts";
import type {Details, ScatterPoint, TestResult} from "./types.ts";
import Collapsible from "./Collapsible.tsx";
import type {TooltipContentProps} from "recharts/types/component/Tooltip";

const dependencies = [
    'react',
    'react-dom',
    'recharts',
    'react-redux',
    '@reduxjs/toolkit',
]

type Filters = {
    packageManagers: string[];
    reactVersions: string[];
    testTypes: string[];
}

// Helper functions for filtering
function extractPackageManager(framework: string): string {
    return framework.split(':')[0];
}

function extractReactVersion(framework: string): string {
    const match = framework.match(/react(\d+)/);
    return match ? `React ${match[1]}` : 'Unknown';
}

function applyFilters(data: ReadonlyArray<TestResult>, filters: Filters): ReadonlyArray<TestResult> {
    return data.filter(result => {
        const packageManager = extractPackageManager(result.name);
        const reactVersion = extractReactVersion(result.name);

        const passesPackageManager = filters.packageManagers.length === 0 ||
            filters.packageManagers.includes(packageManager);

        const passesReactVersion = filters.reactVersions.length === 0 ||
            filters.reactVersions.includes(reactVersion);

        return passesPackageManager && passesReactVersion;
    });
}

function filterScatterData(data: ScatterPoint[], filters: Filters): ScatterPoint[] {
    return data.filter(point => {
        const packageManager = extractPackageManager(point.framework);
        const reactVersion = extractReactVersion(point.framework);

        const passesPackageManager = filters.packageManagers.length === 0 ||
            filters.packageManagers.includes(packageManager);

        const passesReactVersion = filters.reactVersions.length === 0 ||
            filters.reactVersions.includes(reactVersion);

        const passesTestType = filters.testTypes.length === 0 ||
            filters.testTypes.includes(point.test);

        return passesPackageManager && passesReactVersion && passesTestType;
    });
}

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

    return scatterData;
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

const CustomTooltip = ({active, payload}: TooltipContentProps) => {
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

// Filter component
const FilterForm = ({
                        availableFilters,
                        selectedFilters,
                        onFilterChange
                    }: {
    availableFilters: {
        packageManagers: string[],
        reactVersions: string[],
        testTypes: string[]
    },
    selectedFilters: Filters,
    onFilterChange: (newFilters: Filters) => void
}) => {
    const handleCheckboxChange = (filterType: keyof Filters, value: string) => {
        const currentValues = [...selectedFilters[filterType]];
        const index = currentValues.indexOf(value);

        if (index === -1) {
            currentValues.push(value);
        } else {
            currentValues.splice(index, 1);
        }

        onFilterChange({
            ...selectedFilters,
            [filterType]: currentValues
        });
    };

    const filterSection = (title: string, filterType: keyof Filters, options: string[]) => (
        <div style={{marginBottom: '20px'}}>
            <h3 style={{margin: '10px 0'}}>{title}</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                {options.map(option => (
                    <label key={option} style={{display: 'flex', alignItems: 'center', marginRight: '15px'}}>
                        <input
                            type="checkbox"
                            checked={selectedFilters[filterType].includes(option)}
                            onChange={() => handleCheckboxChange(filterType, option)}
                            style={{marginRight: '5px'}}
                        />
                        {option}
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {filterSection('Package Manager', 'packageManagers', availableFilters.packageManagers)}
            {filterSection('React Version', 'reactVersions', availableFilters.reactVersions)}
            {filterSection('Test Type', 'testTypes', availableFilters.testTypes)}
        </>
    );
};

function App() {
    const [rawData, setRawData] = useState<ReadonlyArray<TestResult> | null>(null);
    const [scatterData, setScatterData] = useState<ScatterPoint[] | null>(null);
    const [filteredDetails, setFilteredDetails] = useState<ReadonlyArray<Details> | null>(null);
    const [filteredScatterData, setFilteredScatterData] = useState<ScatterPoint[] | null>(null);
    const [availableFilters, setAvailableFilters] = useState<{
        packageManagers: string[];
        reactVersions: string[];
        testTypes: string[];
    }>({
        packageManagers: [],
        reactVersions: [],
        testTypes: []
    });
    const [selectedFilters, setSelectedFilters] = useState<Filters>({
        packageManagers: [],
        reactVersions: [],
        testTypes: []
    });

    useEffect(() => {
        fetch("./public/output.json").then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Network response was not ok.");
        })
            .then((body: ReadonlyArray<TestResult>) => {
                setRawData(body);

                const details = body.map(calculateDetails);
                setFilteredDetails(details);

                const scatterPoints = generateScatterData(body);
                setScatterData(scatterPoints);
                setFilteredScatterData(scatterPoints);

                // Extract available filter options
                const packageManagers: string[] = [...new Set(body.map(item => extractPackageManager(item.name)))];
                const reactVersions: string[] = [...new Set(body.map(item => extractReactVersion(item.name)))];
                const testTypes: string[] = [...new Set(scatterTicks)];

                const filters: { packageManagers: string[]; reactVersions: string[]; testTypes: string[] } = {
                    packageManagers,
                    reactVersions,
                    testTypes
                };
                setAvailableFilters(filters);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, [])

    useEffect(() => {
        if (rawData && scatterData) {
            const filtered = applyFilters(rawData, selectedFilters);
            setFilteredDetails(filtered.map(calculateDetails));
            setFilteredScatterData(filterScatterData(scatterData, selectedFilters));
        }
    }, [selectedFilters, rawData, scatterData]);

    if (!filteredDetails || !filteredScatterData) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <h1>Test Results Dashboard</h1>

            <Collapsible title='Filters'>
                <FilterForm
                    availableFilters={availableFilters}
                    selectedFilters={selectedFilters}
                    onFilterChange={setSelectedFilters}
                />
            </Collapsible>

            <Collapsible title="Test score Summary">
                <BarChart width={1000}
                          height={500}
                          data={filteredDetails}
                          layout='vertical'
                          margin={{left: 250, bottom: 80, right: 20}}>
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
            </Collapsible>

            <Collapsible title="Detailed Test Results">
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
                        interval={0}
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
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{paddingTop: 30}}
                    />
                    <Scatter
                        name="Success"
                        data={filteredScatterData.filter(d => d.success)}
                        fill="#4CAF50"
                        shape="star"
                    />
                    <Scatter
                        name="Failure"
                        data={filteredScatterData.filter(d => !d.success)}
                        fill="#F44336"
                        shape="diamond"
                    />
                </ScatterChart>
            </Collapsible>
        </>
    )
}

export default App