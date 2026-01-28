import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { X } from 'lucide-react';

interface BreakdownChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    fieldName: string;
    data: { [year: number]: number | string };
}

const BreakdownChartModal: React.FC<BreakdownChartModalProps> = ({
    isOpen,
    onClose,
    fieldName,
    data,
}) => {
    if (!isOpen) return null;

    // Transform data for recharts - separate historical and forecast
    const allData = Object.entries(data)
        .map(([year, value]) => {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
            const yearNum = parseInt(year);
            return {
                year: year,
                yearNum: yearNum,
                value: isNaN(numValue) ? null : numValue / 1_000_000_000, // Convert to billions
                isForecast: yearNum >= 2025,
            };
        })
        .filter(item => item.value !== null && item.value !== 0)
        .sort((a, b) => a.yearNum - b.yearNum);

    // Split into historical and forecast data
    const historicalData = allData.filter(item => !item.isForecast);
    const forecastData = allData.filter(item => item.isForecast);

    // Add connection point between historical and forecast
    if (historicalData.length > 0 && forecastData.length > 0) {
        const lastHistorical = historicalData[historicalData.length - 1];
        forecastData.unshift(lastHistorical);
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-[#161C1A] p-2 border border-gray-300 dark:border-[#161C1A] rounded shadow-lg text-sm">
                    <p className="text-gray-900 dark:text-white font-semibold">{data.year}</p>
                    <p className={data.isForecast ? "text-green-400" : "text-green-700 dark:text-green-500"}>
                        {data.value !== null ? `${data.value.toFixed(2)}` : 'N/A'}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom dot for data points
    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        return (
            <circle
                cx={cx}
                cy={cy}
                r={4}
                fill={payload.isForecast ? '#86efac' : '#166534'}
                stroke="white"
                strokeWidth={2}
            />
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 dark:bg-[#161C1A]/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#161C1A] rounded-lg shadow-2xl w-[90%] max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-[#161C1A]">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fieldName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#232D2A] rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Chart Content */}
                <div className="p-4">
                    {allData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-green-800" />
                                <XAxis
                                    dataKey="year"
                                    type="category"
                                    allowDuplicatedCategory={false}
                                    tick={{ fill: 'currentColor', fontSize: 12 }}
                                    className="text-gray-700 dark:text-gray-300"
                                />
                                <YAxis
                                    tick={{ fill: 'currentColor', fontSize: 12 }}
                                    className="text-gray-700 dark:text-gray-300"
                                    width={60}
                                />
                                <Tooltip content={<CustomTooltip />} />

                                {/* Historical line - deep green */}
                                {historicalData.length > 0 && (
                                    <Line
                                        data={historicalData}
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#166534"
                                        strokeWidth={2}
                                        dot={<CustomDot />}
                                        name="Historical"
                                    />
                                )}

                                {/* Forecast line - light green with dashed style */}
                                {forecastData.length > 0 && (
                                    <Line
                                        data={forecastData}
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#86efac"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={<CustomDot />}
                                        name="Forecast"
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500 dark:text-gray-400">
                                No data available for {fieldName}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer with legend */}
                <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-green-800 dark:bg-green-700"></div>
                            <span className="text-gray-600 dark:text-gray-400">Historical</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-green-300 border-dashed border-t-2 border-green-300"></div>
                            <span className="text-gray-600 dark:text-gray-400">Forecast</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakdownChartModal;
