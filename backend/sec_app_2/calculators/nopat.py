from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class NOPATCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'Revenue': self.get_income_statement_field,
            'CostOfRevenue': self.get_income_statement_field,
            'SellingGeneralAndAdministration': self.get_income_statement_field,
            'Depreciation': self.get_income_statement_field,
            'EBITA_Unadjusted': self.calculate_ebita_unadjusted,
            'OperatingLeaseInterest': self.calculate_operating_lease_interest,
            'VariableLeaseInterest': self.calculate_variable_lease_interest,
            'EBITAAdjusted': self.calculate_ebita_adjusted,
            'TaxProvision': self.get_income_statement_field,
            'NOPAT': self.calculate_nopat,
        }

        self.dependencies = {
            'Revenue': ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
            'CostOfRevenue': ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
            'SellingGeneralAndAdministration': ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
            'Depreciation': ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
            'EBITA_Unadjusted': ['EBITAAdjusted', 'NOPAT'],
            'OperatingLeaseInterest': ['EBITAAdjusted', 'NOPAT'],
            'VariableLeaseInterest': ['EBITAAdjusted', 'NOPAT'],
            'EBITAAdjusted': ['NOPAT'],
            'TaxProvision': ['NOPAT'],
        }

    def get_income_statement_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str = None) -> Optional[float]:
        return (data or {}).get(year, {}).get(field_name, 0)

    def calculate_ebita_unadjusted(self, data: Dict[int, Dict[str, Any]], year: int) -> Optional[float]:
        try:
            y = data.get(year, {})
            revenue = y.get('Revenue', 0)
            cost_of_revenue = y.get('CostOfRevenue', 0)
            sga = y.get('SellingGeneralAndAdministration', 0)
            depreciation = y.get('Depreciation', 0)
            if any(val is None for val in [revenue, cost_of_revenue, sga, depreciation]):
                return None
            # Correct sign: Revenue - Cost - SG&A - Depreciation
            result = float(revenue) - float(cost_of_revenue) - float(sga) - float(depreciation)
            logger.debug(
                f"EBITA Unadjusted for {year}: {revenue} - {cost_of_revenue} - {sga} - {depreciation} = {result}"
            )
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating EBITA Unadjusted for year {year}: {e}")
            return None

    def calculate_operating_lease_interest(self, data: Dict[int, Dict[str, Any]], year: int, capital_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not capital_data or not income_statement_data:
                logger.warning(f"Missing capital or income statement data for Operating Lease Interest calculation for year {year}")
                return 0
            prior_year = year - 1
            prior_cap = capital_data.get(prior_year, {})
            cur_inc = income_statement_data.get(year, {})
            operating_lease_liabilities = prior_cap.get('OperatingLeaseLiabilities', 0)
            leases_discount_rate = cur_inc.get('LeasesDiscountRate', 0)
            if operating_lease_liabilities is None or leases_discount_rate is None:
                return None
            result = float(operating_lease_liabilities) * float(leases_discount_rate) / 100
            logger.debug(f"Operating Lease Interest for {year}: {operating_lease_liabilities} * {leases_discount_rate}% = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Operating Lease Interest for year {year}: {e}")
            return None

    def calculate_variable_lease_interest(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, leases_discount_rate: float = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Variable Lease Interest calculation for year {year}")
                return 0
            y_bs = balance_sheet_data.get(year, {})
            variable_lease_assets = y_bs.get('VariableLeaseAssets', 0)
            if leases_discount_rate is None:
                leases_discount_rate = data.get(year, {}).get('LeasesDiscountRate', 0)
            if variable_lease_assets is None or leases_discount_rate is None:
                return None
            result = float(variable_lease_assets) * float(leases_discount_rate) / 100
            logger.debug(f"Variable Lease Interest for {year}: {variable_lease_assets} * {leases_discount_rate}% = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating Variable Lease Interest for year {year}: {e}")
            return None

    def calculate_ebita_adjusted(self, data: Dict[int, Dict[str, Any]], year: int, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            y = data.get(year, {})
            ebita_unadjusted = y.get('EBITA_Unadjusted', 0)
            if ebita_unadjusted is None:
                return None
            op_li = self.calculate_operating_lease_interest(data, year, capital_data, income_statement_data) or 0
            var_li = self.calculate_variable_lease_interest(data, year, balance_sheet_data) or 0
            result = float(ebita_unadjusted) + float(op_li) + float(var_li)
            logger.debug(f"EBITA Adjusted for {year}: {ebita_unadjusted} + {op_li} + {var_li} = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating EBITA Adjusted for year {year}: {e}")
            return None

    def calculate_nopat(self, data: Dict[int, Dict[str, Any]], year: int, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            y = data.get(year, {})
            tax_provision = y.get('TaxProvision', 0)
            if tax_provision is None:
                return None
            ebita_adj = self.calculate_ebita_adjusted(data, year, capital_data, balance_sheet_data, income_statement_data)
            if ebita_adj is None:
                return None
            result = float(ebita_adj) - float(tax_provision)
            logger.debug(f"NOPAT for {year}: {ebita_adj} - {tax_provision} = {result}")
            return result
        except (TypeError, ValueError) as e:
            logger.error(f"Error calculating NOPAT for year {year}: {e}")
            return None

    def calculate_all_fields(self, data: Dict[int, Dict[str, Any]], year: int, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                if name in ['OperatingLeaseInterest', 'VariableLeaseInterest', 'EBITAAdjusted', 'NOPAT']:
                    v = func(data, year, capital_data, balance_sheet_data, income_statement_data)
                else:
                    v = func(data, year, name)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data: Dict[int, Dict[str, Any]], year: int, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, capital_data, balance_sheet_data, income_statement_data))
        logger.info(f"Updated calculated NOPAT fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data: Dict[int, Dict[str, Any]], year: int, changed_field: str, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    if name in ['OperatingLeaseInterest', 'VariableLeaseInterest', 'EBITAAdjusted', 'NOPAT']:
                        v = self.calculated_fields[name](data, year, capital_data, balance_sheet_data, income_statement_data)
                    else:
                        v = self.calculated_fields[name](data, year, name)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent NOPAT fields for year {year} after changing {changed_field}")
        return data


nopat_calculator = NOPATCalculator()


def calculate_nopat_field(data: Dict[int, Dict[str, Any]], year: int, field_name: str, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
    if field_name in nopat_calculator.calculated_fields:
        if field_name in ['OperatingLeaseInterest', 'VariableLeaseInterest', 'EBITAAdjusted', 'NOPAT']:
            return nopat_calculator.calculated_fields[field_name](data, year, capital_data, balance_sheet_data, income_statement_data)
        return nopat_calculator.calculated_fields[field_name](data, year, field_name)
    logger.warning(f"Field {field_name} is not a calculated NOPAT field")
    return None


def update_nopat_calculations(data: Dict[int, Dict[str, Any]], year: int, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return nopat_calculator.update_calculated_fields(data, year, capital_data, balance_sheet_data, income_statement_data)


def recalculate_nopat_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str, capital_data: Dict[int, Dict[str, Any]] = None, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return nopat_calculator.recalculate_dependent_fields(data, year, changed_field, capital_data, balance_sheet_data, income_statement_data)


