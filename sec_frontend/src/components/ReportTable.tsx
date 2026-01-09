import React from 'react';

interface ReportTableProps {
  content: string;
}

const ReportTable: React.FC<ReportTableProps> = ({ content }) => {
  if (!content) return null;

  // 1. Split into lines
  const lines = content.trim().split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return <pre>{content}</pre>;

  // 2. Extract header and body
  // Usually MD tables have a header, then a separator line like "|---|---|"
  // We need to identify if the second line is a separator
  let headerRow = lines[0];
  let bodyRows = lines.slice(1);

  if (lines.length > 1 && lines[1].trim().includes('---')) {
    bodyRows = lines.slice(2);
  }

  // Helper to parse a pipe-separated row
  const parseRow = (row: string) => {
    return row.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== ''); // Remove empty first/last cells if they exist due to leading/trailing pipes
  };

  const headers = parseRow(headerRow);
  const rows = bodyRows.map(parseRow);

  return (
    <div className="overflow-x-auto my-6 border border-gray-200 dark:border-[#161C1A] rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-[#161C1A]">
        <thead className="bg-gray-50 dark:bg-[#1C2220]">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E0E6E4] uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#161C1A] divide-y divide-gray-200 dark:divide-[#161C1A]">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-[#161C1A]' : 'bg-gray-50 dark:bg-[#1C2220]'}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;

