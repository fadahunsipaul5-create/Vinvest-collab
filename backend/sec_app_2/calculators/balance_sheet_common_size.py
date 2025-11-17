from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class BalanceSheetCommonSizeCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'CashAndCashEquivalentsAsPercentOfRevenue': self.pct,
            'ReceivablesCurrentAsPercentOfRevenue': self.pct,
            'InventoryAsPercentOfRevenue': self.pct,
            'OtherAssetsCurrentAsPercentOfRevenue': self.pct,
            'AssetsCurrentAsPercentOfRevenue': self.pct,
            'PropertyPlantAndEquipmentAsPercentOfRevenue': self.pct,
            'OperatingLeaseAssetsAsPercentOfRevenue': self.pct,
            'FinanceLeaseAssetsAsPercentOfRevenue': self.pct,
            'GoodwillAsPercentOfRevenue': self.pct,
            'DeferredIncomeTaxAssetsNoncurrentAsPercentOfRevenue': self.pct,
            'OtherAssetsNoncurrentAsPercentOfRevenue': self.pct,
            'AssetsAsPercentOfRevenue': self.pct,
            'AccountsPayableCurrentAsPercentOfRevenue': self.pct,
            'EmployeeLiabilitiesCurrentAsPercentOfRevenue': self.pct,
            'AccruedLiabilitiesCurrentAsPercentOfRevenue': self.pct,
            'DeferredRevenueCurrentAsPercentOfRevenue': self.pct,
            'LongTermDebtCurrentAsPercentOfRevenue': self.pct,
            'OperatingLeaseLiabilitiesCurrentAsPercentOfRevenue': self.pct,
            'FinanceLeaseLiabilitiesCurrentAsPercentOfRevenue': self.pct,
            'OtherLiabilitiesCurrentAsPercentOfRevenue': self.pct,
            'LiabilitiesCurrentAsPercentOfRevenue': self.pct,
            'LongTermDebtNoncurrentAsPercentOfRevenue': self.pct,
            'OperatingLeaseLiabilitiesNoncurrentAsPercentOfRevenue': self.pct,
            'FinanceLeaseLiabilitiesNoncurrentAsPercentOfRevenue': self.pct,
            'DeferredIncomeTaxLiabilitiesNoncurrentAsPercentOfRevenue': self.pct,
            'OtherLiabilitiesNoncurrentAsPercentOfRevenue': self.pct,
            'LiabilitiesAsPercentOfRevenue': self.pct,
            'RetainedEarningsAsPercentOfRevenue': self.pct,
            'EquityAsPercentOfRevenue': self.pct,
            'VariableLeaseAssetsAsPercentOfRevenue': self.pct_cap,
            'ForeignTaxCreditCarryForwardAsPercentOfRevenue': self.pct_cap,
            'DeferredIncomeTaxesNetAsPercentOfRevenue': self.pct_cap,
            'NoncontrollingInterestsAsPercentOfRevenue': self.pct_cap,
            'ForeignCurrencyAdjustmentAsPercentOfRevenue': self.pct_fcf,
            'CashAndCashEquivalents365DayTurnover': self.turnover,
            'ReceivablesCurrent365DayTurnover': self.turnover,
            'Inventory365DayTurnover': self.turnover,
            'OtherAssetsCurrent365DayTurnover': self.turnover,
            'AssetsCurrent365DayTurnover': self.turnover,
            'AccountsPayableCurrent365DayTurnover': self.turnover,
            'EmployeeLiabilitiesCurrent365DayTurnover': self.turnover,
            'AccruedLiabilitiesCurrent365DayTurnover': self.turnover,
            'DeferredRevenueCurrent365DayTurnover': self.turnover,
            'LongTermDebtCurrent365DayTurnover': self.turnover,
            'OperatingLeaseLiabilitiesCurrent365DayTurnover': self.turnover,
            'FinanceLeaseLiabilitiesCurrent365DayTurnover': self.turnover,
            'OtherLiabilitiesCurrent365DayTurnover': self.turnover,
            'LiabilitiesCurrent365DayTurnover': self.turnover,
        }

    def _num(self, v: Any) -> float:
        return self.to_number(v)

    def pct(self, bs_year: Dict[str, Any], inc_year: Dict[str, Any], key_name: str) -> float:
        return 0.0 if self._num(inc_year.get('Revenue')) == 0 else (self._num(bs_year.get(key_name)) / self._num(inc_year.get('Revenue'))) * 100

    def pct_cap(self, cap_year: Dict[str, Any], inc_year: Dict[str, Any], key_name: str) -> float:
        return 0.0 if self._num(inc_year.get('Revenue')) == 0 else (self._num(cap_year.get(key_name)) / self._num(inc_year.get('Revenue'))) * 100

    def pct_fcf(self, fcf_year: Dict[str, Any], inc_year: Dict[str, Any], key_name: str) -> float:
        return 0.0 if self._num(inc_year.get('Revenue')) == 0 else (self._num(fcf_year.get(key_name)) / self._num(inc_year.get('Revenue'))) * 100

    def turnover(self, bs_year: Dict[str, Any], inc_year: Dict[str, Any], key_name: str) -> float:
        return 0.0 if self._num(inc_year.get('Revenue')) == 0 else 365 * (self._num(bs_year.get(key_name)) / self._num(inc_year.get('Revenue')))

    def calculate_all_fields(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, free_cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[str, Any]:
        results: Dict[str, Any] = {}
        bs_year = (balance_sheet_data or {}).get(year, {})
        inc_year = (income_statement_data or {}).get(year, {})
        cap_year = (capital_data or {}).get(year, {})
        fcf_year = (free_cash_flow_data or {}).get(year, {})
        for name, func in self.calculated_fields.items():
            try:
                if name.endswith('AsPercentOfRevenue'):
                    if 'VariableLeaseAssets' in name or 'ForeignTaxCreditCarryForward' in name or 'DeferredIncomeTaxesNet' in name or 'NoncontrollingInterests' in name:
                        key = name.replace('AsPercentOfRevenue', '').replace('DeferredIncomeTaxesNet', 'DeferredIncomeTaxesNet')
                        results[name] = self.pct_cap(cap_year, inc_year, key)
                    elif 'ForeignCurrencyAdjustment' in name:
                        key = 'ForeignCurrencyAdjustment'
                        results[name] = self.pct_fcf(fcf_year, inc_year, key)
                    else:
                        key = name.replace('AsPercentOfRevenue', '')
                        results[name] = self.pct(bs_year, inc_year, key)
                elif name.endswith('365DayTurnover'):
                    key = name.replace('365DayTurnover', '')
                    results[name] = self.turnover(bs_year, inc_year, key)
            except Exception as e:
                logger.error(f"Error calculating {name} for {year}: {e}")
                results[name] = 0.0
        return results

    def update_calculated_fields(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, free_cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, balance_sheet_data, income_statement_data, capital_data, free_cash_flow_data))
        return data

    def recalculate_dependent_fields(self, data: Dict[int, Dict[str, Any]], year: int, changed_field: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, free_cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        # Simplified: recalc all since dependency set is broad
        return self.update_calculated_fields(data, year, balance_sheet_data, income_statement_data, capital_data, free_cash_flow_data)


balance_sheet_common_size_calculator = BalanceSheetCommonSizeCalculator()


def calculate_balance_sheet_common_size_field(data: Dict[int, Dict[str, Any]], year: int, field_name: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, free_cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Any:
    # Minimal on-demand: compute all and return field
    results = balance_sheet_common_size_calculator.calculate_all_fields(data, year, balance_sheet_data, income_statement_data, capital_data, free_cash_flow_data)
    return results.get(field_name)


def update_balance_sheet_common_size_calculations(data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, free_cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return balance_sheet_common_size_calculator.update_calculated_fields(data, year, balance_sheet_data, income_statement_data, capital_data, free_cash_flow_data)


def recalculate_balance_sheet_common_size_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, free_cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return balance_sheet_common_size_calculator.recalculate_dependent_fields(data, year, changed_field, balance_sheet_data, income_statement_data, capital_data, free_cash_flow_data)


