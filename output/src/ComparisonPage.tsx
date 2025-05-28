import { useEffect, useState } from 'react';
import type { TestResult } from './types';
import Collapsible from './Collapsible.tsx';
// We will reuse or adapt filter components and logic from App.tsx
// For now, let's define a placeholder for the FilterForm and related types/functions

// Placeholder for types and functions that might be shared or adapted from App.tsx
type Filters = {
    packageManagers: string[];
    reactVersions: string[];
    selectedFileNames: string[]; // Added for file name filtering
};

// Helper functions for filtering (can be imported or redefined if kept separate)
function extractPackageManager(framework: string): string {
    return framework.split(':')[0];
}

function extractReactVersion(framework: string): string {
    const match = framework.match(/react(\d+)/);
    return match ? `React ${match[1]}` : 'Unknown';
}

function passesCommonFilters(framework: string, filters: Filters): boolean {
    const packageManager = extractPackageManager(framework);
    const reactVersion = extractReactVersion(framework);

    const passesPackageManager = filters.packageManagers.length === 0 ||
        filters.packageManagers.includes(packageManager);

    const passesReactVersion = filters.reactVersions.length === 0 ||
        filters.reactVersions.includes(reactVersion);

    return passesPackageManager && passesReactVersion;
}

// Simplified "passed" logic
function calculateOverallPassed(input: TestResult): boolean {
    return input.results.every(step => step.success)
}

// Placeholder for FilterForm - we might reuse/modify the one from App.tsx or create a simplified one
const FilterFormPlaceholder = ({
    availableFilters,
    selectedFilters,
    onFilterChange
}: {
    availableFilters: {
        packageManagers: string[];
        reactVersions: string[];
        allFileNames: string[]; // Added to pass available file names
    },
    selectedFilters: Filters,
    onFilterChange: (newFilters: Filters) => void
}) => {
    const handleCheckboxChange = (filterType: keyof Filters, value: string) => {
        const currentFilterValues = selectedFilters[filterType]; // This will be string[]
        const newFilterValues = [...currentFilterValues]; // Create a copy

        const index = newFilterValues.indexOf(value);
        if (index === -1) {
            newFilterValues.push(value);
        } else {
            newFilterValues.splice(index, 1);
        }

        onFilterChange({
            ...selectedFilters,
            [filterType]: newFilterValues
        });
    };

    const filterSection = (title: string, filterType: keyof Filters, options: string[]) => (
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '10px 0' }}>{title}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {options.map(option => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                        <input
                            type="checkbox"
                            checked={(selectedFilters[filterType] || []).includes(option)} // Ensure selectedFilters[filterType] is an array before calling includes
                            onChange={() => handleCheckboxChange(filterType, option)}
                            style={{ marginRight: '5px' }}
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
            {filterSection('Data Files', 'selectedFileNames', availableFilters.allFileNames)} {/* New filter section */}
        </>
    );
};


const fileNames = [
    'baseline.json',
    'peerDependencies-only.json',
    'peerDependencies-react-dom-is.json',
    'peerDependencies-react-dom.json',
    'peerDependencies-react.json',
];

type ComparisonData = {
    [framework: string]: {
        [fileName: string]: boolean | undefined; // true for pass, false for fail, undefined if not present
    };
};

