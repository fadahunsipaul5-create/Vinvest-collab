from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class FreeCashFlowCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'NOPAT': self.get_nopat_field,
            'Depreciation': self.get_nopat_field,
            'EBITAAdjusted': self.get_nopat_field,
            'ChangeInOperatingWorkingCapital': self.calculate_change_in_operating_working_capital,
            'ChangeInOperatingLeaseAssets': self.calculate_change_in_operating_lease_assets,
            'ChangeInVariableLeaseAssets': self.calculate_change_in_variable_lease_assets,
            'ChangeInFinanceLeaseAssets': self.calculate_change_in_finance_lease_assets,
            'ChangeInGoodwill': self.calculate_change_in_goodwill,
            'ChangeInNetOtherNoncurrentAssets': self.calculate_change_in_net_other_noncurrent_assets,
            'CapitalExpenditures': self.get_free_cash_flow_field,
            'ChangeInExcessCash': self.calculate_change_in_excess_cash,
            'ChangeInForeignTaxCreditCarryForward': self.calculate_change_in_foreign_tax_credit_carry_forward,
            'InterestIncome': self.get_income_statement_field,
            'OtherIncome': self.get_income_statement_field,
            'TaxesNonoperating': self.get_free_cash_flow_field,
            'ForeignCurrencyAdjustment': self.get_income_statement_field,
            'UnexplainedChangesInPPE': self.get_ppe_changes_field,
            'GrossCashFlow': self.calculate_gross_cash_flow,
            'FreeCashFlow': self.calculate_free_cash_flow,
            'DiscountFactor': self.calculate_discount_factor,
            'PresentValueOfFreeCashFlow': self.calculate_present_value_of_free_cash_flow,
        }

        self.dependencies = {
            'NOPAT': ['GrossCashFlow', 'FreeCashFlow'],
            'Depreciation': ['GrossCashFlow'],
            'EBITAAdjusted': ['GrossCashFlow'],
            'OperatingWorkingCapital': ['ChangeInOperatingWorkingCapital', 'FreeCashFlow'],
            'OperatingLeaseAssets': ['ChangeInOperatingLeaseAssets', 'FreeCashFlow'],
            'VariableLeaseAssets': ['ChangeInVariableLeaseAssets', 'FreeCashFlow'],
            'FinanceLeaseAssets': ['ChangeInFinanceLeaseAssets', 'FreeCashFlow'],
            'Goodwill': ['ChangeInGoodwill', 'FreeCashFlow'],
            'OtherAssetsNoncurrent': ['ChangeInNetOtherNoncurrentAssets', 'FreeCashFlow'],
            'OtherLiabilitiesNoncurrent': ['ChangeInNetOtherNoncurrentAssets', 'FreeCashFlow'],
            'ExcessCash': ['ChangeInExcessCash', 'FreeCashFlow'],
            'ForeignTaxCreditCarryForward': ['ChangeInForeignTaxCreditCarryForward', 'FreeCashFlow'],
            'InterestIncome': ['FreeCashFlow'],
            'OtherIncome': ['FreeCashFlow'],
            'ForeignCurrencyAdjustment': ['FreeCashFlow'],
            'UnexplainedChangesInPPE': ['FreeCashFlow'],
            'CapitalExpenditures': ['FreeCashFlow'],
            'TaxesNonoperating': ['FreeCashFlow'],
            'GrossCashFlow': ['FreeCashFlow'],
            'FreeCashFlow': ['PresentValueOfFreeCashFlow'],
            'DiscountFactor': ['PresentValueOfFreeCashFlow'],
            'WeightedAverageCostOfCapital': ['DiscountFactor', 'PresentValueOfFreeCashFlow'],
        }

    def _num(self, v: Any) -> float:
        return self.to_number(v)

    def get_nopat_field(self, data: Dict[int, Dict[str, Any]], year: int, key: str) -> float:
        return self._num((data or {}).get(year, {}).get(key))

    def get_income_statement_field(self, data: Dict[int, Dict[str, Any]], year: int, key: str) -> float:
        return self._num((data or {}).get(year, {}).get(key))

    def get_balance_sheet_field(self, data: Dict[int, Dict[str, Any]], year: int, key: str) -> float:
        return self._num((data or {}).get(year, {}).get(key))

    def get_capital_table_field(self, data: Dict[int, Dict[str, Any]], year: int, key: str) -> float:
        return self._num((data or {}).get(year, {}).get(key))

    def get_free_cash_flow_field(self, data: Dict[int, Dict[str, Any]], year: int, key: str) -> float:
        return self._num((data or {}).get(year, {}).get(key))

    def get_ppe_changes_field(self, data: Dict[int, Dict[str, Any]], year: int, key: str) -> float:
        return self._num((data or {}).get(year, {}).get(key))

    def calculate_change(self, current: float, prior: float) -> float:
        return current - prior

    def calculate_change_in_operating_working_capital(self, data, year, cap=None) -> Optional[float]:
        if not cap: return None
        cur = self.get_capital_table_field(cap, year, 'OperatingWorkingCapital')
        py = self.get_capital_table_field(cap, year - 1, 'OperatingWorkingCapital')
        return self.calculate_change(cur, py)

    def calculate_change_in_operating_lease_assets(self, data, year, bs=None) -> Optional[float]:
        if not bs: return None
        cur = self.get_balance_sheet_field(bs, year, 'OperatingLeaseAssets')
        py = self.get_balance_sheet_field(bs, year - 1, 'OperatingLeaseAssets')
        return self.calculate_change(cur, py)

    def calculate_change_in_variable_lease_assets(self, data, year, bs=None) -> Optional[float]:
        if not bs: return None
        cur = self.get_balance_sheet_field(bs, year, 'VariableLeaseAssets')
        py = self.get_balance_sheet_field(bs, year - 1, 'VariableLeaseAssets')
        return self.calculate_change(cur, py)

    def calculate_change_in_finance_lease_assets(self, data, year, bs=None) -> Optional[float]:
        if not bs: return None
        cur = self.get_balance_sheet_field(bs, year, 'FinanceLeaseAssets')
        py = self.get_balance_sheet_field(bs, year - 1, 'FinanceLeaseAssets')
        return self.calculate_change(cur, py)

    def calculate_change_in_goodwill(self, data, year, bs=None) -> Optional[float]:
        if not bs: return None
        cur = self.get_balance_sheet_field(bs, year, 'Goodwill')
        py = self.get_balance_sheet_field(bs, year - 1, 'Goodwill')
        return self.calculate_change(cur, py)

    def calculate_change_in_net_other_noncurrent_assets(self, data, year, bs=None) -> Optional[float]:
        if not bs: return None
        cur = self.get_balance_sheet_field(bs, year, 'OtherAssetsNoncurrent') - self.get_balance_sheet_field(bs, year, 'OtherLiabilitiesNoncurrent')
        py_val = self.get_balance_sheet_field(bs, year - 1, 'OtherAssetsNoncurrent') - self.get_balance_sheet_field(bs, year - 1, 'OtherLiabilitiesNoncurrent')
        return self.calculate_change(cur, py_val)

    def calculate_change_in_excess_cash(self, data, year, cap=None) -> Optional[float]:
        if not cap: return None
        cur = self.get_capital_table_field(cap, year, 'ExcessCash')
        py = self.get_capital_table_field(cap, year - 1, 'ExcessCash')
        return self.calculate_change(py, cur)

    def calculate_change_in_foreign_tax_credit_carry_forward(self, data, year, cap=None) -> Optional[float]:
        if not cap: return None
        cur = self.get_capital_table_field(cap, year, 'ForeignTaxCreditCarryForward')
        py = self.get_capital_table_field(cap, year - 1, 'ForeignTaxCreditCarryForward')
        return self.calculate_change(py, cur)

    def calculate_gross_cash_flow(self, data, year, nopat=None) -> Optional[float]:
        if not nopat: return None
        return self.get_nopat_field(nopat, year, 'NOPAT') + self.get_nopat_field(nopat, year, 'Depreciation')

    def calculate_free_cash_flow(self, data, year, nopat=None, inc=None, bs=None, cap=None, ppe=None) -> Optional[float]:
        try:
            gcf = self.calculate_gross_cash_flow(data, year, nopat) or 0
            ii = self.get_income_statement_field(inc or {}, year, 'InterestIncome')
            oi = self.get_income_statement_field(inc or {}, year, 'OtherIncome')
            fxa = self.get_income_statement_field(inc or {}, year, 'ForeignCurrencyAdjustment')
            wc = self.calculate_change_in_operating_working_capital(data, year, cap) or 0
            cola = self.calculate_change_in_operating_lease_assets(data, year, bs) or 0
            cvla = self.calculate_change_in_variable_lease_assets(data, year, bs) or 0
            cfla = self.calculate_change_in_finance_lease_assets(data, year, bs) or 0
            cg = self.calculate_change_in_goodwill(data, year, bs) or 0
            cona = self.calculate_change_in_net_other_noncurrent_assets(data, year, bs) or 0
            capex = self.get_free_cash_flow_field(data, year, 'CapitalExpenditures')
            taxes = self.get_free_cash_flow_field(data, year, 'TaxesNonoperating')
            dec = self.calculate_change_in_excess_cash(data, year, cap) or 0
            dftc = self.calculate_change_in_foreign_tax_credit_carry_forward(data, year, cap) or 0
            uppe = self.get_ppe_changes_field(ppe or {}, year, 'UnexplainedChangesInPPE')
            result = (
                gcf + ii + oi + fxa - wc - cola - cvla - cfla - cg - cona - capex - taxes - dec - dftc - uppe
            )
            logger.debug(f"Free Cash Flow for {year}: computed")
            return result
        except Exception as e:
            logger.error(f"Error calculating Free Cash Flow for year {year}: {e}")
            return None

    def calculate_discount_factor(self, data, year, wacc: float = None, base_year: int = None) -> Optional[float]:
        try:
            if wacc is None:
                wacc = (data.get(year, {}) or {}).get('WeightedAverageCostOfCapital', 0.1)
            if base_year is None:
                # Use the earliest year in the dataset as base year
                years = [y for y in data.keys() if isinstance(y, int)]
                base_year = min(years) if years else year
            order = year - base_year
            return 1.0 if order <= 0 else 1 / ((1 + wacc) ** order)
        except Exception as e:
            logger.error(f"Error calculating Discount Factor for year {year}: {e}")
            return None

    def calculate_present_value_of_free_cash_flow(self, data, year) -> Optional[float]:
        try:
            df = (data.get(year, {}) or {}).get('DiscountFactor', 1.0)
            fcf = (data.get(year, {}) or {}).get('FreeCashFlow', 0)
            return df * fcf
        except Exception as e:
            logger.error(f"Error calculating Present Value of Free Cash Flow for year {year}: {e}")
            return None

    def calculate_all_fields(self, data, year, nopat=None, inc=None, bs=None, cap=None, ppe=None, wacc: float = None) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                if name in ['NOPAT', 'Depreciation', 'EBITAAdjusted']:
                    v = func(nopat or {}, year, name)
                elif name in ['InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment']:
                    v = func(inc or {}, year, name)
                elif name in ['ChangeInOperatingLeaseAssets', 'ChangeInVariableLeaseAssets', 'ChangeInFinanceLeaseAssets', 'ChangeInGoodwill', 'ChangeInNetOtherNoncurrentAssets']:
                    v = func(data, year, bs)
                elif name in ['ChangeInOperatingWorkingCapital', 'ChangeInExcessCash', 'ChangeInForeignTaxCreditCarryForward']:
                    v = func(data, year, cap)
                elif name in ['CapitalExpenditures', 'TaxesNonoperating']:
                    v = func(data, year, name)
                elif name in ['UnexplainedChangesInPPE']:
                    v = func(ppe or {}, year, name)
                elif name in ['GrossCashFlow']:
                    v = func(data, year, nopat)
                elif name in ['FreeCashFlow']:
                    v = func(data, year, nopat, inc, bs, cap, ppe)
                elif name in ['DiscountFactor']:
                    v = func(data, year, wacc, None)  # base_year will be auto-determined
                elif name in ['PresentValueOfFreeCashFlow']:
                    v = func(data, year)
                else:
                    v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data, year, nopat=None, inc=None, bs=None, cap=None, ppe=None, wacc: float = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, nopat, inc, bs, cap, ppe, wacc))
        logger.info(f"Updated calculated free cash flow fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data, year, changed_field, nopat=None, inc=None, bs=None, cap=None, ppe=None, wacc: float = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    if name in ['NOPAT', 'Depreciation', 'EBITAAdjusted']:
                        v = self.calculated_fields[name](nopat or {}, year, name)
                    elif name in ['InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment']:
                        v = self.calculated_fields[name](inc or {}, year, name)
                    elif name in ['ChangeInOperatingLeaseAssets', 'ChangeInVariableLeaseAssets', 'ChangeInFinanceLeaseAssets', 'ChangeInGoodwill', 'ChangeInNetOtherNoncurrentAssets']:
                        v = self.calculated_fields[name](data, year, bs)
                    elif name in ['ChangeInOperatingWorkingCapital', 'ChangeInExcessCash', 'ChangeInForeignTaxCreditCarryForward']:
                        v = self.calculated_fields[name](data, year, cap)
                    elif name in ['CapitalExpenditures', 'TaxesNonoperating']:
                        v = self.calculated_fields[name](data, year, name)
                    elif name in ['UnexplainedChangesInPPE']:
                        v = self.calculated_fields[name](ppe or {}, year, name)
                    elif name in ['GrossCashFlow']:
                        v = self.calculated_fields[name](data, year, nopat)
                    elif name in ['FreeCashFlow']:
                        v = self.calculated_fields[name](data, year, nopat, inc, bs, cap, ppe)
                    elif name in ['DiscountFactor']:
                        v = self.calculated_fields[name](data, year, wacc, None)  # base_year will be auto-determined
                    elif name in ['PresentValueOfFreeCashFlow']:
                        v = self.calculated_fields[name](data, year)
                    else:
                        v = self.calculated_fields[name](data, year)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent free cash flow fields for year {year} after changing {changed_field}")
        return data


free_cash_flow_calculator = FreeCashFlowCalculator()


def calculate_free_cash_flow_field(data, year, field_name, nopat=None, inc=None, bs=None, cap=None, ppe=None, wacc: float = None) -> Optional[float]:
    if field_name in free_cash_flow_calculator.calculated_fields:
        calc = free_cash_flow_calculator.calculated_fields[field_name]
        if field_name in ['NOPAT', 'Depreciation', 'EBITAAdjusted']:
            return calc(nopat or {}, year, field_name)
        elif field_name in ['InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment']:
            return calc(inc or {}, year, field_name)
        elif field_name in ['ChangeInOperatingLeaseAssets', 'ChangeInVariableLeaseAssets', 'ChangeInFinanceLeaseAssets', 'ChangeInGoodwill', 'ChangeInNetOtherNoncurrentAssets']:
            return calc(data, year, bs)
        elif field_name in ['ChangeInOperatingWorkingCapital', 'ChangeInExcessCash', 'ChangeInForeignTaxCreditCarryForward']:
            return calc(data, year, cap)
        elif field_name in ['CapitalExpenditures', 'TaxesNonoperating']:
            return calc(data, year, field_name)
        elif field_name in ['UnexplainedChangesInPPE']:
            return calc(ppe or {}, year, field_name)
        elif field_name in ['GrossCashFlow']:
            return calc(data, year, nopat)
        elif field_name in ['FreeCashFlow']:
            return calc(data, year, nopat, inc, bs, cap, ppe)
        elif field_name in ['DiscountFactor']:
            return calc(data, year, wacc)
        elif field_name in ['PresentValueOfFreeCashFlow']:
            return calc(data, year)
        else:
            return calc(data, year)
    logger.warning(f"Field {field_name} is not a calculated free cash flow field")
    return None


def update_free_cash_flow_calculations(data, year, nopat=None, inc=None, bs=None, cap=None, ppe=None, wacc: float = None) -> Dict[int, Dict[str, Any]]:
    return free_cash_flow_calculator.update_calculated_fields(data, year, nopat, inc, bs, cap, ppe, wacc)


def recalculate_free_cash_flow_dependent_fields(data, year, changed_field, nopat=None, inc=None, bs=None, cap=None, ppe=None, wacc: float = None) -> Dict[int, Dict[str, Any]]:
    return free_cash_flow_calculator.recalculate_dependent_fields(data, year, changed_field, nopat, inc, bs, cap, ppe, wacc)


