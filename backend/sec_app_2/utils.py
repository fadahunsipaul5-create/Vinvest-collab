from typing import Dict, Any, Optional
import logging

# Thin facade re-exporting calculators from modular files.
# Keeps external API stable while drastically reducing this file size and import time.
from .calculators.aliases import normalize_dataset

# Income Statement
from .calculators.income_statement import (
    income_statement_calculator,
    calculate_income_statement_field,
    update_income_statement_calculations,
    recalculate_income_statement_dependent_fields as recalculate_dependent_fields,
)

# Balance Sheet
from .calculators.balance_sheet import (
    balance_sheet_calculator,
    calculate_balance_sheet_field,
    update_balance_sheet_calculations,
    recalculate_balance_sheet_dependent_fields,
    update_percentage_based_balance_sheet_field,
)

# NOPAT
from .calculators.nopat import (
    nopat_calculator,
    calculate_nopat_field,
    update_nopat_calculations,
    recalculate_nopat_dependent_fields,
)

# Capital Table (Financial Breakdown)
from .calculators.capital_table import (
    financial_breakdown_calculator,
    calculate_financial_breakdown_field,
    update_financial_breakdown_calculations,
    recalculate_financial_breakdown_dependent_fields,
)

# PPE Changes
from .calculators.ppe_changes import (
    ppe_changes_calculator,
    calculate_ppe_changes_field,
    update_ppe_changes_calculations,
    recalculate_ppe_changes_dependent_fields,
    validate_ppe_reconciliation,
)

# Income Statement Common Size
from .calculators.income_statement_common_size import (
    income_statement_common_size_calculator,
    calculate_income_statement_common_size_field,
    update_income_statement_common_size_calculations,
    recalculate_income_statement_common_size_dependent_fields,
)

# ROIC Performance
from .calculators.roic_performance import (
    roic_performance_calculator,
    calculate_roic_performance_field,
    update_roic_performance_calculations,
    recalculate_roic_performance_dependent_fields,
)

# Financing Health
from .calculators.financing_health import (
    financing_health_calculator,
    calculate_financing_health_field,
    update_financing_health_calculations,
    recalculate_financing_health_dependent_fields,
)

# Free Cash Flow
from .calculators.free_cash_flow import (
    free_cash_flow_calculator,
    calculate_free_cash_flow_field,
    update_free_cash_flow_calculations,
    recalculate_free_cash_flow_dependent_fields,
)

# Balance Sheet Common Size
from .calculators.balance_sheet_common_size import (
    balance_sheet_common_size_calculator,
    calculate_balance_sheet_common_size_field,
    update_balance_sheet_common_size_calculations,
    recalculate_balance_sheet_common_size_dependent_fields,
)

logger = logging.getLogger(__name__)

__all__ = [
    # Income statement
    "income_statement_calculator",
    "calculate_income_statement_field",
    "update_income_statement_calculations",
    "recalculate_dependent_fields",
    # Balance sheet
    "balance_sheet_calculator",
    "calculate_balance_sheet_field",
    "update_balance_sheet_calculations",
    "recalculate_balance_sheet_dependent_fields",
    "update_percentage_based_balance_sheet_field",
    # NOPAT
    "nopat_calculator",
    "calculate_nopat_field",
    "update_nopat_calculations",
    "recalculate_nopat_dependent_fields",
    # Capital Table / Financial Breakdown
    "financial_breakdown_calculator",
    "calculate_financial_breakdown_field",
    "update_financial_breakdown_calculations",
    "recalculate_financial_breakdown_dependent_fields",
    # PPE Changes
    "ppe_changes_calculator",
    "calculate_ppe_changes_field",
    "update_ppe_changes_calculations",
    "recalculate_ppe_changes_dependent_fields",
    "validate_ppe_reconciliation",
    # Income Statement Common Size
    "income_statement_common_size_calculator",
    "calculate_income_statement_common_size_field",
    "update_income_statement_common_size_calculations",
    "recalculate_income_statement_common_size_dependent_fields",
    # ROIC Performance
    "roic_performance_calculator",
    "calculate_roic_performance_field",
    "update_roic_performance_calculations",
    "recalculate_roic_performance_dependent_fields",
    # Financing Health
    "financing_health_calculator",
    "calculate_financing_health_field",
    "update_financing_health_calculations",
    "recalculate_financing_health_dependent_fields",
    # Free Cash Flow
    "free_cash_flow_calculator",
    "calculate_free_cash_flow_field",
    "update_free_cash_flow_calculations",
    "recalculate_free_cash_flow_dependent_fields",
    # Balance Sheet Common Size
    "balance_sheet_common_size_calculator",
    "calculate_balance_sheet_common_size_field",
    "update_balance_sheet_common_size_calculations",
    "recalculate_balance_sheet_common_size_dependent_fields",
]


# Normalizing wrappers: keep signatures, normalize datasets before delegating

def update_income_statement_calculations(data: Dict[int, Dict[str, Any]], year: int) -> Dict[int, Dict[str, Any]]:  # type: ignore[override]
    data_norm = normalize_dataset(data)
    return income_statement_calculator.update_calculated_fields(data_norm, year)


def recalculate_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str) -> Dict[int, Dict[str, Any]]:  # type: ignore[override]
    data_norm = normalize_dataset(data)
    return income_statement_calculator.recalculate_dependent_fields(data_norm, year, changed_field)


def update_balance_sheet_calculations(data: Dict[int, Dict[str, Any]], year: int) -> Dict[int, Dict[str, Any]]:  # type: ignore[override]
    data_norm = normalize_dataset(data)
    return balance_sheet_calculator.update_calculated_fields(data_norm, year)


def recalculate_balance_sheet_dependent_fields(data: Dict[int, Dict[str, Any]], year: int, changed_field: str) -> Dict[int, Dict[str, Any]]:  # type: ignore[override]
    data_norm = normalize_dataset(data)
    return balance_sheet_calculator.recalculate_dependent_fields(data_norm, year, changed_field)


