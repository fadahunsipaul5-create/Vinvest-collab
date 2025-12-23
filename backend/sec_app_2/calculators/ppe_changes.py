from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class PPEChangesCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'PPEBeginningOfYear': self.calculate_ppe_beginning_of_year,
            'CapitalExpenditures': self.calculate_capital_expenditures,
            'Depreciation': self.calculate_depreciation,
            'UnexplainedChangesInPPE': self.calculate_unexplained_changes_in_ppe,
            'PPEEndOfYear': self.calculate_ppe_end_of_year,
        }

        self.dependencies = {
            'PropertyPlantAndEquipment': ['PPEBeginningOfYear', 'PPEEndOfYear', 'UnexplainedChangesInPPE'],
            'CapitalExpenditures': ['UnexplainedChangesInPPE'],
            'Depreciation': ['UnexplainedChangesInPPE'],
            'PPEBeginningOfYear': ['UnexplainedChangesInPPE'],
            'PPEEndOfYear': ['UnexplainedChangesInPPE'],
        }

    def get_balance_sheet_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str) -> float:
        return self.get_field(data, year, field_name)

    def get_income_statement_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str) -> float:
        return self.get_field(data, year, field_name)

    def calculate_ppe_beginning_of_year(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for PPE Beginning of Year calculation for year {year}")
                return None
            prior_year = year - 1
            ppe_beginning = self.get_balance_sheet_field(balance_sheet_data, prior_year, 'PropertyPlantAndEquipment')
            logger.debug(f"PPE Beginning of Year for {year}: Prior year {prior_year} PPE = {ppe_beginning}")
            return ppe_beginning
        except Exception as e:
            logger.error(f"Error calculating PPE Beginning of Year for year {year}: {e}")
            return None

    def calculate_capital_expenditures(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Capital Expenditures calculation for year {year}")
                return None
            capex = self.get_balance_sheet_field(balance_sheet_data, year, 'CapitalExpenditures')
            logger.debug(f"Capital Expenditures for {year}: {capex}")
            return capex
        except Exception as e:
            logger.error(f"Error calculating Capital Expenditures for year {year}: {e}")
            return None

    def calculate_depreciation(self, data: Dict[int, Dict[str, Any]], year: int, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not income_statement_data:
                logger.warning(f"Missing income statement data for Depreciation calculation for year {year}")
                return None
            dep_expense = self.get_income_statement_field(income_statement_data, year, 'Depreciation')
            depreciation = -1 * dep_expense
            logger.debug(f"Depreciation for {year}: -1 * {dep_expense} = {depreciation}")
            return depreciation
        except Exception as e:
            logger.error(f"Error calculating Depreciation for year {year}: {e}")
            return None

    def calculate_unexplained_changes_in_ppe(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data or not income_statement_data:
                logger.warning(f"Missing data for Unexplained Changes in PPE calculation for year {year}")
                return None
            ppe_ending = self.get_balance_sheet_field(balance_sheet_data, year, 'PropertyPlantAndEquipment')
            ppe_beginning = self.calculate_ppe_beginning_of_year(data, year, balance_sheet_data) or 0
            capex = self.calculate_capital_expenditures(data, year, balance_sheet_data) or 0
            depreciation = self.calculate_depreciation(data, year, income_statement_data) or 0
            result = ppe_ending - ppe_beginning - capex + depreciation
            logger.debug(f"Unexplained Changes in PPE for {year}: {ppe_ending} - {ppe_beginning} - {capex} + {depreciation} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Unexplained Changes in PPE for year {year}: {e}")
            return None

    def calculate_ppe_end_of_year(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for PPE End of Year calculation for year {year}")
                return None
            ppe_ending = self.get_balance_sheet_field(balance_sheet_data, year, 'PropertyPlantAndEquipment')
            logger.debug(f"PPE End of Year for {year}: {ppe_ending}")
            return ppe_ending
        except Exception as e:
            logger.error(f"Error calculating PPE End of Year for year {year}: {e}")
            return None

    def calculate_all_fields(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                if name in ['PPEBeginningOfYear', 'CapitalExpenditures', 'PPEEndOfYear']:
                    v = func(data, year, balance_sheet_data)
                elif name in ['Depreciation']:
                    v = func(data, year, income_statement_data)
                elif name in ['UnexplainedChangesInPPE']:
                    v = func(data, year, balance_sheet_data, income_statement_data)
                else:
                    v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, balance_sheet_data, income_statement_data))
        logger.info(f"Updated calculated PPE changes fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data: Dict[int, Dict[str, Any]], year: int, changed_field: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    if name in ['PPEBeginningOfYear', 'CapitalExpenditures', 'PPEEndOfYear']:
                        v = self.calculated_fields[name](data, year, balance_sheet_data)
                    elif name in ['Depreciation']:
                        v = self.calculated_fields[name](data, year, income_statement_data)
                    elif name in ['UnexplainedChangesInPPE']:
                        v = self.calculated_fields[name](data, year, balance_sheet_data, income_statement_data)
                    else:
                        v = self.calculated_fields[name](data, year)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent PPE changes fields for year {year} after changing {changed_field}")
        return data


ppe_changes_calculator = PPEChangesCalculator()


def calculate_ppe_changes_field(data: Dict[int, Dict[str, Any]], year: int, field_name: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
    if field_name in ppe_changes_calculator.calculated_fields:
        calc = ppe_changes_calculator.calculated_fields[field_name]
        if field_name in ['PPEBeginningOfYear', 'CapitalExpenditures', 'PPEEndOfYear']:
            return calc(data, year, balance_sheet_data)
        elif field_name in ['Depreciation']:
            return calc(data, year, income_statement_data)
        elif field_name in ['UnexplainedChangesInPPE']:
            return calc(data, year, balance_sheet_data, income_statement_data)
        else:
            return calc(data, year)
    logger.warning(f"Field {field_name} is not a calculated PPE changes field")
    return None


def update_ppe_changes_calculations(data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return ppe_changes_calculator.update_calculated_fields(data, year, balance_sheet_data, income_statement_data)


def recalculate_ppe_changes_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return ppe_changes_calculator.recalculate_dependent_fields(data, year, changed_field, balance_sheet_data, income_statement_data)


def validate_ppe_reconciliation(data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[str, Any]:
    if not balance_sheet_data or not income_statement_data:
        return {"valid": False, "error": "Missing required data"}
    ppe_beginning = ppe_changes_calculator.calculate_ppe_beginning_of_year(data, year, balance_sheet_data) or 0
    capex = ppe_changes_calculator.calculate_capital_expenditures(data, year, balance_sheet_data) or 0
    depreciation = ppe_changes_calculator.calculate_depreciation(data, year, income_statement_data) or 0
    unexplained = ppe_changes_calculator.calculate_unexplained_changes_in_ppe(data, year, balance_sheet_data, income_statement_data) or 0
    ppe_ending = ppe_changes_calculator.calculate_ppe_end_of_year(data, year, balance_sheet_data) or 0
    calculated_ending = ppe_beginning + capex - depreciation + unexplained
    difference = abs(ppe_ending - calculated_ending)
    tolerance = 1.0
    valid = difference <= tolerance
    return {
        "valid": valid,
        "ppe_beginning": ppe_beginning,
        "capital_expenditures": capex,
        "depreciation": depreciation,
        "unexplained_changes": unexplained,
        "ppe_ending_actual": ppe_ending,
        "ppe_ending_calculated": calculated_ending,
        "difference": difference,
        "tolerance": tolerance,
    }