function ComparisonPage() {
    const [allRawData, setAllRawData] = useState<{ [fileName: string]: ReadonlyArray<TestResult> }>({});
    const [comparisonTableData, setComparisonTableData] = useState<ComparisonData>({});
    const [markdownTable, setMarkdownTable] = useState<string>('');

    const [availableFilters, setAvailableFilters] = useState<{
        packageManagers: string[];
        reactVersions: string[];
        allFileNames: string[]; // Added
    }>({
        packageManagers: [],
        reactVersions: [],
        allFileNames: [...fileNames], // Initialize with all file names from the constant
    });
    const [selectedFilters, setSelectedFilters] = useState<Filters>({
        packageManagers: [],
        reactVersions: [],
        selectedFileNames: [...fileNames], // Default to all file names selected
    });

    useEffect(() => {
        Promise.all(
            fileNames.map(fileName =>
                fetch(`./public/${fileName}`)
                    .then(response => {
                        if (response.ok) return response.json();
                        throw new Error(`Failed to load ${fileName}`);
                    })
                    .then((data: ReadonlyArray<TestResult>) => ({ fileName, data }))
            )
        ).then(results => {
            const rawDataMap: { [fileName: string]: ReadonlyArray<TestResult> } = {};
            results.forEach(result => {
                rawDataMap[result.fileName] = result.data;
            });
            setAllRawData(rawDataMap);

            // Extract available filter options from all datasets
            const allFrameworks: string[] = [];
            Object.values(rawDataMap).forEach(dataSet => {
                dataSet.forEach(item => {
                    if (!allFrameworks.includes(item.name)) {
                        allFrameworks.push(item.name);
                    }
                });
            });

            const packageManagers = [...new Set(allFrameworks.map(extractPackageManager))].sort();
            const reactVersions = [...new Set(allFrameworks.map(extractReactVersion))].sort();
            setAvailableFilters(prevFilters => ({ // Use functional update to preserve other potentially set filter options
                ...prevFilters,
                packageManagers,
                reactVersions,
                // allFileNames is already set and comes from a constant, so no need to update it here
            }));

        }).catch(error => {
            console.error("Error fetching comparison data:", error);
        });
    }, []);

    useEffect(() => {
        if (Object.keys(allRawData).length === 0) return;

        const currentSelectedFiles = selectedFilters.selectedFileNames || [];

        const newComparisonData: ComparisonData = {};
        const allFrameworkNames: string[] = [];

        // Collect all unique framework names across all files
        Object.values(allRawData).forEach(dataSet => {
            dataSet.forEach(testResult => {
                if (!allFrameworkNames.includes(testResult.name)) {
                    allFrameworkNames.push(testResult.name);
                }
            });
        });
        allFrameworkNames.sort();


        const filteredFrameworkNames = allFrameworkNames.filter(frameworkName =>
            passesCommonFilters(frameworkName, selectedFilters)
        );

        filteredFrameworkNames.forEach(frameworkName => {
            newComparisonData[frameworkName] = {};
            currentSelectedFiles.forEach(fileName => {
                const dataSet = allRawData[fileName]; // allRawData contains data for all possible files
                const testResult = dataSet?.find(tr => tr.name === frameworkName);
                newComparisonData[frameworkName][fileName] = testResult ? calculateOverallPassed(testResult) : undefined;
            });
        });
        setComparisonTableData(newComparisonData);

        // Generate Markdown Table
        let md = '| Framework |';
        if (currentSelectedFiles.length > 0) {
            md += ' ' + currentSelectedFiles.join(' | ') + ' |';
        }
        md += '\n';

        md += '| --- |';
        if (currentSelectedFiles.length > 0) {
            md += ' ' + currentSelectedFiles.map(() => '---').join(' | ') + ' |';
        }
        md += '\n';

        Object.entries(newComparisonData).forEach(([framework, fileResults]) => {
            md += `| ${framework} |`;
            if (currentSelectedFiles.length > 0) {
                md += ' ' + currentSelectedFiles.map(fileName => {
                    const status = fileResults[fileName];
                    return status === undefined ? 'N/A' : (status ? '✅' : '❌');
                }).join(' | ') + ' |';
            }
            md += '\n';
        });
        setMarkdownTable(md);

    }, [allRawData, selectedFilters]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => console.log('Copied to clipboard:', text))
            .catch(err => console.error('Failed to copy text: ', err));
    };

    if (Object.keys(allRawData).length === 0) {
        return <div>Loading comparison data...</div>;
    }

    return (
        <>
            <h1>Test Results Comparison</h1>
            <Collapsible title='Filters'>
                <FilterFormPlaceholder
                    availableFilters={availableFilters}
                    selectedFilters={selectedFilters}
                    onFilterChange={setSelectedFilters}
                />
            </Collapsible>

            <Collapsible title="Comparison Table (HTML)">
                <button onClick={() => copyToClipboard(markdownTable)} style={{ marginBottom: '10px' }}>
                    Copy Markdown Table
                </button>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Framework</th>
                            {(selectedFilters.selectedFileNames || []).map(fileName => (
                                <th key={fileName} style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>
                                    {fileName}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(comparisonTableData).map(([framework, results]) => (
                            <tr key={framework}>
                                <td style={{ border: '1px solid black', padding: '8px' }}>{framework}</td>
                                {(selectedFilters.selectedFileNames || []).map(fileName => {
                                    const status = results[fileName];
                                    return (
                                        <td key={fileName} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                                            {status === undefined ? 'N/A' : (status ? '✅' : '❌')}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Collapsible>
        </>
    );
}

export default ComparisonPage;
