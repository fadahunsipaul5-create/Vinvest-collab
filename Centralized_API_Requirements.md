# Centralized API Requirements

This document outlines the API endpoints required to power the "Business Performance" tab and the "Valuation Model" in the frontend application. To achieve data centralization, these endpoints should be implemented by the data team to serve as the single source of truth.

## Section 1: Business Performance Tab

### 1. Get All Companies
**Purpose:** Populates the "Company" search dropdown selector.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/companies`
*   **Response Schema:**
    ```json
    [
      {
        "ticker": "AAPL",
        "name": "Apple Inc."
      },
      {
        "ticker": "MSFT",
        "name": "Microsoft Corporation"
      }
    ]
    ```

### 2. Get Available Metrics
**Purpose:** Populates the "Metric" search dropdown selector with valid financial metrics.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/metrics`
*   **Response Schema:**
    ```json
    {
      "metrics": [
        "Revenue",
        "Net Income",
        "EBITDA",
        "Operating Cash Flow",
        "Free Cash Flow"
      ]
    }
    ```

### 3. Get Available Industries
**Purpose:** Populates the "Industry" search dropdown selector for "Across Industry" comparisons.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/industries`
*   **Response Schema:**
    ```json
    {
      "industries": [
        {
          "name": "Software - Infrastructure",
          "companies": ["MSFT", "ORCL", "ADBE"]
        },
        {
          "name": "Consumer Electronics",
          "companies": ["AAPL"]
        }
      ]
    }
    ```

### 4. Get Aggregated Company Data (Historical)
**Purpose:** Powers the "Across Metrics" and "Across Peers" charts. Returns historical performance data for specific companies.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/aggregated-data`
*   **Query Parameters:**
    *   `tickers`: Comma-separated list of company tickers (e.g., `AAPL,MSFT`).
    *   `metric`: The financial metric to query (e.g., `Revenue`).
    *   `period`: Time range filter (e.g., `1Y`, `5Y`, `10Y`).
    *   `periodType`: Aggregation method (`Annual`, `Average`, `CAGR`).
*   **Response Schema:**
    ```json
    [
      {
        "ticker": "AAPL",
        "name": "2020",
        "value": 274515000000
      },
      {
        "ticker": "AAPL",
        "name": "2021",
        "value": 365817000000
      }
    ]
    ```

### 5. Get Industry Comparison Data
**Purpose:** Powers the "Across Industry" chart. Returns historical average performance for entire industries.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/industry-comparison`
*   **Query Parameters:**
    *   `industries`: Comma-separated list of industry names (e.g., `Software,Hardware`).
    *   `metric`: The financial metric to query (e.g., `Revenue`).
*   **Response Schema:**
    ```json
    {
      "industries": ["Software", "Hardware"],
      "comparisons": [
        {
          "period": "2020",
          "Software_total": 50000000000,
          "Hardware_total": 45000000000
        },
        {
          "period": "2021",
          "Software_total": 55000000000,
          "Hardware_total": 48000000000
        }
      ]
    }
    ```

---

## Section 2: Valuation Model

To support the Valuation Model with "Excel-like Functionality", the backend must provide verified historical data for all financial statements and analysis tables. Forecasted years will be editable on the frontend but should start from this historical baseline.

### 6. Get Income Statement Data
**Purpose:** Populates the historical columns of the Income Statement table.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/financials/income-statement/{ticker}`
*   **Response Schema:** Object keyed by Year (integer), containing key-value pairs for all line items.
    ```json
    {
      "2022": {
        "Revenue": 100000,
        "CostOfRevenue": 60000,
        "GrossProfit": 40000,
        ...
      },
      "2023": { ... }
    }
    ```

### 7. Get Balance Sheet Data
**Purpose:** Populates the historical columns of the Balance Sheet table.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/financials/balance-sheet/{ticker}`
*   **Response Schema:** Similar to Income Statement.
    ```json
    {
      "2022": {
        "Cash": 5000,
        "TotalAssets": 50000,
        "TotalLiabilities": 30000,
        ...
      }
    }
    ```

### 8. Get Cash Flow Data
**Purpose:** Populates the historical columns of the Cash Flow table.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/financials/cash-flow/{ticker}`
*   **Response Schema:** Similar to Income Statement.
    ```json
    {
      "2022": {
        "NetIncome": 10000,
        "Depreciation": 2000,
        "OperatingCashFlow": 12000,
        ...
      }
    }
    ```

