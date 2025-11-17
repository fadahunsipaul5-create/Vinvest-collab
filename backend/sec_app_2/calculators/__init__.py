"""Calculator modules for financial computations.

This package organizes calculators into focused modules to keep imports
fast and code easier to navigate.
"""

from .income_statement import (
    income_statement_calculator,
    calculate_income_statement_field,
    update_income_statement_calculations,
    recalculate_income_statement_dependent_fields,
)

from .balance_sheet import (
    balance_sheet_calculator,
    calculate_balance_sheet_field,
    update_balance_sheet_calculations,
    recalculate_balance_sheet_dependent_fields,
    update_percentage_based_balance_sheet_field,
)

from .nopat import (
    nopat_calculator,
    calculate_nopat_field,
    update_nopat_calculations,
    recalculate_nopat_dependent_fields,
)

from .capital_table import (
    financial_breakdown_calculator,
    calculate_financial_breakdown_field,
    update_financial_breakdown_calculations,
    recalculate_financial_breakdown_dependent_fields,
)

from .ppe_changes import (
    ppe_changes_calculator,
    calculate_ppe_changes_field,
    update_ppe_changes_calculations,
    recalculate_ppe_changes_dependent_fields,
    validate_ppe_reconciliation,
)

from .income_statement_common_size import (
    income_statement_common_size_calculator,
    calculate_income_statement_common_size_field,
    update_income_statement_common_size_calculations,
    recalculate_income_statement_common_size_dependent_fields,
)

from .roic_performance import (
    roic_performance_calculator,
    calculate_roic_performance_field,
    update_roic_performance_calculations,
    recalculate_roic_performance_dependent_fields,
)

from .financing_health import (
    financing_health_calculator,
    calculate_financing_health_field,
    update_financing_health_calculations,
    recalculate_financing_health_dependent_fields,
)

from .free_cash_flow import (
    free_cash_flow_calculator,
    calculate_free_cash_flow_field,
    update_free_cash_flow_calculations,
    recalculate_free_cash_flow_dependent_fields,
)

from .balance_sheet_common_size import (
    balance_sheet_common_size_calculator,
    calculate_balance_sheet_common_size_field,
    update_balance_sheet_common_size_calculations,
    recalculate_balance_sheet_common_size_dependent_fields,
)


