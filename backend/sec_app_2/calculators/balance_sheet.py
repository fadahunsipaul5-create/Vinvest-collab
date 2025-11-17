from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class BalanceSheetCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'TotalAssets': self.calculate_total_assets,
            'AssetsCurrent': self.calculate_current_assets,
            'AssetsNoncurrent': self.calculate_noncurrent_assets,
            'TotalLiabilities': self.calculate_total_liabilities,
            'LiabilitiesCurrent': self.calculate_current_liabilities,
            'LiabilitiesNoncurrent': self.calculate_noncurrent_liabilities,
            'StockholdersEquity': self.calculate_stockholders_equity,
            'LiabilitiesAndStockholdersEquity': self.calculate_liabilities_and_equity,
        }

        self.dependencies = {
            'CashAndCashEquivalents': ['AssetsCurrent', 'TotalAssets'],
            'Receivables': ['AssetsCurrent', 'TotalAssets'],
            'Inventory': ['AssetsCurrent', 'TotalAssets'],
            'DeferredTaxesAssetsCurrent': ['AssetsCurrent', 'TotalAssets'],
            'OtherAssetsCurrent': ['AssetsCurrent', 'TotalAssets'],
            'PropertyPlantAndEquipmentNet': ['AssetsNoncurrent', 'TotalAssets'],
            'OperatingLeaseRightOfUseAsset': ['AssetsNoncurrent', 'TotalAssets'],
            'LeaseFinanceAssetsNoncurrent': ['AssetsNoncurrent', 'TotalAssets'],
            'Goodwill': ['AssetsNoncurrent', 'TotalAssets'],
            'DeferredIncomeTaxAssetsNoncurrent': ['AssetsNoncurrent', 'TotalAssets'],
            'OtherAssetsNoncurrent': ['AssetsNoncurrent', 'TotalAssets'],
            'AccountsPayableCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'EmployeeRelatedLiabilitiesCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'AccruedLiabilitiesCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'DeferredRevenueCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'LongTermDebtCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'OperatingLeaseLiabilitiesCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'FinanceLeaseLiabilitiesCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'OtherLiabilitiesCurrent': ['LiabilitiesCurrent', 'TotalLiabilities'],
            'LongTermDebtNoncurrent': ['LiabilitiesNoncurrent', 'TotalLiabilities'],
            'OperatingLeaseLiabilityNoncurrent': ['LiabilitiesNoncurrent', 'TotalLiabilities'],
            'FinanceLeaseLiabilitiesNonCurrent': ['LiabilitiesNoncurrent', 'TotalLiabilities'],
            'DeferredIncomeTaxLiabilitiesNonCurrent': ['LiabilitiesNoncurrent', 'TotalLiabilities'],
            'OtherLiabilitiesNoncurrent': ['LiabilitiesNoncurrent', 'TotalLiabilities'],
            'AssetsCurrent': ['TotalAssets', 'StockholdersEquity', 'LiabilitiesAndStockholdersEquity'],
            'AssetsNoncurrent': ['TotalAssets', 'StockholdersEquity', 'LiabilitiesAndStockholdersEquity'],
            'TotalAssets': ['StockholdersEquity', 'LiabilitiesAndStockholdersEquity'],
            'LiabilitiesCurrent': ['TotalLiabilities', 'StockholdersEquity', 'LiabilitiesAndStockholdersEquity'],
            'LiabilitiesNoncurrent': ['TotalLiabilities', 'StockholdersEquity', 'LiabilitiesAndStockholdersEquity'],
            'TotalLiabilities': ['StockholdersEquity', 'LiabilitiesAndStockholdersEquity'],
            'StockholdersEquity': ['LiabilitiesAndStockholdersEquity'],
        }

    def calculate_total_assets(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            current_assets = y.get('AssetsCurrent', 0)
            noncurrent_assets = y.get('AssetsNoncurrent', 0)
            if current_assets is None or noncurrent_assets is None:
                return None
            result = float(current_assets) + float(noncurrent_assets)
            logger.debug(f"Total Assets for {year}: {current_assets} + {noncurrent_assets} = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Total Assets for year {year}: {e}")
            return None

    def calculate_current_assets(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            cash = y.get('CashAndCashEquivalents', 0)
            receivables = y.get('Receivables', 0)
            inventory = y.get('Inventory', 0)
            deferred_taxes = y.get('DeferredTaxesAssetsCurrent', 0)
            other_assets = y.get('OtherAssetsCurrent', 0)
            if any(v is None for v in [cash, receivables, inventory, deferred_taxes, other_assets]):
                return None
            result = float(cash) + float(receivables) + float(inventory) + float(deferred_taxes) + float(other_assets)
            logger.debug(
                f"Current Assets for {year}: {cash} + {receivables} + {inventory} + {deferred_taxes} + {other_assets} = {result}"
            )
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Current Assets for year {year}: {e}")
            return None

    def calculate_noncurrent_assets(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            ppe = y.get('PropertyPlantAndEquipmentNet', 0)
            operating_lease = y.get('OperatingLeaseRightOfUseAsset', 0)
            finance_lease = y.get('LeaseFinanceAssetsNoncurrent', 0)
            goodwill = y.get('Goodwill', 0)
            deferred_tax_noncurrent = y.get('DeferredIncomeTaxAssetsNoncurrent', 0)
            other_noncurrent = y.get('OtherAssetsNoncurrent', 0)
            if any(v is None for v in [ppe, operating_lease, finance_lease, goodwill, deferred_tax_noncurrent, other_noncurrent]):
                return None
            result = float(ppe) + float(operating_lease) + float(finance_lease) + float(goodwill) + float(deferred_tax_noncurrent) + float(other_noncurrent)
            logger.debug(
                f"Non-Current Assets for {year}: {ppe} + {operating_lease} + {finance_lease} + {goodwill} + {deferred_tax_noncurrent} + {other_noncurrent} = {result}"
            )
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Non-Current Assets for year {year}: {e}")
            return None

    def calculate_total_liabilities(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            current_liabilities = y.get('LiabilitiesCurrent', 0)
            noncurrent_liabilities = y.get('LiabilitiesNoncurrent', 0)
            if current_liabilities is None or noncurrent_liabilities is None:
                return None
            result = float(current_liabilities) + float(noncurrent_liabilities)
            logger.debug(f"Total Liabilities for {year}: {current_liabilities} + {noncurrent_liabilities} = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Total Liabilities for year {year}: {e}")
            return None

    def calculate_current_liabilities(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            vals = (
                y.get('AccountsPayableCurrent', 0),
                y.get('EmployeeRelatedLiabilitiesCurrent', 0),
                y.get('AccruedLiabilitiesCurrent', 0),
                y.get('DeferredRevenueCurrent', 0),
                y.get('LongTermDebtCurrent', 0),
                y.get('OperatingLeaseLiabilitiesCurrent', 0),
                y.get('FinanceLeaseLiabilitiesCurrent', 0),
                y.get('OtherLiabilitiesCurrent', 0),
            )
            result = self.sum_numbers(vals)
            logger.debug(f"Current Liabilities for {year}: Sum of 8 components = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Current Liabilities for year {year}: {e}")
            return None

    def calculate_noncurrent_liabilities(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            vals = (
                y.get('LongTermDebtNoncurrent', 0),
                y.get('OperatingLeaseLiabilityNoncurrent', 0),
                y.get('FinanceLeaseLiabilitiesNonCurrent', 0),
                y.get('DeferredIncomeTaxLiabilitiesNonCurrent', 0),
                y.get('OtherLiabilitiesNoncurrent', 0),
            )
            result = self.sum_numbers(vals)
            logger.debug(f"Non-Current Liabilities for {year}: Sum of 5 components = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Non-Current Liabilities for year {year}: {e}")
            return None

    def calculate_stockholders_equity(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            total_assets = y.get('TotalAssets', 0)
            total_liabilities = y.get('TotalLiabilities', 0)
            if total_assets is None or total_liabilities is None:
                return None
            result = float(total_assets) - float(total_liabilities)
            logger.debug(f"Stockholders' Equity for {year}: {total_assets} - {total_liabilities} = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Stockholders' Equity for year {year}: {e}")
            return None

    def calculate_liabilities_and_equity(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            total_liabilities = y.get('TotalLiabilities', 0)
            stockholders_equity = y.get('StockholdersEquity', 0)
            if total_liabilities is None or stockholders_equity is None:
                return None
            result = float(total_liabilities) + float(stockholders_equity)
            logger.debug(
                f"Liabilities and Stockholders' Equity for {year}: {total_liabilities} + {stockholders_equity} = {result}"
            )
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Liabilities and Stockholders' Equity for year {year}: {e}")
            return None

    def calculate_all_fields(self, data: Dict[int, Dict[str, Any]], year: int) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data: Dict[int, Dict[str, Any]], year: int) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year))
        logger.info(f"Updated calculated balance sheet fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data: Dict[int, Dict[str, Any]], year: int, changed_field: str) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    v = self.calculated_fields[name](data, year)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent balance sheet fields for year {year} after changing {changed_field}")
        return data

    def calculate_percentage_of_revenue_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str, percentage: float) -> Optional[float]:
        try:
            y = data.get(year, {})
            revenue = y.get('Revenue', 0)
            if revenue is None or percentage is None:
                return None
            result = float(revenue) * (float(percentage) / 100.0)
            logger.debug(f"{field_name} for {year}: {revenue} * {percentage}% = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating {field_name} as % of revenue for year {year}: {e}")
            return None

    def update_percentage_based_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str, percentage: float) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        v = self.calculate_percentage_of_revenue_field(data, year, field_name, percentage)
        if v is not None:
            data[year][field_name] = v
            logger.info(f"Updated {field_name} for {year} to {v} ({percentage}% of revenue)")
            data = self.recalculate_dependent_fields(data, year, field_name)
        return data


# Global instance and helper facades
balance_sheet_calculator = BalanceSheetCalculator()


def calculate_balance_sheet_field(data: Dict[int, Dict[str, Any]], year: int, field_name: str) -> Optional[float]:
    func = balance_sheet_calculator.calculated_fields.get(field_name)
    if not func:
        logger.warning(f"Field {field_name} is not a calculated balance sheet field")
        return None
    return func(data, year)


def update_balance_sheet_calculations(data: Dict[int, Dict[str, Any]], year: int) -> Dict[int, Dict[str, Any]]:
    return balance_sheet_calculator.update_calculated_fields(data, year)


def recalculate_balance_sheet_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str) -> Dict[int, Dict[str, Any]]:
    return balance_sheet_calculator.recalculate_dependent_fields(data, year, changed_field)


def update_percentage_based_balance_sheet_field(data: Dict[int, Dict[str, Any]], year: int, field_name: str, percentage: float) -> Dict[int, Dict[str, Any]]:
    return balance_sheet_calculator.update_percentage_based_field(data, year, field_name, percentage)


