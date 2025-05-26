import React from 'react';
import type { ScatterPoint } from './types';

interface ResultsTableProps {
  scatterData: ScatterPoint[];
  scatterTicks: string[];
  onCopyToClipboard: (text: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ scatterData, scatterTicks, onCopyToClipboard }) => {
  if (!scatterData || scatterData.length === 0) {
    return <p>No data available to display.</p>;
  }

  const frameworks = [...new Set(scatterData.map(item => item.framework))].sort();

  const tableData: { [framework: string]: { [test: string]: boolean | undefined } } = {};
  frameworks.forEach(framework => {
    tableData[framework] = {};
    scatterTicks.forEach(tick => {
      const point = scatterData.find(p => p.framework === framework && p.test === tick);
      tableData[framework][tick] = point?.success;
    });
  });

  const generateMarkdownTable = () => {
    let markdown = '| Framework | ' + scatterTicks.join(' | ') + ' |\n';
    markdown += '| --- | ' + scatterTicks.map(() => '---').join(' | ') + ' |\n';

    frameworks.forEach(framework => {
      markdown += `| ${framework} | `;
      markdown += scatterTicks.map(tick => {
        const success = tableData[framework][tick];
        return success === undefined ? 'N/A' : (success ? '✅' : '❌');
      }).join(' | ') + ' |\n';
    });
    return markdown;
  };

  const handleCopyMarkdown = () => {
    const markdown = generateMarkdownTable();
    onCopyToClipboard(markdown);
  };

  return (
    <div>
      <button onClick={handleCopyMarkdown} style={{ marginBottom: '10px' }}>
        Copy as Markdown
      </button>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Framework</th>
            {scatterTicks.map(tick => (
              <th key={tick} style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>
                {tick}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {frameworks.map(framework => (
            <tr key={framework}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{framework}</td>
              {scatterTicks.map(tick => {
                const success = tableData[framework][tick];
                return (
                  <td key={tick} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                    {success === undefined ? 'N/A' : (success ? '✅' : '❌')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;

