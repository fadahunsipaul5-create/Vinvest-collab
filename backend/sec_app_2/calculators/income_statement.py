from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class IncomeStatementCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'GrossIncome': self.calculate_gross_income,
            'OperatingExpense': self.calculate_operating_expense,
            'OperatingIncome': self.calculate_operating_income,
            'NetNonOperatingInterestIncome': self.calculate_net_non_operating_income,
            'PretaxIncome': self.calculate_pretax_income,
            'ProfitLossControlling': self.calculate_profit_loss_controlling,
            'NetIncome': self.calculate_net_income,
        }

        self.dependencies = {
            'Revenue': ['GrossIncome', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
            'CostOfRevenue': ['GrossIncome', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
            'SellingGeneralAdministrative': ['OperatingExpense', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
            'Depreciation': ['OperatingExpense', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
            'InterestExpense': ['NetNonOperatingInterestIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
            'InterestIncome': ['NetNonOperatingInterestIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
            'OtherIncome': ['NetNonOperatingInterestIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
            'TaxProvision': ['ProfitLossControlling', 'NetIncome'],
            'NetIncomeNoncontrolling': ['NetIncome'],
        }

    def calculate_gross_income(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Optional[float]:
        try:
            y = data.get(year, {})
            revenue = self.to_number(y.get('Revenue'))
            cost = self.to_number(y.get('CostOfRevenue'))
            result = revenue - cost
            logger.debug(f"Gross Income for {year}: {revenue} - {cost} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Gross Income for year {year}: {e}")
            return None

    def calculate_operating_expense(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Optional[float]:
        try:
            y = data.get(year, {})
            sga = self.to_number(y.get('SellingGeneralAdministrative'))
            depreciation = self.to_number(y.get('Depreciation'))
            result = sga + depreciation
            logger.debug(f"Operating Expense for {year}: {sga} + {depreciation} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Operating Expense for year {year}: {e}")
            return None

    def calculate_operating_income(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Optional[float]:
        try:
            y = data.get(year, {})
            gross = self.to_number(y.get('GrossIncome'))
            sga = self.to_number(y.get('SellingGeneralAdministrative'))
            depreciation = self.to_number(y.get('Depreciation'))
            result = gross - sga - depreciation
            logger.debug(f"Operating Income for {year}: {gross} - {sga} - {depreciation} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Operating Income for year {year}: {e}")
            return None

    def calculate_net_non_operating_income(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Optional[float]:
        try:
            y = data.get(year, {})
            interest_expense = self.to_number(y.get('InterestExpense'))
            interest_income = self.to_number(y.get('InterestIncome'))
            other_income = self.to_number(y.get('OtherIncome'))
            # Correct sign: -Expense + Income + Other
            result = -interest_expense + interest_income + other_income
            logger.debug(
                f"Net Non-Operating Income for {year}: -{interest_expense} + {interest_income} + {other_income} = {result}"
            )
            return result
        except Exception as e:
            logger.error(f"Error calculating Net Non-Operating Income for year {year}: {e}")
            return None

    def calculate_pretax_income(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Optional[float]:
        try:
            y = data.get(year, {})
            operating_income = self.to_number(y.get('OperatingIncome'))
            interest_expense = self.to_number(y.get('InterestExpense'))
            interest_income = self.to_number(y.get('InterestIncome'))
            other_income = self.to_number(y.get('OtherIncome'))
            result = operating_income - interest_expense + interest_income + other_income
            logger.debug(
                f"Pretax Income for {year}: {operating_income} - {interest_expense} + {interest_income} + {other_income} = {result}"
            )
            return result
        except Exception as e:
            logger.error(f"Error calculating Pretax Income for year {year}: {e}")
            return None

    def calculate_profit_loss_controlling(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Optional[float]:
        try:
            y = data.get(year, {})
            pretax = self.to_number(y.get('PretaxIncome'))
            tax = self.to_number(y.get('TaxProvision'))
            result = pretax - tax
            logger.debug(f"Profit Loss Controlling for {year}: {pretax} - {tax} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Profit Loss Controlling for year {year}: {e}")
            return None

    def calculate_net_income(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Optional[float]:
        try:
            y = data.get(year, {})
            plc = self.to_number(y.get('ProfitLossControlling'))
            nonctrl = self.to_number(y.get('NetIncomeNoncontrolling'))
            result = plc + nonctrl
            logger.debug(f"Net Income for {year}: {plc} + {nonctrl} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Net Income for year {year}: {e}")
            return None

    def calculate_all_fields(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data: Dict[Any, Dict[str, Any]], year: Any) -> Dict[Any, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year))
        return data

    def recalculate_dependent_fields(self, data: Dict[Any, Dict[str, Any]], year: Any, changed_field: str) -> Dict[Any, Dict[str, Any]]:
        data.setdefault(year, {})
        for field_name in self.dependencies.get(changed_field, []):
            if field_name in self.calculated_fields:
                try:
                    v = self.calculated_fields[field_name](data, year)
                    if v is not None:
                        data[year][field_name] = v
                except Exception as e:
                    logger.error(f"Error recalculating {field_name} for year {year}: {e}")
        return data


# Global instance and facades
income_statement_calculator = IncomeStatementCalculator()


def calculate_income_statement_field(data: Dict[Any, Dict[str, Any]], year: Any, field_name: str) -> Optional[float]:
    func = income_statement_calculator.calculated_fields.get(field_name)
    if not func:
        logger.warning(f"Field {field_name} is not a calculated field")
        return None
    return func(data, year)


def update_income_statement_calculations(data: Dict[Any, Dict[str, Any]], year: Any) -> Dict[Any, Dict[str, Any]]:
    return income_statement_calculator.update_calculated_fields(data, year)


def recalculate_income_statement_dependent_fields(data: Dict[Any, Dict[str, Any]], year: Any, changed_field: str) -> Dict[Any, Dict[str, Any]]:
    return income_statement_calculator.recalculate_dependent_fields(data, year, changed_field)


