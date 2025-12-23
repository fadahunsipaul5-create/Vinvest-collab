import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { balanceSheetReal } from '../data/balanceSheetReal';
import { formatMonetaryValue } from '../utils/formatMonetary';

interface CellData { [key: string]: number | string; }
interface TableData { [year: number]: CellData; }

const yearsList: number[] = Array.from({ length: 25 }, (_, i) => 2011 + i);
const isEditableYear = (y: number) => y >= 2025 && y <= 2035;

const formatNumber = (value: number | string | undefined) => {
	return formatMonetaryValue(value);
};

const BalanceSheetTable: React.FC<{ data: TableData; onDataChange: (year: number, field: string, value: number) => void }>
= ({ data, onDataChange }) => {
	const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({ 
		TotalAssets: true, CurrentAssets: true, CashGroup: true, Receivables: true, Inventory: true,
		TotalLiabilities: true, CurrentLiabilities: true, TotalEquity: true
	});
	const toggle = (k: string) => setExpanded(prev => ({ ...prev, [k]: !prev[k] }));

	const getRaw = (year: number, key: string) => {
		const mappedKey = mapKey(key);
		// Handle specific cases where JSON field names differ from data file field names
		if (mappedKey === 'Assets') {
			// Calculate Assets as AssetsCurrent + AssetsNoncurrent
			const currentAssets = (data[year]?.['AssetsCurrent'] as number | undefined) ?? 0;
			const noncurrentAssets = (data[year]?.['AssetsNoncurrent'] as number | undefined) ?? 0;
			return currentAssets + noncurrentAssets;
		}
		if (mappedKey === 'Equity') {
			return (data[year]?.['StockholdersEquity'] as number | string | undefined) ?? undefined;
		}
		if (mappedKey === 'LiabilitiesAndEquity') {
			// Calculate LiabilitiesAndEquity as Liabilities + StockholdersEquity
			const liabilities = (data[year]?.['Liabilities'] as number | undefined) ?? 0;
			const equity = (data[year]?.['StockholdersEquity'] as number | undefined) ?? 0;
			return liabilities + equity;
		}
		if (mappedKey === 'OperatingLeaseLiabilityNoncurrent') {
			return (data[year]?.['OperatingLeaseLiabilityNoncurrent'] as number | string | undefined) ?? undefined;
		}
		if (mappedKey === 'FinanceLeaseLiabilitiesNonCurrent') {
			return (data[year]?.['FinanceLeaseLiabilitiesNoncurrent'] as number | string | undefined) ?? undefined;
		}
		if (mappedKey === 'DeferredIncomeTaxLiabilitiesNonCurrent') {
			return (data[year]?.['DeferredIncomeTaxLiabilitiesNoncurrent'] as number | string | undefined) ?? undefined;
		}
		return (data[year]?.[mappedKey] as number | string | undefined) ?? undefined;
	};
	const mapKey = (k: string): string => {
		switch (k) {
			// Current assets
			case 'CashAndCashEquivalents': return 'CashAndCashEquivalents';
			case 'ShortTermInvestments': return 'ShortTermInvestments';
			case 'Receivables': return 'ReceivablesCurrent';
			case 'Inventory': return 'Inventory';
			case 'OtherAssetsCurrent': return 'OtherAssetsCurrent';
			// Non-current assets
			case 'PropertyPlantAndEquipmentNet': return 'PropertyPlantAndEquipment';
			case 'OperatingLeaseRightOfUseAsset': return 'OperatingLeaseAssets';
			case 'LeaseFinanceAssetsNoncurrent': return 'FinanceLeaseAssets';
			case 'Goodwill': return 'Goodwill';
			case 'OtherNonCurrentAssets': return 'OtherAssetsNoncurrent';
			case 'OtherAssetsNoncurrent': return 'OtherAssetsNoncurrent';
			// Current liabilities
			case 'AccountsPayable': return 'AccountsPayableCurrent';
			case 'AccountsPayableCurrent': return 'AccountsPayableCurrent';
			case 'EmployeeRelatedLiabilitiesCurrent': return 'EmployeeLiabilitiesCurrent';
			case 'EmployeeLiabilitiesCurrent': return 'EmployeeLiabilitiesCurrent';
			case 'AccruedLiabilitiesCurrent': return 'AccruedLiabilitiesCurrent';
			case 'DeferredRevenueCurrent': return 'DeferredRevenueCurrent';
			case 'CurrentDebt': return 'LongTermDebtCurrent';
			case 'LongTermDebtCurrent': return 'LongTermDebtCurrent';
			case 'OperatingLeaseLiabilitiesCurrent': return 'OperatingLeaseLiabilitiesCurrent';
			case 'FinanceLeaseLiabilitiesCurrent': return 'FinanceLeaseLiabilitiesCurrent';
			case 'OtherCurrentLiabilities': return 'OtherLiabilitiesCurrent';
			case 'OtherLiabilitiesCurrent': return 'OtherLiabilitiesCurrent';
			// Non-current liabilities
			case 'LongTermDebt': return 'LongTermDebtNoncurrent';
			case 'LongTermDebtNoncurrent': return 'LongTermDebtNoncurrent';
			case 'OperatingLeaseLiabilitiesNoncurrent': return 'OperatingLeaseLiabilityNoncurrent';
			case 'FinanceLeaseLiabilitiesNoncurrent': return 'FinanceLeaseLiabilitiesNonCurrent';
			case 'DeferredIncomeTaxLiabilitiesNoncurrent': return 'DeferredIncomeTaxLiabilitiesNonCurrent';
			case 'OtherNonCurrentLiabilities': return 'OtherLiabilitiesNoncurrent';
			case 'OtherLiabilitiesNoncurrent': return 'OtherLiabilitiesNoncurrent';
			// Aggregated totals
			case 'AssetsCurrent': return 'AssetsCurrent';
			case 'CurrentAssets': return 'AssetsCurrent';
			case 'AssetsNoncurrent': return 'AssetsNoncurrent';
			case 'Assets': return 'Assets';
			case 'LiabilitiesCurrent': return 'LiabilitiesCurrent';
			case 'CurrentLiabilities': return 'LiabilitiesCurrent';
			case 'LiabilitiesNoncurrent': return 'LiabilitiesNoncurrent';
			case 'Liabilities': return 'Liabilities';
			case 'Equity': return 'Equity';
			case 'StockholdersEquity': return 'Equity';
			case 'LiabilitiesAndEquity': return 'LiabilitiesAndEquity';
			default: return k;
		}
	};
	const getNumeric = (year: number, key: string) => {
		const v = getRaw(year, mapKey(key));
		if (typeof v === 'number') return v;
		if (typeof v === 'string') {
			const n = Number(v.replace(/,/g, ''));
			if (!Number.isNaN(n)) return n;
		}
		return 0;
	};

	const renderCell = (year: number, key: string) => {
		if (isEditableYear(year)) {
			return (
				<input
					type="text"
					value={formatNumber(getRaw(year, key))}
					onChange={(e) => {
						const numeric = parseFloat(e.target.value.replace(/,/g, ''));
						onDataChange(year, key, Number.isFinite(numeric) ? numeric : 0);
					}}
					className="w-full p-2 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			);
		}
		return <span className="block p-2 text-center">{formatNumber(getRaw(year, key)) || formatNumber(getNumeric(year, key))}</span>;
	};

	const totalCurrentAssetsFor = (year: number) => (
		getNumeric(year, 'CashAndCashEquivalents') +
		getNumeric(year, 'ShortTermInvestments') +
		getNumeric(year, 'Receivables') +
		getNumeric(year, 'Inventory') +
		getNumeric(year, 'OtherAssetsCurrent')
	);

	const totalAssetsFor = (year: number) => {
		const fromData = getNumeric(year, 'Assets');
		const computed = totalCurrentAssetsFor(year) + getNumeric(year, 'PropertyPlantAndEquipmentNet');
		return fromData > 0 ? fromData : computed;
	};

	const grossPPEFor = (year: number) => (
		getNumeric(year, 'LandAndImprovements') +
		getNumeric(year, 'BuildingsAndImprovements') +
		getNumeric(year, 'MachineryFurnitureEquipment') +
		getNumeric(year, 'OtherProperties') +
		getNumeric(year, 'ConstructionInProgress')
	);

	const netPPEFor = (year: number) => grossPPEFor(year) + getNumeric(year, 'AccumulatedDepreciationBS');

	const otherNonCurrentFor = (year: number) => getNumeric(year, 'OtherNonCurrentAssets') || getNumeric(year, 'OtherAssetsNoncurrent');

	const totalNonCurrentFor = (year: number) => netPPEFor(year) + otherNonCurrentFor(year);

	// Liabilities calculations
	const currentLiabilitiesFor = (year: number) => (
		getNumeric(year, 'AccountsPayable') +
		getNumeric(year, 'CurrentDebt') +
		getNumeric(year, 'OtherCurrentLiabilities')
	);

	const totalLiabilitiesFor = (year: number) => (
		currentLiabilitiesFor(year) +
		getNumeric(year, 'LongTermDebt') +
		getNumeric(year, 'OtherNonCurrentLiabilities')
	);

	// Equity calculations
	const totalEquityFor = (year: number) => (
		getNumeric(year, 'CommonStock') +
		getNumeric(year, 'RetainedEarnings') +
		getNumeric(year, 'AccumulatedOtherComprehensiveIncome')
	);

	const totalLiabilitiesAndEquityFor = (year: number) => totalLiabilitiesFor(year) + totalEquityFor(year);

	return (
		<div className="mb-8 bg-white rounded-lg shadow-sm border">
			<div className="p-4 border-b bg-gray-50">
				<h3 className="text-lg font-semibold text-gray-800">Balance Sheet</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-100 border-b">
							<th className="text-left p-3 font-medium text-gray-700 sticky left-0 bg-gray-100 border-r min-w-[220px]">Breakdown</th>
							{yearsList.map(y => (
								<th key={y} className="text-center p-3 font-medium text-gray-700 min-w-[140px]">{`8/31/${y}`}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{/* Total Assets */}
						<tr className="border-b-2 border-gray-300">
							<td className="p-3 font-bold text-gray-800 sticky left-0 bg-white border-r">
								<button onClick={() => toggle('TotalAssets')} className="w-full text-left">
									{expanded['TotalAssets'] ? 'v' : '^'} Total Assets
								</button>
							</td>
							{yearsList.map(y => (
								<td key={`TotalAssets-${y}`} className="p-2 text-center">
									<span className="block p-2 text-center">{formatNumber(totalAssetsFor(y))}</span>
								</td>
							))}
						</tr>

						{/* Current Assets group */}
						<tr className="border-b-2 border-gray-200">
							<td className="pl-6 p-3 font-medium text-gray-800 sticky left-0 bg-inherit border-r">
								<button onClick={() => toggle('CurrentAssets')} className="w-full text-left">
									{expanded['CurrentAssets'] ? 'v' : '^'} Current Assets
								</button>
							</td>
							{yearsList.map(y => (
								<td key={`CurrentAssets-${y}`} className="p-2 text-center">
									<span className="block p-2 text-center">{formatNumber(totalCurrentAssetsFor(y))}</span>
								</td>
							))}
						</tr>

						{expanded['CurrentAssets'] && (
							<>
								{/* Cash, Cash Equivalents ... */}
								<tr className="border-b-2 border-gray-100">
									<td className="pl-10 p-3 font-medium text-gray-800 sticky left-0 bg-inherit border-r">
										<button onClick={() => toggle('CashGroup')} className="w-full text-left">
											{expanded['CashGroup'] ? 'v' : '^'} Cash, Cash Equivalents ...
										</button>
									</td>
									{yearsList.map(y => (
										<td key={`CashGroup-${y}`} className="p-2 text-center">
											<span className="block p-2 text-center">{formatNumber(getNumeric(y, 'CashAndCashEquivalents') + getNumeric(y, 'ShortTermInvestments') + getNumeric(y, 'OtherAssetsCurrent'))}</span>
										</td>
									))}
								</tr>
								{expanded['CashGroup'] && (
									<>
										<tr className="border-b">
											<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Cash And Cash Equivalents</td>
											{yearsList.map(y => (
												<td key={`Cash-${y}`} className="p-2 text-center">{renderCell(y, 'CashAndCashEquivalents')}</td>
											))}
										</tr>
										<tr className="border-b">
											<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Short Term Investments</td>
											{yearsList.map(y => (
												<td key={`ShortTermInv-${y}`} className="p-2 text-center">{renderCell(y, 'ShortTermInvestments')}</td>
											))}
										</tr>
										<tr className="border-b">
											<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Other Current Assets</td>
											{yearsList.map(y => (
												<td key={`OtherCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'OtherAssetsCurrent')}</td>
											))}
										</tr>
									</>
								)}

							{/* Receivables group */}
							<tr className="border-b-2 border-gray-100">
								<td className="pl-10 p-3 font-medium text-gray-800 sticky left-0 bg-inherit border-r">
									<button onClick={() => toggle('Receivables')} className="w-full text-left">
										{expanded['Receivables'] ? 'v' : '^'} Receivables
									</button>
								</td>
								{yearsList.map(y => (
									<td key={`Receivables-${y}`} className="p-2 text-center">
										<span className="block p-2 text-center">{formatNumber(getNumeric(y, 'Receivables'))}</span>
									</td>
								))}
							</tr>
							{expanded['Receivables'] && (
								<tr className="border-b">
									<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Accounts receivable</td>
									{yearsList.map(y => (
										<td key={`AccountsReceivable-${y}`} className="p-2 text-center">{renderCell(y, 'Receivables')}</td>
									))}
								</tr>
							)}

							{/* Inventory group */}
							<tr className="border-b-2 border-gray-100">
								<td className="pl-10 p-3 font-medium text-gray-800 sticky left-0 bg-inherit border-r">
									<button onClick={() => toggle('Inventory')} className="w-full text-left">
										{expanded['Inventory'] ? 'v' : '^'} Inventory
									</button>
								</td>
								{yearsList.map(y => (
									<td key={`Inventory-${y}`} className="p-2 text-center">
										<span className="block p-2 text-center">{formatNumber(getNumeric(y, 'Inventory'))}</span>
									</td>
								))}
							</tr>
							{expanded['Inventory'] && (
								<tr className="border-b">
									<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Finished Goods</td>
									{yearsList.map(y => (
										<td key={`FinishedGoods-${y}`} className="p-2 text-center">{renderCell(y, 'Inventory')}</td>
									))}
								</tr>
							)}

							{/* Other Current Assets */}
							<tr className="border-b">
								<td className="pl-10 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Other Current Assets</td>
								{yearsList.map(y => (
									<td key={`OtherCurrentAssets-${y}`} className="p-2 text-center">{renderCell(y, 'OtherAssetsCurrent')}</td>
								))}
							</tr>
						</>
						)}

						{/* Non-current Assets */}
						<tr className="border-b-2 border-gray-300">
							<td className="p-3 font-bold text-gray-800 sticky left-0 bg-white border-r">
								<button onClick={() => toggle('NonCurrentAssets')} className="w-full text-left">
									{expanded['NonCurrentAssets'] ? 'v' : '^'} Total non-current assets
								</button>
							</td>
							{yearsList.map(y => (
								<td key={`TotalNonCurrent-${y}`} className="p-2 text-center">
									<span className="block p-2 text-center">{formatNumber(totalNonCurrentFor(y))}</span>
								</td>
							))}
						</tr>

						{expanded['NonCurrentAssets'] && (
							<>
								{/* Net PPE */}
								<tr className="border-b-2 border-gray-200">
									<td className="pl-6 p-3 font-medium text-gray-800 sticky left-0 bg-inherit border-r">
										<button onClick={() => toggle('NetPPE')} className="w-full text-left">
											{expanded['NetPPE'] ? 'v' : '^'} Net PPE
										</button>
									</td>
									{yearsList.map(y => (
										<td key={`NetPPE-${y}`} className="p-2 text-center">
											<span className="block p-2 text-center">{formatNumber(netPPEFor(y))}</span>
										</td>
									))}
								</tr>

								{expanded['NetPPE'] && (
									<>
										{/* Gross PPE */}
										<tr className="border-b-2 border-gray-100">
											<td className="pl-10 p-3 font-medium text-gray-800 sticky left-0 bg-inherit border-r">
												<button onClick={() => toggle('GrossPPE')} className="w-full text-left">
													{expanded['GrossPPE'] ? 'v' : '^'} Gross PPE
												</button>
											</td>
											{yearsList.map(y => (
												<td key={`GrossPPE-${y}`} className="p-2 text-center">
													<span className="block p-2 text-center">{formatNumber(grossPPEFor(y))}</span>
												</td>
											))}
										</tr>

										{expanded['GrossPPE'] && (
											<>
												<tr className="border-b">
													<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Properties</td>
													{yearsList.map(y => (
														<td key={`Properties-${y}`} className="p-2 text-center">0</td>
													))}
											</tr>
											<tr className="border-b">
												<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Land And Improvements</td>
												{yearsList.map(y => (
													<td key={`Land-${y}`} className="p-2 text-center">{renderCell(y, 'LandAndImprovements')}</td>
												))}
											</tr>
											<tr className="border-b">
												<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Buildings And Improvements</td>
												{yearsList.map(y => (
													<td key={`Buildings-${y}`} className="p-2 text-center">{renderCell(y, 'BuildingsAndImprovements')}</td>
												))}
											</tr>
											<tr className="border-b">
												<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Machinery Furniture Equipment</td>
												{yearsList.map(y => (
													<td key={`Machinery-${y}`} className="p-2 text-center">{renderCell(y, 'MachineryFurnitureEquipment')}</td>
												))}
											</tr>
											<tr className="border-b">
												<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Other Properties</td>
												{yearsList.map(y => (
													<td key={`OtherProps-${y}`} className="p-2 text-center">{renderCell(y, 'OtherProperties')}</td>
												))}
											</tr>
											<tr className="border-b">
												<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Construction in Progress</td>
												{yearsList.map(y => (
													<td key={`CIP-${y}`} className="p-2 text-center">{renderCell(y, 'ConstructionInProgress')}</td>
												))}
											</tr>
											<tr className="border-b">
												<td className="pl-14 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Accumulated Depreciation</td>
												{yearsList.map(y => (
													<td key={`AccDep-${y}`} className="p-2 text-center">{renderCell(y, 'AccumulatedDepreciationBS')}</td>
												))}
											</tr>
										</>
									)}
								</>
								)}

								{/* Other Non Current Assets */}
								<tr className="border-b">
									<td className="pl-6 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Other Non Current Assets</td>
									{yearsList.map(y => (
										<td key={`OtherNC-${y}`} className="p-2 text-center">{renderCell(y, 'OtherNonCurrentAssets')}</td>
									))}
								</tr>
							</>
						)}

						{/* Total Liabilities */}
						<tr className="border-b-2 border-gray-300">
							<td className="p-3 font-bold text-gray-800 sticky left-0 bg-white border-r">
								<button onClick={() => toggle('TotalLiabilities')} className="w-full text-left">
									{expanded['TotalLiabilities'] ? 'v' : '^'} Total Liabilities
								</button>
							</td>
							{yearsList.map(y => (
								<td key={`TotalLiabilities-${y}`} className="p-2 text-center">
									<span className="block p-2 text-center">{formatNumber(totalLiabilitiesFor(y))}</span>
								</td>
							))}
						</tr>

						{expanded['TotalLiabilities'] && (
							<>
								{/* Current Liabilities */}
								<tr className="border-b-2 border-gray-200">
									<td className="pl-6 p-3 font-medium text-gray-800 sticky left-0 bg-inherit border-r">
										<button onClick={() => toggle('CurrentLiabilities')} className="w-full text-left">
											{expanded['CurrentLiabilities'] ? 'v' : '^'} Current Liabilities
										</button>
									</td>
									{yearsList.map(y => (
										<td key={`CurrentLiabilities-${y}`} className="p-2 text-center">
											<span className="block p-2 text-center">{formatNumber(currentLiabilitiesFor(y))}</span>
										</td>
									))}
								</tr>

								{expanded['CurrentLiabilities'] && (
									<>
										<tr className="border-b">
											<td className="pl-10 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Accounts Payable</td>
											{yearsList.map(y => (
												<td key={`AccountsPayable-${y}`} className="p-2 text-center">{renderCell(y, 'AccountsPayable')}</td>
											))}
										</tr>
										<tr className="border-b">
											<td className="pl-10 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Current Debt</td>
											{yearsList.map(y => (
												<td key={`CurrentDebt-${y}`} className="p-2 text-center">{renderCell(y, 'CurrentDebt')}</td>
											))}
										</tr>
										<tr className="border-b">
											<td className="pl-10 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Other Current Liabilities</td>
											{yearsList.map(y => (
												<td key={`OtherCurrentLiab-${y}`} className="p-2 text-center">{renderCell(y, 'OtherCurrentLiabilities')}</td>
											))}
										</tr>
									</>
								)}

								{/* Non-current Liabilities */}
								<tr className="border-b">
									<td className="pl-6 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Long Term Debt</td>
									{yearsList.map(y => (
										<td key={`LongTermDebt-${y}`} className="p-2 text-center">{renderCell(y, 'LongTermDebt')}</td>
									))}
								</tr>
								<tr className="border-b">
									<td className="pl-6 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Other Non Current Liabilities</td>
									{yearsList.map(y => (
										<td key={`OtherNonCurrentLiab-${y}`} className="p-2 text-center">{renderCell(y, 'OtherNonCurrentLiabilities')}</td>
									))}
								</tr>
							</>
						)}

						{/* Total Stockholders' Equity */}
						<tr className="border-b-2 border-gray-300">
							<td className="p-3 font-bold text-gray-800 sticky left-0 bg-white border-r">
								<button onClick={() => toggle('TotalEquity')} className="w-full text-left">
									{expanded['TotalEquity'] ? 'v' : '^'} Total Stockholders' Equity
								</button>
							</td>
							{yearsList.map(y => (
								<td key={`TotalEquity-${y}`} className="p-2 text-center">
									<span className="block p-2 text-center">{formatNumber(totalEquityFor(y))}</span>
								</td>
							))}
						</tr>

						{expanded['TotalEquity'] && (
							<>
								<tr className="border-b">
									<td className="pl-6 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Common Stock</td>
									{yearsList.map(y => (
										<td key={`CommonStock-${y}`} className="p-2 text-center">{renderCell(y, 'CommonStock')}</td>
									))}
								</tr>
								<tr className="border-b">
									<td className="pl-6 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Retained Earnings</td>
									{yearsList.map(y => (
										<td key={`RetainedEarnings-${y}`} className="p-2 text-center">{renderCell(y, 'RetainedEarnings')}</td>
									))}
								</tr>
								<tr className="border-b">
									<td className="pl-6 p-3 text-gray-700 sticky left-0 bg-inherit border-r">Accumulated Other Comprehensive Income</td>
									{yearsList.map(y => (
										<td key={`AOCI-${y}`} className="p-2 text-center">{renderCell(y, 'AccumulatedOtherComprehensiveIncome')}</td>
									))}
								</tr>
							</>
						)}

						{/* Total Liabilities and Stockholders' Equity */}
						<tr className="border-b-2 border-gray-400">
							<td className="p-3 font-bold text-gray-800 sticky left-0 bg-white border-r">Total Liabilities and Stockholders' Equity</td>
							{yearsList.map(y => (
								<td key={`TotalLiabEquity-${y}`} className="p-2 text-center">
									<span className="block p-2 text-center font-semibold">{formatNumber(totalLiabilitiesAndEquityFor(y))}</span>
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
};

const BalanceSheet: React.FC = () => {
	const navigate = useNavigate();
	const [data, setData] = useState<TableData>(balanceSheetReal);

	const handleChange = (year: number, field: string, value: number) => {
		setData(prev => ({
			...prev,
			[year]: { ...(prev[year] || {}), [field]: value }
		}));
	};

	return (
		<div className="px-4 py-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
				<button onClick={() => navigate('/valuation')} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
					Go to Valuation
				</button>
			</div>
			<BalanceSheetTable data={data} onDataChange={handleChange} />
		</div>
	);
};

export default BalanceSheet;
