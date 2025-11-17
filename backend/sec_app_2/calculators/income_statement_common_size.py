from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class IncomeStatementCommonSizeCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'RevenueAsPercentOfRevenue': self.calculate_revenue_as_percent_of_revenue,
            'CostOfRevenueAsPercentOfRevenue': self.calculate_cost_of_revenue_as_percent_of_revenue,
            'GrossMarginAsPercentOfRevenue': self.calculate_gross_margin_as_percent_of_revenue,
            'SGAAsPercentOfRevenue': self.calculate_sga_as_percent_of_revenue,
            'DepreciationAsPercentOfRevenue': self.calculate_depreciation_as_percent_of_revenue,
            'OtherOperatingExpenseAsPercentOfRevenue': self.calculate_other_operating_expense_as_percent_of_revenue,
            'OperatingIncomeAsPercentOfRevenue': self.calculate_operating_income_as_percent_of_revenue,
            'InterestExpenseAsPercentOfRevenue': self.calculate_interest_expense_as_percent_of_revenue,
            'InterestIncomeAsPercentOfRevenue': self.calculate_interest_income_as_percent_of_revenue,
            'OtherIncomeAsPercentOfRevenue': self.calculate_other_income_as_percent_of_revenue,
            'PretaxIncomeAsPercentOfRevenue': self.calculate_pretax_income_as_percent_of_revenue,
            'TaxProvisionAsPercentOfRevenue': self.calculate_tax_provision_as_percent_of_revenue,
            'NetIncomeNoncontrollingAsPercentOfRevenue': self.calculate_net_income_noncontrolling_as_percent_of_revenue,
            'NetIncomeAsPercentOfRevenue': self.calculate_net_income_as_percent_of_revenue,
            'OperatingLeaseCostAsPercentOfRevenue': self.calculate_operating_lease_cost_as_percent_of_revenue,
            'VariableLeaseCostAsPercentOfRevenue': self.calculate_variable_lease_cost_as_percent_of_revenue,
            'ForeignCurrencyAdjustmentAsPercentOfRevenue': self.calculate_foreign_currency_adjustment_as_percent_of_revenue,
            'DepreciationAsPercentOfLastYearPPE': self.calculate_depreciation_as_percent_of_last_year_ppe,
            'CapitalExpendituresAsPercentOfRevenue': self.calculate_capital_expenditures_as_percent_of_revenue,
            'UnexplainedChangesInPPEAsPercentOfRevenue': self.calculate_unexplained_changes_in_ppe_as_percent_of_revenue,
            'TaxProvisionAsPercentOfPretaxIncome': self.calculate_tax_provision_as_percent_of_pretax_income,
            'InterestExpenseAsPercentOfTotalLongTermDebt': self.calculate_interest_expense_as_percent_of_total_long_term_debt,
            'InterestIncomeAsPercentOfExcessCash': self.calculate_interest_income_as_percent_of_excess_cash,
            'CommonStockDividendPaymentAsPercentOfNetIncome': self.calculate_common_stock_dividend_payment_as_percent_of_net_income,
        }

        self.dependencies = {
            'Revenue': ['RevenueAsPercentOfRevenue', 'CostOfRevenueAsPercentOfRevenue', 'GrossMarginAsPercentOfRevenue', 'SGAAsPercentOfRevenue', 'DepreciationAsPercentOfRevenue', 'OtherOperatingExpenseAsPercentOfRevenue', 'OperatingIncomeAsPercentOfRevenue', 'InterestExpenseAsPercentOfRevenue', 'InterestIncomeAsPercentOfRevenue', 'OtherIncomeAsPercentOfRevenue', 'PretaxIncomeAsPercentOfRevenue', 'TaxProvisionAsPercentOfRevenue', 'NetIncomeNoncontrollingAsPercentOfRevenue', 'NetIncomeAsPercentOfRevenue', 'OperatingLeaseCostAsPercentOfRevenue', 'VariableLeaseCostAsPercentOfRevenue', 'ForeignCurrencyAdjustmentAsPercentOfRevenue'],
            'CostOfRevenue': ['CostOfRevenueAsPercentOfRevenue', 'GrossMarginAsPercentOfRevenue'],
            'GrossIncome': ['GrossMarginAsPercentOfRevenue'],
            'SellingGeneralAdministrative': ['SGAAsPercentOfRevenue'],
            'Depreciation': ['DepreciationAsPercentOfRevenue', 'DepreciationAsPercentOfLastYearPPE'],
            'OtherOperatingExpense': ['OtherOperatingExpenseAsPercentOfRevenue'],
            'OperatingIncome': ['OperatingIncomeAsPercentOfRevenue'],
            'InterestExpense': ['InterestExpenseAsPercentOfRevenue', 'InterestExpenseAsPercentOfTotalLongTermDebt'],
            'InterestIncome': ['InterestIncomeAsPercentOfRevenue', 'InterestIncomeAsPercentOfExcessCash'],
            'OtherIncome': ['OtherIncomeAsPercentOfRevenue'],
            'PretaxIncome': ['PretaxIncomeAsPercentOfRevenue', 'TaxProvisionAsPercentOfPretaxIncome'],
            'TaxProvision': ['TaxProvisionAsPercentOfRevenue', 'TaxProvisionAsPercentOfPretaxIncome'],
            'NetIncomeNoncontrolling': ['NetIncomeNoncontrollingAsPercentOfRevenue'],
            'NetIncome': ['NetIncomeAsPercentOfRevenue', 'CommonStockDividendPaymentAsPercentOfNetIncome'],
            'OperatingLeaseCost': ['OperatingLeaseCostAsPercentOfRevenue'],
            'VariableLeaseCost': ['VariableLeaseCostAsPercentOfRevenue'],
            'ForeignCurrencyAdjustment': ['ForeignCurrencyAdjustmentAsPercentOfRevenue'],
            'PPEBeginningOfYear': ['DepreciationAsPercentOfLastYearPPE'],
            'CapitalExpenditures': ['CapitalExpendituresAsPercentOfRevenue'],
            'UnexplainedChangesInPPE': ['UnexplainedChangesInPPEAsPercentOfRevenue'],
            'LongTermDebtCurrent': ['InterestExpenseAsPercentOfTotalLongTermDebt'],
            'LongTermDebtNoncurrent': ['InterestExpenseAsPercentOfTotalLongTermDebt'],
            'ExcessCash': ['InterestIncomeAsPercentOfExcessCash'],
            'CommonStockDividendPayment': ['CommonStockDividendPaymentAsPercentOfNetIncome'],
        }

    def _num(self, v: Any) -> float:
        return self.to_number(v)

    def _ratio(self, num: float, den: float) -> float:
        return self.ratio(num, den, 100.0)

    # Revenue-based
    def calculate_revenue_as_percent_of_revenue(self, data: Dict[int, Dict[str, Any]], year: int) -> float:
        return 100.0

    def calculate_cost_of_revenue_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('CostOfRevenue')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_gross_margin_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('GrossIncome')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_sga_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('SellingGeneralAdministrative')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_depreciation_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('Depreciation')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_other_operating_expense_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('OtherOperatingExpense')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_operating_income_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('OperatingIncome')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_interest_expense_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('InterestExpense')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_interest_income_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('InterestIncome')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_other_income_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('OtherIncome')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_pretax_income_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('PretaxIncome')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_tax_provision_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('TaxProvision')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_net_income_noncontrolling_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('NetIncomeNoncontrolling')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_net_income_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('NetIncome')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_operating_lease_cost_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('OperatingLeaseCost')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_variable_lease_cost_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('VariableLeaseCost')), self._num(inc.get(year, {}).get('Revenue')))

    def calculate_foreign_currency_adjustment_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        return self._ratio(self._num(inc.get(year, {}).get('ForeignCurrencyAdjustment')), self._num(inc.get(year, {}).get('Revenue')))

    # PPE & Capex ratios
    def calculate_depreciation_as_percent_of_last_year_ppe(self, data, year, inc=None, ppe=None) -> Optional[float]:
        if not inc or not ppe: return None
        depreciation = self._num(inc.get(year, {}).get('Depreciation'))
        ppe_begin = self._num(ppe.get(year, {}).get('PPEBeginningOfYear'))
        return self._ratio(depreciation, ppe_begin)

    def calculate_capital_expenditures_as_percent_of_revenue(self, data, year, inc=None, ppe=None) -> Optional[float]:
        if not inc or not ppe: return None
        capex = self._num(ppe.get(year, {}).get('CapitalExpenditures'))
        revenue = self._num(inc.get(year, {}).get('Revenue'))
        return self._ratio(capex, revenue)

    def calculate_unexplained_changes_in_ppe_as_percent_of_revenue(self, data, year, inc=None, ppe=None) -> Optional[float]:
        if not inc or not ppe: return None
        val = self._num(ppe.get(year, {}).get('UnexplainedChangesInPPE'))
        revenue = self._num(inc.get(year, {}).get('Revenue'))
        return self._ratio(val, revenue)

    # Tax and interest
    def calculate_tax_provision_as_percent_of_pretax_income(self, data, year, inc=None) -> Optional[float]:
        if not inc: return None
        tax = self._num(inc.get(year, {}).get('TaxProvision'))
        pretax = self._num(inc.get(year, {}).get('PretaxIncome'))
        return self._ratio(tax, pretax)

    def calculate_interest_expense_as_percent_of_total_long_term_debt(self, data, year, inc=None, bs=None) -> Optional[float]:
        if not inc or not bs: return None
        interest_expense = self._num(inc.get(year, {}).get('InterestExpense'))
        py = year - 1
        ltd = self._num(bs.get(py, {}).get('LongTermDebtCurrent')) + self._num(bs.get(py, {}).get('LongTermDebtNoncurrent'))
        return self._ratio(interest_expense, ltd)

    def calculate_interest_income_as_percent_of_excess_cash(self, data, year, inc=None, bs=None) -> Optional[float]:
        if not inc or not bs: return None
        interest_income = self._num(inc.get(year, {}).get('InterestIncome'))
        py = year - 1
        cash = self._num(bs.get(py, {}).get('ExcessCash'))
        return self._ratio(interest_income, cash)

    # Cash flow
    def calculate_common_stock_dividend_payment_as_percent_of_net_income(self, data, year, inc=None, cf=None) -> Optional[float]:
        if not inc or not cf: return None
        div = self._num(cf.get(year, {}).get('CommonStockDividendPayment'))
        ni = self._num(inc.get(year, {}).get('NetIncome'))
        return self._ratio(div, ni)

    def calculate_all_fields(self, data: Dict[int, Dict[str, Any]], year: int, income_statement_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, ppe_changes_data: Dict[int, Dict[str, Any]] = None, cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                if name in ['RevenueAsPercentOfRevenue']:
                    v = func(data, year)
                elif name in ['CostOfRevenueAsPercentOfRevenue', 'GrossMarginAsPercentOfRevenue', 'SGAAsPercentOfRevenue', 'DepreciationAsPercentOfRevenue', 'OtherOperatingExpenseAsPercentOfRevenue', 'OperatingIncomeAsPercentOfRevenue', 'InterestExpenseAsPercentOfRevenue', 'InterestIncomeAsPercentOfRevenue', 'OtherIncomeAsPercentOfRevenue', 'PretaxIncomeAsPercentOfRevenue', 'TaxProvisionAsPercentOfRevenue', 'NetIncomeNoncontrollingAsPercentOfRevenue', 'NetIncomeAsPercentOfRevenue', 'OperatingLeaseCostAsPercentOfRevenue', 'VariableLeaseCostAsPercentOfRevenue', 'ForeignCurrencyAdjustmentAsPercentOfRevenue', 'TaxProvisionAsPercentOfPretaxIncome']:
                    v = func(data, year, income_statement_data)
                elif name in ['DepreciationAsPercentOfLastYearPPE', 'CapitalExpendituresAsPercentOfRevenue', 'UnexplainedChangesInPPEAsPercentOfRevenue']:
                    v = func(data, year, income_statement_data, ppe_changes_data)
                elif name in ['InterestExpenseAsPercentOfTotalLongTermDebt', 'InterestIncomeAsPercentOfExcessCash']:
                    v = func(data, year, income_statement_data, balance_sheet_data)
                elif name in ['CommonStockDividendPaymentAsPercentOfNetIncome']:
                    v = func(data, year, income_statement_data, cash_flow_data)
                else:
                    v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data: Dict[int, Dict[str, Any]], year: int, income_statement_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, ppe_changes_data: Dict[int, Dict[str, Any]] = None, cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, income_statement_data, balance_sheet_data, ppe_changes_data, cash_flow_data))
        logger.info(f"Updated calculated income statement common size fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data: Dict[int, Dict[str, Any]], year: int, changed_field: str, income_statement_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, ppe_changes_data: Dict[int, Dict[str, Any]] = None, cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    if name in ['RevenueAsPercentOfRevenue']:
                        v = self.calculated_fields[name](data, year)
                    elif name in ['CostOfRevenueAsPercentOfRevenue', 'GrossMarginAsPercentOfRevenue', 'SGAAsPercentOfRevenue', 'DepreciationAsPercentOfRevenue', 'OtherOperatingExpenseAsPercentOfRevenue', 'OperatingIncomeAsPercentOfRevenue', 'InterestExpenseAsPercentOfRevenue', 'InterestIncomeAsPercentOfRevenue', 'OtherIncomeAsPercentOfRevenue', 'PretaxIncomeAsPercentOfRevenue', 'TaxProvisionAsPercentOfRevenue', 'NetIncomeNoncontrollingAsPercentOfRevenue', 'NetIncomeAsPercentOfRevenue', 'OperatingLeaseCostAsPercentOfRevenue', 'VariableLeaseCostAsPercentOfRevenue', 'ForeignCurrencyAdjustmentAsPercentOfRevenue', 'TaxProvisionAsPercentOfPretaxIncome']:
                        v = self.calculated_fields[name](data, year, income_statement_data)
                    elif name in ['DepreciationAsPercentOfLastYearPPE', 'CapitalExpendituresAsPercentOfRevenue', 'UnexplainedChangesInPPEAsPercentOfRevenue']:
                        v = self.calculated_fields[name](data, year, income_statement_data, ppe_changes_data)
                    elif name in ['InterestExpenseAsPercentOfTotalLongTermDebt', 'InterestIncomeAsPercentOfExcessCash']:
                        v = self.calculated_fields[name](data, year, income_statement_data, balance_sheet_data)
                    elif name in ['CommonStockDividendPaymentAsPercentOfNetIncome']:
                        v = self.calculated_fields[name](data, year, income_statement_data, cash_flow_data)
                    else:
                        v = self.calculated_fields[name](data, year)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent income statement common size fields for year {year} after changing {changed_field}")
        return data


income_statement_common_size_calculator = IncomeStatementCommonSizeCalculator()


def calculate_income_statement_common_size_field(data: Dict[int, Dict[str, Any]], year: int, field_name: str, income_statement_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, ppe_changes_data: Dict[int, Dict[str, Any]] = None, cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
    if field_name in income_statement_common_size_calculator.calculated_fields:
        calc = income_statement_common_size_calculator.calculated_fields[field_name]
        if field_name in ['RevenueAsPercentOfRevenue']:
            return calc(data, year)
        elif field_name in ['CostOfRevenueAsPercentOfRevenue', 'GrossMarginAsPercentOfRevenue', 'SGAAsPercentOfRevenue', 'DepreciationAsPercentOfRevenue', 'OtherOperatingExpenseAsPercentOfRevenue', 'OperatingIncomeAsPercentOfRevenue', 'InterestExpenseAsPercentOfRevenue', 'InterestIncomeAsPercentOfRevenue', 'OtherIncomeAsPercentOfRevenue', 'PretaxIncomeAsPercentOfRevenue', 'TaxProvisionAsPercentOfRevenue', 'NetIncomeNoncontrollingAsPercentOfRevenue', 'NetIncomeAsPercentOfRevenue', 'OperatingLeaseCostAsPercentOfRevenue', 'VariableLeaseCostAsPercentOfRevenue', 'ForeignCurrencyAdjustmentAsPercentOfRevenue', 'TaxProvisionAsPercentOfPretaxIncome']:
            return calc(data, year, income_statement_data)
        elif field_name in ['DepreciationAsPercentOfLastYearPPE', 'CapitalExpendituresAsPercentOfRevenue', 'UnexplainedChangesInPPEAsPercentOfRevenue']:
            return calc(data, year, income_statement_data, ppe_changes_data)
        elif field_name in ['InterestExpenseAsPercentOfTotalLongTermDebt', 'InterestIncomeAsPercentOfExcessCash']:
            return calc(data, year, income_statement_data, balance_sheet_data)
        elif field_name in ['CommonStockDividendPaymentAsPercentOfNetIncome']:
            return calc(data, year, income_statement_data, cash_flow_data)
        else:
            return calc(data, year)
    logger.warning(f"Field {field_name} is not a calculated income statement common size field")
    return None


def update_income_statement_common_size_calculations(data: Dict[int, Dict[str, Any]], year: int, income_statement_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, ppe_changes_data: Dict[int, Dict[str, Any]] = None, cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return income_statement_common_size_calculator.update_calculated_fields(data, year, income_statement_data, balance_sheet_data, ppe_changes_data, cash_flow_data)


def recalculate_income_statement_common_size_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str, income_statement_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, ppe_changes_data: Dict[int, Dict[str, Any]] = None, cash_flow_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return income_statement_common_size_calculator.recalculate_dependent_fields(data, year, changed_field, income_statement_data, balance_sheet_data, ppe_changes_data, cash_flow_data)