### 9. Get NOPAT (Net Operating Profit After Tax)
**Purpose:** Populates the NOPAT analysis table. Ideally calculated centrally to ensure consistent tax rate and adjustment assumptions.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/analysis/nopat/{ticker}`
*   **Response Schema:**
    ```json
    {
      "2022": {
        "EBIT": 15000,
        "CashTaxAdjustment": -3000,
        "NOPAT": 12000
      }
    }
    ```

### 10. Get Invested Capital
**Purpose:** Populates the "Capital" (Invested Capital) table.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/analysis/invested-capital/{ticker}`
*   **Response Schema:**
    ```json
    {
      "2022": {
        "OperatingWorkingCapital": 5000,
        "NetPP&E": 20000,
        "InvestedCapital": 25000
      }
    }
    ```

### 11. Get Free Cash Flow (FCF) Analysis
**Purpose:** Populates the Free Cash Flow analysis table.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/analysis/free-cash-flow/{ticker}`
*   **Response Schema:**
    ```json
    {
      "2022": {
        "NOPAT": 12000,
        "ChangeInInvestedCapital": -1000,
        "FreeCashFlow": 11000
      }
    }
    ```

### 12. Get ROIC Breakdown
**Purpose:** Populates the Return on Invested Capital breakdown table.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/analysis/roic/{ticker}`
*   **Response Schema:**
    ```json
    {
      "2022": {
        "NOPATMargin": 0.12,
        "InvestedCapitalTurnover": 4.0,
        "ROIC": 0.48
      }
    }
    ```

### 13. Get Operational Performance
**Purpose:** Populates the "Ops Perform" table (e.g., margins, growth rates).

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/analysis/operational-performance/{ticker}`
*   **Response Schema:**
    ```json
    {
      "2022": {
        "RevenueGrowth": 0.05,
        "EBITDAMargin": 0.25
      }
    }
    ```

### 14. Get Financing Health (Solvency)
**Purpose:** Populates the Financing Health table (e.g., Debt/EBITDA, Interest Coverage).

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/analysis/financing-health/{ticker}`
*   **Response Schema:**
    ```json
    {
      "2022": {
        "NetDebt": 10000,
        "NetDebtToEBITDA": 0.5,
        "InterestCoverage": 15.0
      }
    }
    ```

---

## Section 3: Historical Ranking

This section covers the APIs required for the "Historical Ranking" mode in the "Top Picks" feature, allowing users to view company rankings over time based on specific criteria.

### 15. Get Available Ranking Types
**Purpose:** Populates the "Ranking Type" dropdown filter (e.g., Overall, ROIC, Earnings Yield, Intrinsic Value).

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/rankings/types`
*   **Response Schema:**
    ```json
    {
      "rankingTypes": [
        {
          "id": "overall",
          "label": "Overall Rank"
        },
        {
          "id": "roic",
          "label": "ROIC Rank"
        },
        {
          "id": "earnings",
          "label": "Earnings Yield Rank"
        },
        {
          "id": "intrinsic",
          "label": "Intrinsic Value Rank"
        }
      ]
    }
    ```

### 16. Get Historical Company Ranking
**Purpose:** Retrieves the historical ranking data for a specific company or list of companies based on a selected ranking type. This powers the historical ranking chart/table.

*   **Method:** `GET`
*   **Proposed Endpoint:** `/api/central/rankings/historical`
*   **Query Parameters:**
    *   `tickers`: Comma-separated list of company tickers (e.g., `AAPL,MSFT`).
    *   `rankingType`: The ID of the ranking type to query (e.g., `overall`, `roic`).
    *   `period`: Time range filter (optional, e.g., `1Y`, `5Y`, `All`).
*   **Response Schema:**
    ```json
    [
      {
        "ticker": "AAPL",
        "rankings": [
          {
            "date": "2023-01-01",
            "rank": 5,
            "value": 0.45 // Optional: The raw value associated with the rank (e.g., ROIC value)
          },
          {
            "date": "2023-02-01",
            "rank": 4,
            "value": 0.48
          }
        ]
      },
      {
        "ticker": "MSFT",
        "rankings": [
           // ... similar structure
        ]
      }
    ]
    ```
