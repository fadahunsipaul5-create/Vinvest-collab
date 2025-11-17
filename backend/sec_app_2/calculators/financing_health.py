from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class FinancingHealthCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'AdjustedEBITDA': self.calculate_adjusted_ebitda,
            'TotalInterestExpense': self.calculate_total_interest_expense,
            'EBITAInterestCoverageRatio': self.calculate_ebita_interest_coverage_ratio,
            'AdjustedEBITDAInterestCoverageRatio': self.calculate_adjusted_ebitda_interest_coverage_ratio,
            'DebtToEBITARatio': self.calculate_debt_to_ebita_ratio,
            'DebtToAdjustedEBITDARatio': self.calculate_debt_to_adjusted_ebitda_ratio,
            'DebtToEquityRatio': self.calculate_debt_to_equity_ratio,
        }

        self.dependencies = {
            'EBITAAdjusted': ['AdjustedEBITDA', 'EBITAInterestCoverageRatio', 'AdjustedEBITDAInterestCoverageRatio', 'DebtToEBITARatio'],
            'Depreciation': ['AdjustedEBITDA', 'AdjustedEBITDAInterestCoverageRatio'],
            'OperatingLeaseInterest': ['TotalInterestExpense'],
            'VariableLeaseInterest': ['TotalInterestExpense'],
            'InterestExpense': ['TotalInterestExpense', 'EBITAInterestCoverageRatio', 'AdjustedEBITDAInterestCoverageRatio'],
            'Debt': ['DebtToEBITARatio', 'DebtToAdjustedEBITDARatio', 'DebtToEquityRatio'],
            'Equity': ['DebtToEquityRatio'],
            'AdjustedEBITDA': ['AdjustedEBITDAInterestCoverageRatio', 'DebtToAdjustedEBITDARatio'],
            'TotalInterestExpense': ['EBITAInterestCoverageRatio', 'AdjustedEBITDAInterestCoverageRatio'],
        }

    def _num(self, v: Any) -> float:
        return self.to_number(v)

    def _ratio(self, num: float, den: float) -> float:
        return self.ratio(num, den, 1.0)

    def get_nopat(self, nopat, year, key):
        return self._num((nopat or {}).get(year, {}).get(key))

    def get_income(self, inc, year, key):
        return self._num((inc or {}).get(year, {}).get(key))

    def get_capital(self, cap, year, key):
        return self._num((cap or {}).get(year, {}).get(key))

    def get_bs(self, bs, year, key):
        return self._num((bs or {}).get(year, {}).get(key))

    def calculate_adjusted_ebitda(self, data, year, nopat=None) -> Optional[float]:
        if not nopat: return None
        return self.get_nopat(nopat, year, 'EBITAAdjusted') + self.get_nopat(nopat, year, 'Depreciation')

    def calculate_total_interest_expense(self, data, year, income=None, nopat=None) -> Optional[float]:
        if not income or not nopat: return None
        return self.get_income(income, year, 'InterestExpense') + self.get_nopat(nopat, year, 'OperatingLeaseInterest') + self.get_nopat(nopat, year, 'VariableLeaseInterest')

    def calculate_ebita_interest_coverage_ratio(self, data, year, nopat=None, fin_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        if not nopat or fin_data is None: return None
        ebita_adj = self.get_nopat(nopat, year, 'EBITAAdjusted')
        total_interest = self._num(fin_data.get(year, {}).get('TotalInterestExpense'))
        return self._ratio(ebita_adj, total_interest)

    def calculate_adjusted_ebitda_interest_coverage_ratio(self, data, year, nopat=None, fin_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        if not nopat or fin_data is None: return None
        ebita_adj = self.get_nopat(nopat, year, 'EBITAAdjusted')
        dep = self.get_nopat(nopat, year, 'Depreciation')
        total_interest = self._num(fin_data.get(year, {}).get('TotalInterestExpense'))
        return self._ratio(ebita_adj + dep, total_interest)

    def calculate_debt_to_ebita_ratio(self, data, year, cap=None, nopat=None) -> Optional[float]:
        if not cap or not nopat: return None
        return self._ratio(self.get_capital(cap, year, 'Debt'), self.get_nopat(nopat, year, 'EBITAAdjusted'))

    def calculate_debt_to_adjusted_ebitda_ratio(self, data, year, cap=None, fin_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        if not cap or fin_data is None: return None
        return self._ratio(self.get_capital(cap, year, 'Debt'), self._num(fin_data.get(year, {}).get('AdjustedEBITDA')))

    def calculate_debt_to_equity_ratio(self, data, year, cap=None, bs=None) -> Optional[float]:
        if not cap or not bs: return None
        return self._ratio(self.get_capital(cap, year, 'Debt'), self.get_bs(bs, year, 'Equity'))

    def calculate_all_fields(self, data, year, income=None, cap=None, bs=None, nopat=None) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                if name == 'AdjustedEBITDA':
                    v = func(data, year, nopat)
                elif name == 'TotalInterestExpense':
                    v = func(data, year, income, nopat)
                elif name in ['EBITAInterestCoverageRatio', 'AdjustedEBITDAInterestCoverageRatio']:
                    v = func(data, year, nopat, data)
                elif name == 'DebtToEBITARatio':
                    v = func(data, year, cap, nopat)
                elif name == 'DebtToAdjustedEBITDARatio':
                    v = func(data, year, cap, data)
                elif name == 'DebtToEquityRatio':
                    v = func(data, year, cap, bs)
                else:
                    v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data, year, income=None, cap=None, bs=None, nopat=None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, income, cap, bs, nopat))
        logger.info(f"Updated calculated financing health fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data, year, changed_field, income=None, cap=None, bs=None, nopat=None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    if name == 'AdjustedEBITDA':
                        v = self.calculated_fields[name](data, year, nopat)
                    elif name == 'TotalInterestExpense':
                        v = self.calculated_fields[name](data, year, income, nopat)
                    elif name in ['EBITAInterestCoverageRatio', 'AdjustedEBITDAInterestCoverageRatio']:
                        v = self.calculated_fields[name](data, year, nopat, data)
                    elif name == 'DebtToEBITARatio':
                        v = self.calculated_fields[name](data, year, cap, nopat)
                    elif name == 'DebtToAdjustedEBITDARatio':
                        v = self.calculated_fields[name](data, year, cap, data)
                    elif name == 'DebtToEquityRatio':
                        v = self.calculated_fields[name](data, year, cap, bs)
                    else:
                        v = self.calculated_fields[name](data, year)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent financing health fields for year {year} after changing {changed_field}")
        return data


financing_health_calculator = FinancingHealthCalculator()


def calculate_financing_health_field(data, year, field_name, income=None, cap=None, bs=None, nopat=None) -> Optional[float]:
    if field_name in financing_health_calculator.calculated_fields:
        calc = financing_health_calculator.calculated_fields[field_name]
        if field_name == 'AdjustedEBITDA':
            return calc(data, year, nopat)
        elif field_name == 'TotalInterestExpense':
            return calc(data, year, income, nopat)
        elif field_name in ['EBITAInterestCoverageRatio', 'AdjustedEBITDAInterestCoverageRatio']:
            return calc(data, year, nopat, data)
        elif field_name == 'DebtToEBITARatio':
            return calc(data, year, cap, nopat)
        elif field_name == 'DebtToAdjustedEBITDARatio':
            return calc(data, year, cap, data)
        elif field_name == 'DebtToEquityRatio':
            return calc(data, year, cap, bs)
        else:
            return calc(data, year)
    logger.warning(f"Field {field_name} is not a calculated financing health field")
    return None


def update_financing_health_calculations(data, year, income=None, cap=None, bs=None, nopat=None) -> Dict[int, Dict[str, Any]]:
    return financing_health_calculator.update_calculated_fields(data, year, income, cap, bs, nopat)


def recalculate_financing_health_dependent_fields(data, year, changed_field, income=None, cap=None, bs=None, nopat=None) -> Dict[int, Dict[str, Any]]:
    return financing_health_calculator.recalculate_dependent_fields(data, year, changed_field, income, cap, bs, nopat)


