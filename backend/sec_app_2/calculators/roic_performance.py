from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class ROICPerformanceCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'CostOfRevenueAsPercentOfRevenue': self.calculate_cost_of_revenue_as_percent_of_revenue,
            'SellingGeneralAndAdministrationAsPercentOfRevenue': self.calculate_sga_as_percent_of_revenue,
            'OperatingProfitAsPercentOfRevenue': self.calculate_operating_profit_as_percent_of_revenue,
            'WorkingCapitalAsPercentOfRevenue': self.calculate_working_capital_as_percent_of_revenue,
            'FixedAssetsAsPercentOfRevenue': self.calculate_fixed_assets_as_percent_of_revenue,
            'OtherAssetsAsPercentOfRevenue': self.calculate_other_assets_as_percent_of_revenue,
            'PretaxReturnOnInvestedCapital': self.calculate_pretax_return_on_invested_capital,
            'ReturnOnInvestedCapitalExcludingGoodwill': self.calculate_return_on_invested_capital_excluding_goodwill,
            'GoodwillAsPercentOfInvestedCapital': self.calculate_goodwill_as_percent_of_invested_capital,
            'ReturnOnInvestedCapitalIncludingGoodwill': self.calculate_return_on_invested_capital_including_goodwill,
        }

        self.dependencies = {
            'Revenue': ['CostOfRevenueAsPercentOfRevenue', 'SellingGeneralAndAdministrationAsPercentOfRevenue', 'OperatingProfitAsPercentOfRevenue', 'WorkingCapitalAsPercentOfRevenue', 'FixedAssetsAsPercentOfRevenue', 'OtherAssetsAsPercentOfRevenue'],
            'CostOfRevenue': ['CostOfRevenueAsPercentOfRevenue'],
            'SellingGeneralAdministrative': ['SellingGeneralAndAdministrationAsPercentOfRevenue'],
            'OperatingIncome': ['OperatingProfitAsPercentOfRevenue', 'PretaxReturnOnInvestedCapital'],
            'OperatingWorkingCapital': ['WorkingCapitalAsPercentOfRevenue'],
            'PropertyPlantAndEquipment': ['FixedAssetsAsPercentOfRevenue'],
            'OperatingLeaseAssets': ['FixedAssetsAsPercentOfRevenue'],
            'VariableLeaseAssets': ['FixedAssetsAsPercentOfRevenue'],
            'FinanceLeaseAssets': ['FixedAssetsAsPercentOfRevenue'],
            'OtherAssetsNetOtherLiabilities': ['OtherAssetsAsPercentOfRevenue'],
            'InvestedCapitalExcludingGoodwill': ['PretaxReturnOnInvestedCapital', 'ReturnOnInvestedCapitalExcludingGoodwill'],
            'InvestedCapitalIncludingGoodwill': ['ReturnOnInvestedCapitalIncludingGoodwill'],
            'Goodwill': ['GoodwillAsPercentOfInvestedCapital'],
            'NOPAT': ['ReturnOnInvestedCapitalExcludingGoodwill', 'ReturnOnInvestedCapitalIncludingGoodwill'],
        }

    def _num(self, v: Any) -> float:
        return self.to_number(v)

    def _ratio_pct(self, num: float, den: float) -> float:
        return self.ratio(num, den, 100.0)

    def get_income_statement_field(self, inc, year, key):
        return self._num((inc or {}).get(year, {}).get(key))

    def get_capital_field(self, cap, year, key):
        return self._num((cap or {}).get(year, {}).get(key))

    def get_nopat_field(self, nopat, year, key):
        return self._num((nopat or {}).get(year, {}).get(key))

    def calculate_cost_of_revenue_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        return self._ratio_pct(self.get_income_statement_field(inc, year, 'CostOfRevenue'), self.get_income_statement_field(inc, year, 'Revenue')) if inc else None

    def calculate_sga_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        return self._ratio_pct(self.get_income_statement_field(inc, year, 'SellingGeneralAdministrative'), self.get_income_statement_field(inc, year, 'Revenue')) if inc else None

    def calculate_operating_profit_as_percent_of_revenue(self, data, year, inc=None) -> Optional[float]:
        return self._ratio_pct(self.get_income_statement_field(inc, year, 'OperatingIncome'), self.get_income_statement_field(inc, year, 'Revenue')) if inc else None

    def calculate_working_capital_as_percent_of_revenue(self, data, year, inc=None, cap=None) -> Optional[float]:
        return self._ratio_pct(self.get_capital_field(cap, year, 'OperatingWorkingCapital'), self.get_income_statement_field(inc, year, 'Revenue')) if inc and cap else None

    def calculate_fixed_assets_as_percent_of_revenue(self, data, year, inc=None, cap=None) -> Optional[float]:
        if not inc or not cap: return None
        ppe = self.get_capital_field(cap, year, 'PropertyPlantAndEquipment')
        ola = self.get_capital_field(cap, year, 'OperatingLeaseAssets')
        vla = self.get_capital_field(cap, year, 'VariableLeaseAssets')
        fla = self.get_capital_field(cap, year, 'FinanceLeaseAssets')
        total = ppe + ola + vla + fla
        revenue = self.get_income_statement_field(inc, year, 'Revenue')
        return self._ratio_pct(total, revenue)

    def calculate_other_assets_as_percent_of_revenue(self, data, year, inc=None, cap=None) -> Optional[float]:
        return self._ratio_pct(self.get_capital_field(cap, year, 'OtherAssetsNetOtherLiabilities'), self.get_income_statement_field(inc, year, 'Revenue')) if inc and cap else None

    def calculate_pretax_return_on_invested_capital(self, data, year, inc=None, cap=None) -> Optional[float]:
        return self._ratio_pct(self.get_income_statement_field(inc, year, 'OperatingIncome'), self.get_capital_field(cap, year, 'InvestedCapitalExcludingGoodwill')) if inc and cap else None

    def calculate_return_on_invested_capital_excluding_goodwill(self, data, year, inc=None, cap=None, nopat=None) -> Optional[float]:
        if not nopat or not cap: return None
        n = self.get_nopat_field(nopat, year, 'NOPAT')
        cur = self.get_capital_field(cap, year, 'InvestedCapitalExcludingGoodwill')
        py = year - 1
        prev = self.get_capital_field(cap, py, 'InvestedCapitalExcludingGoodwill')
        avg = (cur + prev) / 2
        return self._ratio_pct(n, avg)

    def calculate_goodwill_as_percent_of_invested_capital(self, data, year, cap=None) -> Optional[float]:
        if not cap: return None
        goodwill = self.get_capital_field(cap, year, 'Goodwill')
        cur = self.get_capital_field(cap, year, 'InvestedCapitalExcludingGoodwill')
        py = year - 1
        prev = self.get_capital_field(cap, py, 'InvestedCapitalExcludingGoodwill')
        avg = (cur + prev) / 2
        return self._ratio_pct(goodwill, avg)

    def calculate_return_on_invested_capital_including_goodwill(self, data, year, cap=None, nopat=None) -> Optional[float]:
        if not nopat or not cap: return None
        n = self.get_nopat_field(nopat, year, 'NOPAT')
        cur = self.get_capital_field(cap, year, 'InvestedCapitalIncludingGoodwill')
        py = year - 1
        prev = self.get_capital_field(cap, py, 'InvestedCapitalIncludingGoodwill')
        avg = (cur + prev) / 2
        return self._ratio_pct(n, avg)

    def calculate_all_fields(self, data, year, inc=None, cap=None, nopat=None) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                if name in ['CostOfRevenueAsPercentOfRevenue', 'SellingGeneralAndAdministrationAsPercentOfRevenue', 'OperatingProfitAsPercentOfRevenue']:
                    v = func(data, year, inc)
                elif name in ['WorkingCapitalAsPercentOfRevenue', 'FixedAssetsAsPercentOfRevenue', 'OtherAssetsAsPercentOfRevenue', 'PretaxReturnOnInvestedCapital']:
                    v = func(data, year, inc, cap)
                elif name in ['GoodwillAsPercentOfInvestedCapital']:
                    v = func(data, year, cap)
                elif name in ['ReturnOnInvestedCapitalExcludingGoodwill', 'ReturnOnInvestedCapitalIncludingGoodwill']:
                    v = func(data, year, inc, cap, nopat)
                else:
                    v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data, year, inc=None, cap=None, nopat=None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, inc, cap, nopat))
        logger.info(f"Updated calculated ROIC performance fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data, year, changed_field, inc=None, cap=None, nopat=None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    if name in ['CostOfRevenueAsPercentOfRevenue', 'SellingGeneralAndAdministrationAsPercentOfRevenue', 'OperatingProfitAsPercentOfRevenue']:
                        v = self.calculated_fields[name](data, year, inc)
                    elif name in ['WorkingCapitalAsPercentOfRevenue', 'FixedAssetsAsPercentOfRevenue', 'OtherAssetsAsPercentOfRevenue', 'PretaxReturnOnInvestedCapital']:
                        v = self.calculated_fields[name](data, year, inc, cap)
                    elif name in ['GoodwillAsPercentOfInvestedCapital']:
                        v = self.calculated_fields[name](data, year, cap)
                    elif name in ['ReturnOnInvestedCapitalExcludingGoodwill', 'ReturnOnInvestedCapitalIncludingGoodwill']:
                        v = self.calculated_fields[name](data, year, inc, cap, nopat)
                    else:
                        v = self.calculated_fields[name](data, year)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent ROIC performance fields for year {year} after changing {changed_field}")
        return data


roic_performance_calculator = ROICPerformanceCalculator()


def calculate_roic_performance_field(data, year, field_name, inc=None, cap=None, nopat=None) -> Optional[float]:
    if field_name in roic_performance_calculator.calculated_fields:
        calc = roic_performance_calculator.calculated_fields[field_name]
        if field_name in ['CostOfRevenueAsPercentOfRevenue', 'SellingGeneralAndAdministrationAsPercentOfRevenue', 'OperatingProfitAsPercentOfRevenue']:
            return calc(data, year, inc)
        elif field_name in ['WorkingCapitalAsPercentOfRevenue', 'FixedAssetsAsPercentOfRevenue', 'OtherAssetsAsPercentOfRevenue', 'PretaxReturnOnInvestedCapital']:
            return calc(data, year, inc, cap)
        elif field_name in ['GoodwillAsPercentOfInvestedCapital']:
            return calc(data, year, cap)
        elif field_name in ['ReturnOnInvestedCapitalExcludingGoodwill', 'ReturnOnInvestedCapitalIncludingGoodwill']:
            return calc(data, year, inc, cap, nopat)
        else:
            return calc(data, year)
    logger.warning(f"Field {field_name} is not a calculated ROIC performance field")
    return None


def update_roic_performance_calculations(data, year, inc=None, cap=None, nopat=None) -> Dict[int, Dict[str, Any]]:
    return roic_performance_calculator.update_calculated_fields(data, year, inc, cap, nopat)


def recalculate_roic_performance_dependent_fields(data, year, changed_field, inc=None, cap=None, nopat=None) -> Dict[int, Dict[str, Any]]:
    return roic_performance_calculator.recalculate_dependent_fields(data, year, changed_field, inc, cap, nopat)


