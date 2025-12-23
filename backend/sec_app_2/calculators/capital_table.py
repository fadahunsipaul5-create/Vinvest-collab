from typing import Dict, Any, Optional
import logging
from .base import BaseCalculator

logger = logging.getLogger(__name__)


class CapitalTableCalculator(BaseCalculator):
    def __init__(self):
        self.calculated_fields = {
            'CurrentAssetsAggregate': self.calculate_current_assets_aggregate,
            'CurrentLiabilitiesAggregate': self.calculate_current_liabilities_aggregate,
            'NetOperatingAssetsCurrent': self.calculate_net_operating_assets_current,
            'ScaledOperatingLeaseAssets': self.calculate_scaled_operating_lease_assets,
            'NetOtherNoncurrentAssets': self.calculate_net_other_noncurrent_assets,
            'TotalInvestedCapitalComponents': self.calculate_total_invested_capital_components,
            'InvestedCapitalWithGoodwill': self.calculate_invested_capital_with_goodwill,
            'BroaderInvestedCapital': self.calculate_broader_invested_capital,
            'TotalLongTermDebt': self.calculate_total_long_term_debt,
            'TotalOperatingLeaseLiabilities': self.calculate_total_operating_lease_liabilities,
            'TotalFinanceLeaseLiabilities': self.calculate_total_finance_lease_liabilities,
            'TotalDebtAndLeaseLiabilities': self.calculate_total_debt_and_lease_liabilities,
            'NetDeferredIncomeTaxes': self.calculate_net_deferred_income_taxes,
            'TotalCapitalFunds': self.calculate_total_capital_funds,
        }

        self.dependencies = {
            'OperatingCash': ['CurrentAssetsAggregate'],
            'ReceivablesCurrent': ['CurrentAssetsAggregate'],
            'Inventory': ['CurrentAssetsAggregate'],
            'OtherAssetsCurrent': ['CurrentAssetsAggregate'],
            'AccountsPayableCurrent': ['CurrentLiabilitiesAggregate'],
            'EmployeeLiabilitiesCurrent': ['CurrentLiabilitiesAggregate'],
            'AccruedLiabilitiesCurrent': ['CurrentLiabilitiesAggregate'],
            'DeferredRevenueCurrent': ['CurrentLiabilitiesAggregate'],
            'OtherLiabilitiesCurrent': ['CurrentLiabilitiesAggregate'],
            'PropertyPlantAndEquipment': ['TotalInvestedCapitalComponents'],
            'OperatingLeaseAssets': ['ScaledOperatingLeaseAssets', 'TotalInvestedCapitalComponents'],
            'FinanceLeaseAssets': ['TotalInvestedCapitalComponents'],
            'OtherAssetsNoncurrent': ['NetOtherNoncurrentAssets'],
            'OtherLiabilitiesNoncurrent': ['NetOtherNoncurrentAssets'],
            'Goodwill': ['InvestedCapitalWithGoodwill'],
            'ExcessCash': ['BroaderInvestedCapital'],
            'ForeignTaxCreditCarryForward': ['NetDeferredIncomeTaxes', 'BroaderInvestedCapital'],
            'NoncontrollingInterests': ['TotalCapitalFunds'],
            'Equity': ['TotalCapitalFunds'],
            'VariableLeaseAssets': ['TotalInvestedCapitalComponents'],
            'InvestedCapitalExcludingGoodwill': ['InvestedCapitalWithGoodwill'],
            'InvestedCapitalIncludingGoodwill': ['BroaderInvestedCapital'],
            'Debt': ['TotalDebtAndLeaseLiabilities'],
            'OperatingLeaseLiabilities': ['TotalDebtAndLeaseLiabilities'],
            'VariableLeaseLiabilities': ['TotalDebtAndLeaseLiabilities'],
            'FinanceLeaseLiabilities': ['TotalDebtAndLeaseLiabilities'],
            'DebtAndDebtEquivalents': ['TotalCapitalFunds'],
            'VariableLeaseCost': ['ScaledOperatingLeaseAssets'],
            'CurrentAssetsAggregate': ['NetOperatingAssetsCurrent'],
            'CurrentLiabilitiesAggregate': ['NetOperatingAssetsCurrent'],
            'TotalInvestedCapitalComponents': ['InvestedCapitalWithGoodwill'],
            'InvestedCapitalWithGoodwill': ['BroaderInvestedCapital'],
            'NetDeferredIncomeTaxes': ['TotalCapitalFunds'],
        }

    def get_balance_sheet_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str) -> float:
        return self.get_field(data, year, field_name)

    def get_capital_table_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str) -> float:
        return self.get_field(data, year, field_name)

    def get_income_statement_field(self, data: Dict[int, Dict[str, Any]], year: int, field_name: str) -> float:
        return self.get_field(data, year, field_name)

    def calculate_current_assets_aggregate(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Current Assets Aggregate calculation for year {year}")
                return None
            operating_cash = self.get_balance_sheet_field(balance_sheet_data, year, 'OperatingCash')
            receivables = self.get_balance_sheet_field(balance_sheet_data, year, 'ReceivablesCurrent')
            inventory = self.get_balance_sheet_field(balance_sheet_data, year, 'Inventory')
            other_assets = self.get_balance_sheet_field(balance_sheet_data, year, 'OtherAssetsCurrent')
            result = operating_cash + receivables + inventory + other_assets
            logger.debug(f"Current Assets Aggregate for {year}: {operating_cash} + {receivables} + {inventory} + {other_assets} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Current Assets Aggregate for year {year}: {e}")
            return None

    def calculate_current_liabilities_aggregate(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Current Liabilities Aggregate calculation for year {year}")
                return None
            accounts_payable = self.get_balance_sheet_field(balance_sheet_data, year, 'AccountsPayableCurrent')
            employee_liabilities = self.get_balance_sheet_field(balance_sheet_data, year, 'EmployeeLiabilitiesCurrent')
            accrued_liabilities = self.get_balance_sheet_field(balance_sheet_data, year, 'AccruedLiabilitiesCurrent')
            deferred_revenue = self.get_balance_sheet_field(balance_sheet_data, year, 'DeferredRevenueCurrent')
            other_liabilities = self.get_balance_sheet_field(balance_sheet_data, year, 'OtherLiabilitiesCurrent')
            result = accounts_payable + employee_liabilities + accrued_liabilities + deferred_revenue + other_liabilities
            logger.debug(f"Current Liabilities Aggregate for {year}: Sum of 5 components = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Current Liabilities Aggregate for year {year}: {e}")
            return None

    def calculate_net_operating_assets_current(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Net Operating Assets Current calculation for year {year}")
                return None
            operating_assets = self.get_balance_sheet_field(balance_sheet_data, year, 'OperatingAssetsCurrent')
            operating_liabilities = self.get_balance_sheet_field(balance_sheet_data, year, 'OperatingLiabilitiesCurrent')
            result = operating_assets - operating_liabilities
            logger.debug(f"Net Operating Assets Current for {year}: {operating_assets} - {operating_liabilities} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Net Operating Assets Current for year {year}: {e}")
            return None

    def calculate_scaled_operating_lease_assets(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data or not income_statement_data:
                logger.warning(f"Missing data for Scaled Operating Lease Assets calculation for year {year}")
                return None
            operating_lease_assets = self.get_balance_sheet_field(balance_sheet_data, year, 'OperatingLeaseAssets')
            # VariableLeaseCost available but ratio is 1.0 per original note
            result = operating_lease_assets * 1.0
            logger.debug(f"Scaled Operating Lease Assets for {year}: {operating_lease_assets} * 1.0 = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Scaled Operating Lease Assets for year {year}: {e}")
            return None

    def calculate_net_other_noncurrent_assets(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Net Other Noncurrent Assets calculation for year {year}")
                return None
            other_assets = self.get_balance_sheet_field(balance_sheet_data, year, 'OtherAssetsNoncurrent')
            other_liabilities = self.get_balance_sheet_field(balance_sheet_data, year, 'OtherLiabilitiesNoncurrent')
            result = other_assets - other_liabilities
            logger.debug(f"Net Other Noncurrent Assets for {year}: {other_assets} - {other_liabilities} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Net Other Noncurrent Assets for year {year}: {e}")
            return None

    def calculate_total_invested_capital_components(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data or not capital_data:
                logger.warning(f"Missing data for Total Invested Capital Components calculation for year {year}")
                return None
            operating_working_capital = self.get_capital_table_field(capital_data, year, 'OperatingWorkingCapital')
            ppe = self.get_balance_sheet_field(balance_sheet_data, year, 'PropertyPlantAndEquipment')
            operating_lease_assets = self.get_balance_sheet_field(balance_sheet_data, year, 'OperatingLeaseAssets')
            variable_lease_assets = self.get_capital_table_field(capital_data, year, 'VariableLeaseAssets')
            finance_lease_assets = self.get_balance_sheet_field(balance_sheet_data, year, 'FinanceLeaseAssets')
            other_assets_net = self.get_capital_table_field(capital_data, year, 'OtherAssetsNetOtherLiabilities')
            result = operating_working_capital + ppe + operating_lease_assets + variable_lease_assets + finance_lease_assets + other_assets_net
            logger.debug(f"Total Invested Capital Components for {year}: Sum of 6 components = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Total Invested Capital Components for year {year}: {e}")
            return None

    def calculate_invested_capital_with_goodwill(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data or not capital_data:
                logger.warning(f"Missing data for Invested Capital with Goodwill calculation for year {year}")
                return None
            invested_capital_excluding = self.get_capital_table_field(capital_data, year, 'InvestedCapitalExcludingGoodwill')
            goodwill = self.get_balance_sheet_field(balance_sheet_data, year, 'Goodwill')
            result = invested_capital_excluding + goodwill
            logger.debug(f"Invested Capital with Goodwill for {year}: {invested_capital_excluding} + {goodwill} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Invested Capital with Goodwill for year {year}: {e}")
            return None

    def calculate_broader_invested_capital(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data or not capital_data:
                logger.warning(f"Missing data for Broader Invested Capital calculation for year {year}")
                return None
            invested_capital_including = self.get_capital_table_field(capital_data, year, 'InvestedCapitalIncludingGoodwill')
            excess_cash = self.get_balance_sheet_field(balance_sheet_data, year, 'ExcessCash')
            foreign_tax_credit = self.get_balance_sheet_field(balance_sheet_data, year, 'ForeignTaxCreditCarryForward')
            result = invested_capital_including + excess_cash + foreign_tax_credit
            logger.debug(f"Broader Invested Capital for {year}: {invested_capital_including} + {excess_cash} + {foreign_tax_credit} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Broader Invested Capital for year {year}: {e}")
            return None

    def calculate_total_long_term_debt(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Total Long Term Debt calculation for year {year}")
                return None
            ltd_current = self.get_balance_sheet_field(balance_sheet_data, year, 'LongTermDebtCurrent')
            ltd_noncurrent = self.get_balance_sheet_field(balance_sheet_data, year, 'LongTermDebtNoncurrent')
            result = ltd_current + ltd_noncurrent
            logger.debug(f"Total Long Term Debt for {year}: {ltd_current} + {ltd_noncurrent} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Total Long Term Debt for year {year}: {e}")
            return None

    def calculate_total_operating_lease_liabilities(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Total Operating Lease Liabilities calculation for year {year}")
                return None
            ol_current = self.get_balance_sheet_field(balance_sheet_data, year, 'OperatingLeaseLiabilitiesCurrent')
            ol_noncurrent = self.get_balance_sheet_field(balance_sheet_data, year, 'OperatingLeaseLiabilitiesNoncurrent')
            result = ol_current + ol_noncurrent
            logger.debug(f"Total Operating Lease Liabilities for {year}: {ol_current} + {ol_noncurrent} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Total Operating Lease Liabilities for year {year}: {e}")
            return None

    def calculate_total_finance_lease_liabilities(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Total Finance Lease Liabilities calculation for year {year}")
                return None
            fl_current = self.get_balance_sheet_field(balance_sheet_data, year, 'FinanceLeaseLiabilitiesCurrent')
            fl_noncurrent = self.get_balance_sheet_field(balance_sheet_data, year, 'FinanceLeaseLiabilitiesNoncurrent')
            result = fl_current + fl_noncurrent
            logger.debug(f"Total Finance Lease Liabilities for {year}: {fl_current} + {fl_noncurrent} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Total Finance Lease Liabilities for year {year}: {e}")
            return None

    def calculate_total_debt_and_lease_liabilities(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data or not capital_data:
                logger.warning(f"Missing data for Total Debt and Lease Liabilities calculation for year {year}")
                return None
            debt = self.get_capital_table_field(capital_data, year, 'Debt')
            operating_lease_liabilities = self.get_capital_table_field(capital_data, year, 'OperatingLeaseLiabilities')
            variable_lease_liabilities = self.get_capital_table_field(capital_data, year, 'VariableLeaseLiabilities')
            finance_lease_liabilities = self.get_capital_table_field(capital_data, year, 'FinanceLeaseLiabilities')
            result = debt + operating_lease_liabilities + variable_lease_liabilities + finance_lease_liabilities
            logger.debug(f"Total Debt and Lease Liabilities for {year}: Sum of 4 components = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Total Debt and Lease Liabilities for year {year}: {e}")
            return None

    def calculate_net_deferred_income_taxes(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data:
                logger.warning(f"Missing balance sheet data for Net Deferred Income Taxes calculation for year {year}")
                return None
            deferred_income_taxes = self.get_balance_sheet_field(balance_sheet_data, year, 'DeferredIncomeTaxes')
            foreign_tax_credit = self.get_balance_sheet_field(balance_sheet_data, year, 'ForeignTaxCreditCarryForward')
            result = -1 * (deferred_income_taxes - foreign_tax_credit)
            logger.debug(f"Net Deferred Income Taxes for {year}: -1 * ({deferred_income_taxes} - {foreign_tax_credit}) = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Net Deferred Income Taxes for year {year}: {e}")
            return None

    def calculate_total_capital_funds(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
        try:
            if not balance_sheet_data or not capital_data:
                logger.warning(f"Missing data for Total Capital/Funds calculation for year {year}")
                return None
            debt_and_equivalents = self.get_capital_table_field(capital_data, year, 'DebtAndDebtEquivalents')
            deferred_taxes_net = self.calculate_net_deferred_income_taxes(data, year, balance_sheet_data) or 0
            noncontrolling_interests = self.get_balance_sheet_field(balance_sheet_data, year, 'NoncontrollingInterests')
            equity = self.get_balance_sheet_field(balance_sheet_data, year, 'Equity')
            result = debt_and_equivalents + deferred_taxes_net + noncontrolling_interests + equity
            logger.debug(f"Total Capital/Funds for {year}: {debt_and_equivalents} + {deferred_taxes_net} + {noncontrolling_interests} + {equity} = {result}")
            return result
        except Exception as e:
            logger.error(f"Error calculating Total Capital/Funds for year {year}: {e}")
            return None

    def calculate_all_fields(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        for name, func in self.calculated_fields.items():
            try:
                if name in ['ScaledOperatingLeaseAssets']:
                    v = func(data, year, balance_sheet_data, income_statement_data)
                elif name in ['CurrentAssetsAggregate', 'CurrentLiabilitiesAggregate', 'NetOperatingAssetsCurrent', 'NetOtherNoncurrentAssets', 'TotalLongTermDebt', 'TotalOperatingLeaseLiabilities', 'TotalFinanceLeaseLiabilities', 'NetDeferredIncomeTaxes']:
                    v = func(data, year, balance_sheet_data)
                elif name in ['TotalInvestedCapitalComponents', 'InvestedCapitalWithGoodwill', 'BroaderInvestedCapital', 'TotalDebtAndLeaseLiabilities', 'TotalCapitalFunds']:
                    v = func(data, year, balance_sheet_data, capital_data)
                else:
                    v = func(data, year)
                if v is not None:
                    values[name] = v
            except Exception as e:
                logger.error(f"Error calculating {name} for year {year}: {e}")
        return values

    def update_calculated_fields(self, data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        data[year].update(self.calculate_all_fields(data, year, balance_sheet_data, capital_data, income_statement_data))
        logger.info(f"Updated calculated financial breakdown fields for year {year}: {list(self.calculated_fields.keys())}")
        return data

    def recalculate_dependent_fields(self, data: Dict[int, Dict[str, Any]], year: int, changed_field: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
        data.setdefault(year, {})
        for name in self.dependencies.get(changed_field, []):
            if name in self.calculated_fields:
                try:
                    if name in ['ScaledOperatingLeaseAssets']:
                        v = self.calculated_fields[name](data, year, balance_sheet_data, income_statement_data)
                    elif name in ['CurrentAssetsAggregate', 'CurrentLiabilitiesAggregate', 'NetOperatingAssetsCurrent', 'NetOtherNoncurrentAssets', 'TotalLongTermDebt', 'TotalOperatingLeaseLiabilities', 'TotalFinanceLeaseLiabilities', 'NetDeferredIncomeTaxes']:
                        v = self.calculated_fields[name](data, year, balance_sheet_data)
                    elif name in ['TotalInvestedCapitalComponents', 'InvestedCapitalWithGoodwill', 'BroaderInvestedCapital', 'TotalDebtAndLeaseLiabilities', 'TotalCapitalFunds']:
                        v = self.calculated_fields[name](data, year, balance_sheet_data, capital_data)
                    else:
                        v = self.calculated_fields[name](data, year)
                    if v is not None:
                        data[year][name] = v
                        logger.debug(f"Recalculated {name} for {year}: {v}")
                except Exception as e:
                    logger.error(f"Error recalculating {name} for year {year}: {e}")
        logger.info(f"Recalculated dependent financial breakdown fields for year {year} after changing {changed_field}")
        return data


financial_breakdown_calculator = CapitalTableCalculator()


def calculate_financial_breakdown_field(data: Dict[int, Dict[str, Any]], year: int, field_name: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Optional[float]:
    if field_name in financial_breakdown_calculator.calculated_fields:
        calc = financial_breakdown_calculator.calculated_fields[field_name]
        if field_name in ['ScaledOperatingLeaseAssets']:
            return calc(data, year, balance_sheet_data, income_statement_data)
        elif field_name in ['CurrentAssetsAggregate', 'CurrentLiabilitiesAggregate', 'NetOperatingAssetsCurrent', 'NetOtherNoncurrentAssets', 'TotalLongTermDebt', 'TotalOperatingLeaseLiabilities', 'TotalFinanceLeaseLiabilities', 'NetDeferredIncomeTaxes']:
            return calc(data, year, balance_sheet_data)
        elif field_name in ['TotalInvestedCapitalComponents', 'InvestedCapitalWithGoodwill', 'BroaderInvestedCapital', 'TotalDebtAndLeaseLiabilities', 'TotalCapitalFunds']:
            return calc(data, year, balance_sheet_data, capital_data)
        else:
            return calc(data, year)
    logger.warning(f"Field {field_name} is not a calculated financial breakdown field")
    return None


def update_financial_breakdown_calculations(data: Dict[int, Dict[str, Any]], year: int, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return financial_breakdown_calculator.update_calculated_fields(data, year, balance_sheet_data, capital_data, income_statement_data)


def recalculate_financial_breakdown_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str, balance_sheet_data: Dict[int, Dict[str, Any]] = None, capital_data: Dict[int, Dict[str, Any]] = None, income_statement_data: Dict[int, Dict[str, Any]] = None) -> Dict[int, Dict[str, Any]]:
    return financial_breakdown_calculator.recalculate_dependent_fields(data, year, changed_field, balance_sheet_data, capital_data, income_statement_data)


