from typing import Dict, Any, Iterable, Union

# Central alias map: alias (case-insensitive) -> list of canonical keys to set
_ALIAS_TO_CANONICAL: Dict[str, Iterable[str]] = {
    # Income Statement
    'sellinggeneralandadministration': ['SellingGeneralAdministrative'],
    'sga': ['SellingGeneralAdministrative'],
    'sellinggeneraladministrative': ['SellingGeneralAdministrative'],

    # Balance Sheet common name variations
    'receivables': ['ReceivablesCurrent'],
    'accountsreceivable': ['ReceivablesCurrent'],
    'currentassets': ['AssetsCurrent'],
    'currentliabilities': ['LiabilitiesCurrent'],
    'assets': ['TotalAssets'],
    'liabilities': ['TotalLiabilities'],

    # PPE and leases naming differences
    'propertyplantandequipmentnet': ['PropertyPlantAndEquipment'],
    'operatingleaserightofuseasset': ['OperatingLeaseAssets'],
    'leasefinanceassetsnoncurrent': ['FinanceLeaseAssets'],

    # Lease liabilities naming
    'operatingleaseliabilitynoncurrent': ['OperatingLeaseLiabilitiesNoncurrent'],
    'operatingleaseliabilitiesnoncurrent': ['OperatingLeaseLiabilitiesNoncurrent'],
    'operatingleaseliabilitiescurrent': ['OperatingLeaseLiabilitiesCurrent'],
    'financeleaseliabilitiesnoncurrent': ['FinanceLeaseLiabilitiesNoncurrent', 'FinanceLeaseLiabilitiesNonCurrent'],
    'financeleaseliabilitiesnoncurrent_alt': ['FinanceLeaseLiabilitiesNoncurrent'],
    'financeleaseliabilitiescurrent': ['FinanceLeaseLiabilitiesCurrent'],

    # Employee liabilities naming
    'employeerelatedliabilitiescurrent': ['EmployeeLiabilitiesCurrent'],

    # Deferred tax naming case
    'deferredincometaxliabilitiesnoncurrent': ['DeferredIncomeTaxLiabilitiesNoncurrent', 'DeferredIncomeTaxLiabilitiesNonCurrent'],
}


def _lower(s: str) -> str:
    return s.lower().replace('_', '') if isinstance(s, str) else s


def normalize_year_fields(year_data: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of year_data with alias keys normalized to canonical keys.

    If an alias key is present, we ensure the canonical key(s) exist with the
    same value but we do not delete the original key to remain backward-compatible.
    """
    if not isinstance(year_data, dict):
        return year_data

    normalized: Dict[str, Any] = dict(year_data)

    for key, value in list(year_data.items()):
        key_norm = _lower(key)
        canonical_keys: Iterable[str] = _ALIAS_TO_CANONICAL.get(key_norm, [])
        for canonical in canonical_keys:
            if canonical not in normalized:
                normalized[canonical] = value

    return normalized


def normalize_dataset(data: Dict[Union[int, str], Dict[str, Any]]) -> Dict[Union[int, str], Dict[str, Any]]:
    """Normalize an entire dataset keyed by year -> fields dict.

    Returns a shallow-copied dataset with each year's fields normalized.
    """
    if not isinstance(data, dict):
        return data

    result: Dict[Union[int, str], Dict[str, Any]] = {}
    for year, fields in data.items():
        if isinstance(fields, dict):
            result[year] = normalize_year_fields(fields)
        else:
            result[year] = fields
    return result


