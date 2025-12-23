from typing import Any, Dict, Union
import logging

logger = logging.getLogger(__name__)


class BaseCalculator:
    """Shared numeric helpers and safe getters."""

    @staticmethod
    def to_number(value: Any) -> float:
        try:
            return float(value) if value is not None else 0.0
        except Exception:
            return 0.0

    @classmethod
    def get_field(cls, data: Dict[Union[int, str], Dict[str, Any]], year: Union[int, str], key: str) -> float:
        try:
            return cls.to_number((data or {}).get(year, {}).get(key))
        except Exception:
            return 0.0

    @staticmethod
    def ratio(numerator: float, denominator: float, scale: float = 1.0) -> float:
        return 0.0 if denominator == 0 else (numerator / denominator) * scale

    @staticmethod
    def sum_numbers(values: Any) -> float:
        total = 0.0
        for v in values:
            try:
                total += float(v) if v is not None else 0.0
            except Exception:
                continue
        return total


