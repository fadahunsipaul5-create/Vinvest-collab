
// Real Costco data integration for ValuationPage.tsx
// Add this to your ValuationPage component

import { useState, useEffect } from 'react';

// Real Costco data from Excel
const realCostcoData = {
  "incomeStatement": {
    "2011": {
      "GrossMargin": 0.0,
      "OperatingIncome": 2439000000.0,
      "InterestExpense": -116000000.0,
      "OtherIncome": 60000000.0,
      "PretaxIncome": 2383000000.0,
      "TaxProvision": -841000000.0,
      "NetIncomeControlling": 1542000000.0,
      "NetIncomeNoncontrolling": 80000000.0,
      "NetIncome": 1462000000.0
    },
    "2012": {
      "GrossMargin": 0.0,
      "OperatingIncome": 2759000000.0,
      "InterestExpense": -95000000.0,
      "OtherIncome": 103000000.0,
      "PretaxIncome": 2767000000.0,
      "TaxProvision": -1000000000.0,
      "NetIncomeControlling": 1767000000.0,
      "NetIncomeNoncontrolling": 58000000.0,
      "NetIncome": 1709000000.0
    },
    "2013": {
      "GrossMargin": 0.0,
      "OperatingIncome": 3053000000.0,
      "InterestExpense": -99000000.0,
      "OtherIncome": 97000000.0,
      "PretaxIncome": 3051000000.0,
      "TaxProvision": -990000000.0,
      "NetIncomeControlling": 2061000000.0,
      "NetIncomeNoncontrolling": 22000000.0,
      "NetIncome": 2039000000.0
    },
    "2014": {
      "GrossMargin": 0.0,
      "OperatingIncome": 3220000000.0,
      "InterestExpense": -113000000.0,
      "OtherIncome": 90000000.0,
      "PretaxIncome": 3197000000.0,
      "TaxProvision": -1109000000.0,
      "NetIncomeControlling": 2088000000.0,
      "NetIncomeNoncontrolling": 30000000.0,
      "NetIncome": 2058000000.0
    },
    "2015": {
      "GrossMargin": 0.0,
      "OperatingIncome": 3624000000.0,
      "InterestExpense": -124000000.0,
      "OtherIncome": 104000000.0,
      "PretaxIncome": 3604000000.0,
      "TaxProvision": -1195000000.0,
      "NetIncomeControlling": 2409000000.0,
      "NetIncomeNoncontrolling": 32000000.0,
      "NetIncome": 2377000000.0
    },
    "2016": {
      "Revenue": 118719000000.0,
      "CostOfRevenue": -102901000000.0,
      "GrossMargin": 15818000000.0,
      "OperatingIncome": 3672000000.0,
      "InterestExpense": -133000000.0,
      "OtherIncome": 80000000.0,
      "PretaxIncome": 3619000000.0,
      "TaxProvision": -1243000000.0,
      "NetIncomeControlling": 2376000000.0,
      "NetIncomeNoncontrolling": 26000000.0,
      "NetIncome": 2350000000.0
    },
    "2017": {
      "Revenue": 129025000000.0,
      "CostOfRevenue": -111882000000.0,
      "GrossMargin": 17143000000.0,
      "OperatingIncome": 4111000000.0,
      "InterestExpense": -134000000.0,
      "OtherIncome": 62000000.0,
      "PretaxIncome": 4039000000.0,
      "TaxProvision": -1325000000.0,
      "NetIncomeControlling": 2714000000.0,
      "NetIncomeNoncontrolling": 35000000.0,
      "NetIncome": 2679000000.0
    },
    "2018": {
      "Revenue": 141576000000.0,
      "CostOfRevenue": -123152000000.0,
      "GrossMargin": 18424000000.0,
      "OperatingIncome": 4480000000.0,
      "InterestExpense": -159000000.0,
      "OtherIncome": 121000000.0,
      "PretaxIncome": 4442000000.0,
      "TaxProvision": -1263000000.0,
      "NetIncomeControlling": 3179000000.0,
      "NetIncomeNoncontrolling": 45000000.0,
      "NetIncome": 3134000000.0
    },
    "2019": {
      "Revenue": 152703000000.0,
      "CostOfRevenue": -132886000000.0,
      "GrossMargin": 19817000000.0,
      "OperatingIncome": 4737000000.0,
      "InterestExpense": -150000000.0,
      "OtherIncome": 178000000.0,
      "PretaxIncome": 4765000000.0,
      "TaxProvision": -1061000000.0,
      "NetIncomeControlling": 3704000000.0,
      "NetIncomeNoncontrolling": 45000000.0,
      "NetIncome": 3659000000.0
    },
    "2020": {
      "Revenue": 166761000000.0,
      "CostOfRevenue": 144939000000.0,
      "GrossMargin": 21822000000.0,
      "OperatingIncome": 5435000000.0,
      "InterestIncome": 89000000.0,
      "InterestExpense": 160000000.0,
      "OtherIncome": 3000000.0,
      "PretaxIncome": 5367000000.0,
      "TaxProvision": 1308000000.0,
      "NetIncomeControlling": 4059000000.0,
      "NetIncomeNoncontrolling": 57000000.0,
      "NetIncome": 4002000000.0,
      "OperatingLeaseCost": 252000000.0,
      "VariableLeaseCost": 87000000.0,
      "LeasesDiscountRate": 2.23,
      "ForeignCurrencyAdjustment": 162000000.0,
      "Depreciation": 1645000000.0
    },
    "2021": {
      "Revenue": 195929000000.0,
      "CostOfRevenue": 170684000000.0,
      "GrossMargin": 25245000000.0,
      "OperatingIncome": 6708000000.0,
      "InterestIncome": 41000000.0,
      "InterestExpense": 171000000.0,
      "OtherIncome": 102000000.0,
      "PretaxIncome": 6680000000.0,
      "TaxProvision": 1601000000.0,
      "NetIncomeControlling": 5079000000.0,
      "NetIncomeNoncontrolling": 72000000.0,
      "NetIncome": 5007000000.0,
      "OperatingLeaseCost": 296000000.0,
      "VariableLeaseCost": 151000000.0,
      "LeasesDiscountRate": 2.16,
      "ForeignCurrencyAdjustment": 181000000.0,
      "Depreciation": 1781000000.0
    },
    "2022": {
      "Revenue": 226954000000.0,
      "CostOfRevenue": 199382000000.0,
      "GrossMargin": 27572000000.0,
      "OperatingIncome": 7793000000.0,
      "InterestIncome": 61000000.0,
      "InterestExpense": 158000000.0,
      "OtherIncome": 144000000.0,
      "PretaxIncome": 7840000000.0,
      "TaxProvision": 1925000000.0,
      "NetIncomeControlling": 5915000000.0,
      "NetIncomeNoncontrolling": 71000000.0,
      "NetIncome": 5844000000.0,
      "OperatingLeaseCost": 297000000.0,
      "VariableLeaseCost": 157000000.0,
      "LeasesDiscountRate": 2.26,
      "ForeignCurrencyAdjustment": -72000000.0,
      "Depreciation": 1900000000.0
    },
    "2023": {
      "Revenue": 242290000000.0,
      "CostOfRevenue": 212586000000.0,
      "GrossMargin": 29704000000.0,
      "OperatingIncome": 8114000000.0,
      "InterestIncome": 470000000.0,
      "InterestExpense": 160000000.0,
      "OtherIncome": 63000000.0,
      "PretaxIncome": 8487000000.0,
      "TaxProvision": 2195000000.0,
      "NetIncomeControlling": 6292000000.0,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 6292000000.0,
      "OperatingLeaseCost": 309000000.0,
      "VariableLeaseCost": 160000000.0,
      "LeasesDiscountRate": 2.47,
      "ForeignCurrencyAdjustment": 2000000.0,
      "Depreciation": 2077000000.0
    },
    "2024": {
      "Revenue": 254453000000.0,
      "CostOfRevenue": 222358000000.0,
      "GrossMargin": 32095000000.0,
      "OperatingIncome": 9285000000.0,
      "InterestIncome": 533000000.0,
      "InterestExpense": 169000000.0,
      "OtherIncome": 91000000.0,
      "PretaxIncome": 9740000000.0,
      "TaxProvision": 2373000000.0,
      "NetIncomeControlling": 7367000000.0,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 7367000000.0,
      "OperatingLeaseCost": 284000000.0,
      "VariableLeaseCost": 163000000.0,
      "LeasesDiscountRate": 2.67,
      "ForeignCurrencyAdjustment": -72000000.0,
      "Depreciation": 2237000000.0
    },
    "2025": {
      "Revenue": 269278941955.604,
      "CostOfRevenue": -235682013458.954,
      "GrossMargin": 33596928496.6495,
      "OperatingIncome": 9271902568.26126,
      "InterestIncome": 204363823.123069,
      "InterestExpense": -138779790.863353,
      "OtherIncome": 119340080.716592,
      "PretaxIncome": 9734386262.96427,
      "TaxProvision": -2403107779.41899,
      "NetIncomeControlling": 12137494042.3832,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 12137494042.3832,
      "OperatingLeaseCost": 350792199.794601,
      "VariableLeaseCost": 186032230.253456,
      "Depreciation": -2399900802.72325
    },
    "2026": {
      "Revenue": 284811175125.548,
      "CostOfRevenue": -249276347870.778,
      "GrossMargin": 35534827254.7706,
      "OperatingIncome": 9775411416.35762,
      "InterestExpense": -185557307.247644,
      "OtherIncome": 126223715.755962,
      "PretaxIncome": 10087192439.3612,
      "TaxProvision": -2490204309.61856,
      "NetIncomeControlling": 12577396748.9798,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 12577396748.9798,
      "OperatingLeaseCost": 371026185.422433,
      "VariableLeaseCost": 196762723.906012,
      "Depreciation": -2569631273.51045
    },
    "2027": {
      "Revenue": 301072676287.788,
      "CostOfRevenue": -263508962229.511,
      "GrossMargin": 37563714058.2772,
      "OperatingIncome": 10303327505.2176,
      "InterestExpense": -145243802.073426,
      "OtherIncome": 133430550.598601,
      "PretaxIncome": 10582001857.8896,
      "TaxProvision": -2612356886.15228,
      "NetIncomeControlling": 13194358744.0419,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 13194358744.0419,
      "OperatingLeaseCost": 392210195.294267,
      "VariableLeaseCost": 207997034.715876,
      "Depreciation": -2746564374.50646
    },
    "2028": {
      "Revenue": 318086480891.119,
      "CostOfRevenue": -278400017936.984,
      "GrossMargin": 39686462954.1352,
      "OperatingIncome": 10856247756.0358,
      "InterestExpense": -102855629.22761,
      "OtherIncome": 140970794.183607,
      "PretaxIncome": 11100074179.4471,
      "TaxProvision": -2740252327.38549,
      "NetIncomeControlling": 13840326506.8326,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 13840326506.8326,
      "OperatingLeaseCost": 414374237.905003,
      "VariableLeaseCost": 219751076.797547,
      "Depreciation": -2931101648.14318
    },
    "2029": {
      "Revenue": 335875632561.161,
      "CostOfRevenue": -293969683551.659,
      "GrossMargin": 41905949009.5022,
      "OperatingIncome": 11434771147.0819,
      "InterestExpense": -58261760.0440279,
      "OtherIncome": 148854659.073913,
      "PretaxIncome": 11641887566.1998,
      "TaxProvision": -2874008676.22206,
      "NetIncomeControlling": 14515896242.4219,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 14515896242.4219,
      "OperatingLeaseCost": 437548332.401567,
      "VariableLeaseCost": 232040769.914511,
      "Depreciation": -3123642934.19904
    },
    "2030": {
      "Revenue": 354463129640.35,
      "CostOfRevenue": -310238087998.628,
      "GrossMargin": 44225041641.7221,
      "OperatingIncome": 12039496244.5686,
      "InterestExpense": -11327087.4343947,
      "OtherIncome": 157092337.763677,
      "PretaxIncome": 12207915669.7667,
      "TaxProvision": -3013742862.0563,
      "NetIncomeControlling": 15221658531.823,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 15221658531.823,
      "OperatingLeaseCost": 461762438.940055,
      "VariableLeaseCost": 244882002.546215,
      "Depreciation": -3324586521.72525
    },
    "2031": {
      "Revenue": 373871868776.779,
      "CostOfRevenue": -327225271196.664,
      "GrossMargin": 46646597580.1149,
      "OperatingIncome": 12671018691.2443,
      "InterestExpense": 38087694.5532994,
      "OtherIncome": 165693977.677765,
      "PretaxIncome": 12798624974.3688,
      "TaxProvision": -3159570044.88191,
      "NetIncomeControlling": 15958195019.2507,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 15958195019.2507,
      "OperatingLeaseCost": 487046385.198393,
      "VariableLeaseCost": 258290592.916244,
      "Depreciation": -3534329215.33103
    },
    "2032": {
      "Revenue": 394124585589.72,
      "CostOfRevenue": -344951132126.684,
      "GrossMargin": 49173453463.0359,
      "OperatingIncome": 13329928650.871,
      "InterestExpense": 90126197.1650392,
      "OtherIncome": 174669654.875669,
      "PretaxIncome": 13414472108.5816,
      "TaxProvision": -3311602951.64979,
      "NetIncomeControlling": 16726075060.2314,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 16726075060.2314,
      "OperatingLeaseCost": 513429789.08075,
      "VariableLeaseCost": 272282248.000897,
      "Depreciation": -3753266318.87296
    },
    "2033": {
      "Revenue": 415243792453.202,
      "CostOfRevenue": -363435374377.838,
      "GrossMargin": 51808418075.3648,
      "OperatingIncome": 14016808207.55,
      "InterestExpense": 144936429.007484,
      "OtherIncome": 184029346.478193,
      "PretaxIncome": 14055901125.0207,
      "TaxProvision": -3469951204.70959,
      "NetIncomeControlling": 17525852329.7303,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 17525852329.7303,
      "OperatingLeaseCost": 540941977.667631,
      "VariableLeaseCost": 286872520.546774,
      "Depreciation": -3981791539.37992
    },
    "2034": {
      "Revenue": 437251713453.222,
      "CostOfRevenue": -382697449219.863,
      "GrossMargin": 54554264233.3591,
      "OperatingIncome": 14732228719.6497,
      "InterestExpense": 202670873.352755,
      "OtherIncome": 193782901.841537,
      "PretaxIncome": 14723340748.1385,
      "TaxProvision": -3634720642.37916,
      "NetIncomeControlling": 18358061390.5177,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 18358061390.5177,
      "OperatingLeaseCost": 569611902.484016,
      "VariableLeaseCost": 302076764.135753,
      "Depreciation": -4220296813.86741
    },
    "2035": {
      "Revenue": 460170216588.842,
      "CostOfRevenue": -402756496263.202,
      "GrossMargin": 57413720325.6391,
      "OperatingIncome": 15476748128.8722,
      "InterestExpense": 263486550.242307,
      "OtherIncome": 203940012.509921,
      "PretaxIncome": 15417201591.1398,
      "TaxProvision": -3806012631.89006,
      "NetIncomeControlling": 19223214223.0299,
      "NetIncomeNoncontrolling": 0.0,
      "NetIncome": 19223214223.0299,
      "OperatingLeaseCost": 599468051.177102,
      "VariableLeaseCost": 317910086.345898,
      "Depreciation": -4469172061.55182
    }
  },
  "balanceSheet": {
    "2011": {
      "CashAndCashEquivalents": 5613000000.0,
      "Inventory": 6638000000.0,
      "OtherAssetsNoncurrent": 623000000.0,
      "EmployeeLiabilitiesCurrent": 1758000000.0,
      "LongTermDebtCurrent": 900000000.0,
      "OtherLiabilitiesCurrent": 1540000000.0
    },
    "2012": {
      "CashAndCashEquivalents": 4854000000.0,
      "Inventory": 7096000000.0,
      "OtherAssetsNoncurrent": 653000000.0,
      "EmployeeLiabilitiesCurrent": 1832000000.0,
      "LongTermDebtCurrent": 1000000.0,
      "OtherLiabilitiesCurrent": 966000000.0
    },
    "2013": {
      "CashAndCashEquivalents": 6124000000.0,
      "Inventory": 7894000000.0,
      "OtherAssetsNoncurrent": 562000000.0,
      "EmployeeLiabilitiesCurrent": 2037000000.0,
      "OtherLiabilitiesCurrent": 1089000000.0
    },
    "2014": {
      "CashAndCashEquivalents": 7315000000.0,
      "Inventory": 8456000000.0,
      "OtherAssetsNoncurrent": 606000000.0,
      "EmployeeLiabilitiesCurrent": 2231000000.0,
      "LongTermDebtCurrent": 0.0,
      "OtherLiabilitiesCurrent": 1663000000.0
    },
    "2015": {
      "CashAndCashEquivalents": 6419000000.0,
      "Inventory": 8908000000.0,
      "OtherAssetsCurrent": 228000000.0,
      "OtherAssetsNoncurrent": 837000000.0,
      "EmployeeLiabilitiesCurrent": 2468000000.0,
      "LongTermDebtCurrent": 1283000000.0,
      "OtherLiabilitiesCurrent": 1696000000.0
    },
    "2016": {
      "CashAndCashEquivalents": 4729000000.0,
      "Inventory": 8969000000.0,
      "OtherAssetsCurrent": 268000000.0,
      "OtherAssetsNoncurrent": 902000000.0,
      "EmployeeLiabilitiesCurrent": 2629000000.0,
      "DeferredRevenueCurrent": 1362000000.0,
      "LongTermDebtCurrent": 1100000000.0,
      "OtherLiabilitiesCurrent": 2003000000.0
    },
    "2017": {
      "CashAndCashEquivalents": 5779000000.0,
      "Inventory": 9834000000.0,
      "OtherAssetsCurrent": 272000000.0,
      "OtherAssetsNoncurrent": 869000000.0,
      "EmployeeLiabilitiesCurrent": 2703000000.0,
      "DeferredRevenueCurrent": 1498000000.0,
      "LongTermDebtCurrent": 86000000.0,
      "OtherLiabilitiesCurrent": 2725000000.0
    },
    "2018": {
      "CashAndCashEquivalents": 7259000000.0,
      "Inventory": 11040000000.0,
      "OtherAssetsCurrent": 321000000.0,
      "OtherAssetsNoncurrent": 860000000.0,
      "EmployeeLiabilitiesCurrent": 2994000000.0,
      "DeferredRevenueCurrent": 1624000000.0,
      "LongTermDebtCurrent": 90000000.0,
      "OtherLiabilitiesCurrent": 3014000000.0
    },
    "2019": {
      "CashAndCashEquivalents": 9444000000.0,
      "Inventory": 11395000000.0,
      "OtherAssetsCurrent": 1111000000.0,
      "OperatingLeaseAssets": 0.0,
      "OtherAssetsNoncurrent": 1025000000.0,
      "EmployeeLiabilitiesCurrent": 3176000000.0,
      "DeferredRevenueCurrent": 1711000000.0,
      "LongTermDebtCurrent": 1699000000.0,
      "OtherLiabilitiesCurrent": 3792000000.0
    },
    "2020": {
      "CashAndCashEquivalents": 13305000000.0,
      "Inventory": 12242000000.0,
      "OtherAssetsCurrent": 1023000000.0,
      "OperatingLeaseAssets": 2788000000.0,
      "FinanceLeaseAssets": 592000000.0,
      "Goodwill": 988000000.0,
      "OtherAssetsNoncurrent": 855000000.0,
      "EmployeeLiabilitiesCurrent": 3605000000.0,
      "AccruedLiabilitiesCurrent": 1393000000.0,
      "DeferredRevenueCurrent": 1851000000.0,
      "LongTermDebtCurrent": 95000000.0,
      "OperatingLeaseLiabilitiesCurrent": 231000000.0,
      "FinanceLeaseLiabilitiesCurrent": 31000000.0,
      "OtherLiabilitiesCurrent": 3466000000.0
    },
    "2021": {
      "CashAndCashEquivalents": 12175000000.0,
      "Inventory": 14215000000.0,
      "OtherAssetsCurrent": 1312000000.0,
      "OperatingLeaseAssets": 2890000000.0,
      "FinanceLeaseAssets": 1000000000.0,
      "Goodwill": 996000000.0,
      "OtherAssetsNoncurrent": 941000000.0,
      "EmployeeLiabilitiesCurrent": 4090000000.0,
      "AccruedLiabilitiesCurrent": 1671000000.0,
      "DeferredRevenueCurrent": 2042000000.0,
      "LongTermDebtCurrent": 799000000.0,
      "OperatingLeaseLiabilitiesCurrent": 222000000.0,
      "FinanceLeaseLiabilitiesCurrent": 72000000.0,
      "OtherLiabilitiesCurrent": 4267000000.0
    },
    "2022": {
      "CashAndCashEquivalents": 11049000000.0,
      "Inventory": 17907000000.0,
      "OtherAssetsCurrent": 1499000000.0,
      "OperatingLeaseAssets": 2774000000.0,
      "FinanceLeaseAssets": 1620000000.0,
      "Goodwill": 993000000.0,
      "OtherAssetsNoncurrent": 992000000.0,
      "EmployeeLiabilitiesCurrent": 4381000000.0,
      "AccruedLiabilitiesCurrent": 1911000000.0,
      "DeferredRevenueCurrent": 2174000000.0,
      "LongTermDebtCurrent": 73000000.0,
      "OperatingLeaseLiabilitiesCurrent": 239000000.0,
      "FinanceLeaseLiabilitiesCurrent": 245000000.0,
      "OtherLiabilitiesCurrent": 5127000000.0
    },
    "2023": {
      "CashAndCashEquivalents": 15234000000.0,
      "Inventory": 16651000000.0,
      "OtherAssetsCurrent": 1709000000.0,
      "OperatingLeaseAssets": 2713000000.0,
      "FinanceLeaseAssets": 1325000000.0,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 908000000.0,
      "EmployeeLiabilitiesCurrent": 4278000000.0,
      "AccruedLiabilitiesCurrent": 2150000000.0,
      "DeferredRevenueCurrent": 2337000000.0,
      "LongTermDebtCurrent": 1081000000.0,
      "OperatingLeaseLiabilitiesCurrent": 220000000.0,
      "FinanceLeaseLiabilitiesCurrent": 129000000.0,
      "OtherLiabilitiesCurrent": 5905000000.0
    },
    "2024": {
      "CashAndCashEquivalents": 11144000000.0,
      "Inventory": 18647000000.0,
      "OtherAssetsCurrent": 1734000000.0,
      "OperatingLeaseAssets": 2617000000.0,
      "FinanceLeaseAssets": 1433000000.0,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 961000000.0,
      "EmployeeLiabilitiesCurrent": 4794000000.0,
      "AccruedLiabilitiesCurrent": 2435000000.0,
      "DeferredRevenueCurrent": 2501000000.0,
      "LongTermDebtCurrent": 103000000.0,
      "OperatingLeaseLiabilitiesCurrent": 179000000.0,
      "FinanceLeaseLiabilitiesCurrent": 147000000.0,
      "OtherLiabilitiesCurrent": 5884000000.0
    },
    "2025": {
      "CashAndCashEquivalents": 14641686038.9561,
      "Inventory": 19755606657.7925,
      "OtherAssetsCurrent": 1829031087.67568,
      "OperatingLeaseAssets": 3261985515.95895,
      "FinanceLeaseAssets": 1571393533.83744,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1124104546.00739,
      "EmployeeLiabilitiesCurrent": 5161762381.71455,
      "AccruedLiabilitiesCurrent": 2382581368.42727,
      "DeferredRevenueCurrent": 2657484909.0129,
      "LongTermDebtCurrent": 623787659.681761,
      "OperatingLeaseLiabilitiesCurrent": 255654298.960117,
      "FinanceLeaseLiabilitiesCurrent": 172144886.168757,
      "OtherLiabilitiesCurrent": 6184294662.77689
    },
    "2026": {
      "CashAndCashEquivalents": 15486230658.4001,
      "Inventory": 20895126468.7146,
      "OtherAssetsCurrent": 1934531120.92202,
      "OperatingLeaseAssets": 3450139551.55824,
      "FinanceLeaseAssets": 1662032818.85561,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1188943830.46529,
      "EmployeeLiabilitiesCurrent": 5459497125.83671,
      "AccruedLiabilitiesCurrent": 2520010641.92345,
      "DeferredRevenueCurrent": 2810770847.20261,
      "LongTermDebtCurrent": 659768250.32263,
      "OperatingLeaseLiabilitiesCurrent": 270400651.39863,
      "FinanceLeaseLiabilitiesCurrent": 182074346.272724,
      "OtherLiabilitiesCurrent": 6541009918.69812
    },
    "2027": {
      "CashAndCashEquivalents": 16370428259.6328,
      "Inventory": 22088148909.6577,
      "OtherAssetsCurrent": 2044984582.08763,
      "OperatingLeaseAssets": 3647127778.2415,
      "FinanceLeaseAssets": 1756927791.30039,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1256827443.08135,
      "EmployeeLiabilitiesCurrent": 5771211084.45475,
      "AccruedLiabilitiesCurrent": 2663892482.10908,
      "DeferredRevenueCurrent": 2971253852.75332,
      "LongTermDebtCurrent": 697438198.366984,
      "OperatingLeaseLiabilitiesCurrent": 285839373.229159,
      "FinanceLeaseLiabilitiesCurrent": 192470013.480033,
      "OtherLiabilitiesCurrent": 6914473636.71497
    },
    "2028": {
      "CashAndCashEquivalents": 17295531364.6918,
      "Inventory": 23336363972.6512,
      "OtherAssetsCurrent": 2160547935.51265,
      "OperatingLeaseAssets": 3853229242.33805,
      "FinanceLeaseAssets": 1856212875.92485,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1327851545.3026,
      "EmployeeLiabilitiesCurrent": 6097345820.18092,
      "AccruedLiabilitiesCurrent": 2814430706.74545,
      "DeferredRevenueCurrent": 3139161260.03101,
      "LongTermDebtCurrent": 736850865.687787,
      "OperatingLeaseLiabilitiesCurrent": 301992334.381338,
      "FinanceLeaseLiabilitiesCurrent": 203346613.913277,
      "OtherLiabilitiesCurrent": 7305214851.89418
    },
    "2029": {
      "CashAndCashEquivalents": 18262792940.2184,
      "Inventory": 24641462249.616,
      "OtherAssetsCurrent": 2281377701.0769,
      "OperatingLeaseAssets": 4068723089.2295,
      "FinanceLeaseAssets": 1960022545.19845,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1402112332.71021,
      "EmployeeLiabilitiesCurrent": 6438343052.36767,
      "AccruedLiabilitiesCurrent": 2971829205.94246,
      "DeferredRevenueCurrent": 3314720484.09789,
      "LongTermDebtCurrent": 778059633.099719,
      "OperatingLeaseLiabilitiesCurrent": 318881412.547909,
      "FinanceLeaseLiabilitiesCurrent": 214718878.922336,
      "OtherLiabilitiesCurrent": 7713762787.09257
    },
    "2030": {
      "CashAndCashEquivalents": 19273463490.641,
      "Inventory": 26005131010.2793,
      "OtherAssetsCurrent": 2407630091.08192,
      "OperatingLeaseAssets": 4293887915.74698,
      "FinanceLeaseAssets": 2068491007.33789,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1479705811.85073,
      "EmployeeLiabilitiesCurrent": 6794643632.34174,
      "AccruedLiabilitiesCurrent": 3136291469.14413,
      "DeferredRevenueCurrent": 3498158493.1213,
      "LongTermDebtCurrent": 821117776.51845,
      "OperatingLeaseLiabilitiesCurrent": 336528442.42961,
      "FinanceLeaseLiabilitiesCurrent": 226601510.908415,
      "OtherLiabilitiesCurrent": 8140645625.1875
    },
    "2031": {
      "CashAndCashEquivalents": 20328787990.8927,
      "Inventory": 27429050063.5791,
      "OtherAssetsCurrent": 2539460627.08785,
      "OperatingLeaseAssets": 4529001086.81884,
      "FinanceLeaseAssets": 2181751877.11638,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1560727564.74788,
      "EmployeeLiabilitiesCurrent": 7166686462.06828,
      "AccruedLiabilitiesCurrent": 3308020086.0025,
      "DeferredRevenueCurrent": 3689701251.65803,
      "LongTermDebtCurrent": 866078336.283585,
      "OperatingLeaseLiabilitiesCurrent": 354955162.17824,
      "FinanceLeaseLiabilitiesCurrent": 239009147.261467,
      "OtherLiabilitiesCurrent": 8586389213.53106
    },
    "2032": {
      "CashAndCashEquivalents": 21430002660.1774,
      "Inventory": 28914887404.5996,
      "OtherAssetsCurrent": 2677023736.89414,
      "OperatingLeaseAssets": 4774338016.70593,
      "FinanceLeaseAssets": 2299937829.61371,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1645272501.21075,
      "EmployeeLiabilitiesCurrent": 7554907356.77824,
      "AccruedLiabilitiesCurrent": 3487216221.3858,
      "DeferredRevenueCurrent": 3889573135.08877,
      "LongTermDebtCurrent": 912993979.709667,
      "OperatingLeaseLiabilitiesCurrent": 374183157.064316,
      "FinanceLeaseLiabilitiesCurrent": 251956322.428794,
      "OtherLiabilitiesCurrent": 9051515701.26678
    },
    "2033": {
      "CashAndCashEquivalents": 22578331579.0346,
      "Inventory": 30464294650.0733,
      "OtherAssetsCurrent": 2820472331.94518,
      "OperatingLeaseAssets": 5030171415.32564,
      "FinanceLeaseAssets": 2423180237.14858,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1733434599.11155,
      "EmployeeLiabilitiesCurrent": 7959737852.3524,
      "AccruedLiabilitiesCurrent": 3674079064.88728,
      "DeferredRevenueCurrent": 4097996315.61092,
      "LongTermDebtCurrent": 961916856.961163,
      "OperatingLeaseLiabilitiesCurrent": 394233800.408597,
      "FinanceLeaseLiabilitiesCurrent": 265457428.141279,
      "OtherLiabilitiesCurrent": 9536542110.45941
    },
    "2034": {
      "CashAndCashEquivalents": 23774983152.7234,
      "Inventory": 32078902266.5272,
      "OtherAssetsCurrent": 2969957365.53828,
      "OperatingLeaseAssets": 5296770500.33789,
      "FinanceLeaseAssets": 2551608789.71745,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1825306632.86446,
      "EmployeeLiabilitiesCurrent": 8381603958.52708,
      "AccruedLiabilitiesCurrent": 3868805255.32631,
      "DeferredRevenueCurrent": 4315190120.3383,
      "LongTermDebtCurrent": 1012898450.3801,
      "OperatingLeaseLiabilitiesCurrent": 415128191.830253,
      "FinanceLeaseLiabilitiesCurrent": 279526671.832767,
      "OtherLiabilitiesCurrent": 10041978842.3137
    },
    "2035": {
      "CashAndCashEquivalents": 25021146424.7474,
      "Inventory": 33760314596.2271,
      "OtherAssetsCurrent": 3125627372.31122,
      "OperatingLeaseAssets": 5574400175.84433,
      "FinanceLeaseAssets": 2685351099.34998,
      "Goodwill": 994000000.0,
      "OtherAssetsNoncurrent": 1920979890.39932,
      "EmployeeLiabilitiesCurrent": 8820924859.26855,
      "AccruedLiabilitiesCurrent": 4071588280.86334,
      "DeferredRevenueCurrent": 4541370362.20109,
      "LongTermDebtCurrent": 1065989417.42918,
      "OperatingLeaseLiabilitiesCurrent": 436887092.878364,
      "FinanceLeaseLiabilitiesCurrent": 294178033.297526,
      "OtherLiabilitiesCurrent": 10568328120.0965
    }
  },
  "cashFlow": {
    "2020": {
      "OperatingCash": 3335220000.0,
      "OperatingWorkingCapital": -6336780000.0,
      "CapitalExpenditures": 2810000000.0
    },
    "2021": {
      "OperatingCash": 3918580000.0,
      "OperatingWorkingCapital": -7099420000.0,
      "CapitalExpenditures": 3588000000.0,
      "FreeCashFlow": 3139159668.98326
    },
    "2022": {
      "OperatingCash": 4539080000.0,
      "OperatingWorkingCapital": -5254920000.0,
      "CapitalExpenditures": 3891000000.0,
      "FreeCashFlow": 1379586968.14996
    },
    "2023": {
      "OperatingCash": 4845800000.0,
      "OperatingWorkingCapital": -6662200000.0,
      "CapitalExpenditures": 4323000000.0,
      "FreeCashFlow": 5717248228.37762
    },
    "2024": {
      "OperatingCash": 5089060000.0,
      "OperatingWorkingCapital": -6843940000.0,
      "CapitalExpenditures": 4710000000.0,
      "FreeCashFlow": 4600584780.63266
    },
    "2025": {
      "OperatingCash": 5385578839.11208,
      "OperatingWorkingCapital": -7659791210.45482,
      "CapitalExpenditures": 4834213328.37636,
      "FreeCashFlow": 4336129206.49885
    },
    "2026": {
      "OperatingCash": 5696223502.51097,
      "OperatingWorkingCapital": -8101614333.53249,
      "CapitalExpenditures": 5113054770.87569,
      "FreeCashFlow": 4895853875.47917
    },
    "2027": {
      "OperatingCash": 6021453525.75577,
      "OperatingWorkingCapital": -8564181895.50644,
      "CapitalExpenditures": 5404988351.29977,
      "FreeCashFlow": 5195115456.87003
    },
    "2028": {
      "OperatingCash": 6361729617.82238,
      "OperatingWorkingCapital": -9048149152.69535,
      "CapitalExpenditures": 5710427612.09935,
      "FreeCashFlow": 5508109738.21094
    },
    "2029": {
      "OperatingCash": 6717512651.22322,
      "OperatingWorkingCapital": -9554171594.01236,
      "CapitalExpenditures": 6029786242.51911,
      "FreeCashFlow": 5835313907.93583
    },
    "2030": {
      "OperatingCash": 7089262592.807,
      "OperatingWorkingCapital": -10082903420.2648,
      "CapitalExpenditures": 6363477118.86022,
      "FreeCashFlow": 6177204997.14222
    },
    "2031": {
      "OperatingCash": 7477437375.53559,
      "OperatingWorkingCapital": -10634995939.5073,
      "CapitalExpenditures": 6711911291.76252,
      "FreeCashFlow": 6534259072.79853
    },
    "2032": {
      "OperatingCash": 7882491711.7944,
      "OperatingWorkingCapital": -11211095879.2389,
      "CapitalExpenditures": 7075496921.00601,
      "FreeCashFlow": 6906950363.24667
    },
    "2033": {
      "OperatingCash": 8304875849.06405,
      "OperatingWorkingCapital": -11811843616.6217,
      "CapitalExpenditures": 7454638158.57451,
      "FreeCashFlow": 7295750317.25819
    },
    "2034": {
      "OperatingCash": 8745034269.06445,
      "OperatingWorkingCapital": -12437871328.3027,
      "CapitalExpenditures": 7849733980.97896,
      "FreeCashFlow": 7701126598.06274
    },
    "2035": {
      "OperatingCash": 9203404331.77684,
      "OperatingWorkingCapital": -13089801061.8351,
      "CapitalExpenditures": 8261176972.10195,
      "FreeCashFlow": 262739521574.44
    }
  },
  "nopat": {
    "2011": {
      "OperatingIncome": 2439000000.0,
      "TaxProvision": -841000000.0
    },
    "2012": {
      "OperatingIncome": 2759000000.0,
      "TaxProvision": -1000000000.0
    },
    "2013": {
      "OperatingIncome": 3053000000.0,
      "TaxProvision": -990000000.0
    },
    "2014": {
      "OperatingIncome": 3220000000.0,
      "TaxProvision": -1109000000.0
    },
    "2015": {
      "OperatingIncome": 3624000000.0,
      "TaxProvision": -1195000000.0
    },
    "2016": {
      "OperatingIncome": 3672000000.0,
      "TaxProvision": -1243000000.0
    },
    "2017": {
      "OperatingIncome": 4111000000.0,
      "TaxProvision": -1325000000.0
    },
    "2018": {
      "OperatingIncome": 4480000000.0,
      "TaxProvision": -1263000000.0
    },
    "2019": {
      "OperatingIncome": 4737000000.0,
      "TaxProvision": -1061000000.0
    },
    "2020": {
      "NetOperatingProfitAfterTaxes": 4251367100.0,
      "OperatingIncome": 5435000000.0,
      "TaxProvision": 1308000000.0,
      "OperatingCash": 3335220000.0,
      "OperatingWorkingCapital": -6336780000.0
    },
    "2021": {
      "NetOperatingProfitAfterTaxes": 5231286400.0,
      "OperatingIncome": 6708000000.0,
      "TaxProvision": 1601000000.0,
      "OperatingCash": 3918580000.0,
      "OperatingWorkingCapital": -7099420000.0
    },
    "2022": {
      "NetOperatingProfitAfterTaxes": 5992187000.0,
      "OperatingIncome": 7793000000.0,
      "TaxProvision": 1925000000.0,
      "OperatingCash": 4539080000.0,
      "OperatingWorkingCapital": -5254920000.0
    },
    "2023": {
      "NetOperatingProfitAfterTaxes": 6051367300.0,
      "OperatingIncome": 8114000000.0,
      "TaxProvision": 2195000000.0,
      "OperatingCash": 4845800000.0,
      "OperatingWorkingCapital": -6662200000.0
    },
    "2024": {
      "NetOperatingProfitAfterTaxes": 7050065700.0,
      "OperatingIncome": 9285000000.0,
      "TaxProvision": 2373000000.0,
      "OperatingCash": 5089060000.0,
      "OperatingWorkingCapital": -6843940000.0
    },
    "2025": {
      "NetOperatingProfitAfterTaxes": 6971179931.67575,
      "OperatingIncome": 9271902568.26126,
      "TaxProvision": -2403107779.41899,
      "OperatingCash": 5385578839.11208,
      "OperatingWorkingCapital": -7659791210.45482
    },
    "2026": {
      "NetOperatingProfitAfterTaxes": 7405465375.1047,
      "OperatingIncome": 9775411416.35762,
      "TaxProvision": -2490204309.61856,
      "OperatingCash": 5696223502.51097,
      "OperatingWorkingCapital": -8101614333.53249
    },
    "2027": {
      "NetOperatingProfitAfterTaxes": 7818139898.09586,
      "OperatingIncome": 10303327505.2176,
      "TaxProvision": -2612356886.15228,
      "OperatingCash": 6021453525.75577,
      "OperatingWorkingCapital": -8564181895.50644
    },
    "2028": {
      "NetOperatingProfitAfterTaxes": 8250398483.08231,
      "OperatingIncome": 10856247756.0358,
      "TaxProvision": -2740252327.38549,
      "OperatingCash": 6361729617.82238,
      "OperatingWorkingCapital": -9048149152.69535
    },
    "2029": {
      "NetOperatingProfitAfterTaxes": 8702732150.16415,
      "OperatingIncome": 11434771147.0819,
      "TaxProvision": -2874008676.22206,
      "OperatingCash": 6717512651.22322,
      "OperatingWorkingCapital": -9554171594.01236
    },
    "2030": {
      "NetOperatingProfitAfterTaxes": 9175632616.26548,
      "OperatingIncome": 12039496244.5686,
      "TaxProvision": -3013742862.0563,
      "OperatingCash": 7089262592.807,
      "OperatingWorkingCapital": -10082903420.2648
    },
    "2031": {
      "NetOperatingProfitAfterTaxes": 9669590415.76295,
      "OperatingIncome": 12671018691.2443,
      "TaxProvision": -3159570044.88191,
      "OperatingCash": 7477437375.53559,
      "OperatingWorkingCapital": -10634995939.5073
    },
    "2032": {
      "NetOperatingProfitAfterTaxes": 10185092983.4643,
      "OperatingIncome": 13329928650.871,
      "TaxProvision": -3311602951.64979,
      "OperatingCash": 7882491711.7944,
      "OperatingWorkingCapital": -11211095879.2389
    },
    "2033": {
      "NetOperatingProfitAfterTaxes": 10722622699.0769,
      "OperatingIncome": 14016808207.55,
      "TaxProvision": -3469951204.70959,
      "OperatingCash": 8304875849.06405,
      "OperatingWorkingCapital": -11811843616.6217
    },
    "2034": {
      "NetOperatingProfitAfterTaxes": 11282654892.8977,
      "OperatingIncome": 14732228719.6497,
      "TaxProvision": -3634720642.37916,
      "OperatingCash": 8745034269.06445,
      "OperatingWorkingCapital": -12437871328.3027
    },
    "2035": {
      "NetOperatingProfitAfterTaxes": 11865655813.0392,
      "OperatingIncome": 15476748128.8722,
      "TaxProvision": -3806012631.89006,
      "OperatingCash": 9203404331.77684,
      "OperatingWorkingCapital": -13089801061.8351
    }
  },
  "analysisData": {
    "averages": {
      "RevenueGrowthRate": {
        "Last1Y_AVG": 5.02001733459903,
        "Last2Y_AVG": 5.88866689760169,
        "Last3Y_AVG": 9.20405050326122,
        "Last4Y_AVG": 11.2757629150746,
        "Last5Y_AVG": 10.8618315261423,
        "Last10Y_AVG": 10.8618315261423,
        "Last15Y_AVG": 10.8618315261423
      },
      "Revenue": {
        "Last1Y_AVG": 254453000000.0,
        "Last2Y_AVG": 248371500000.0,
        "Last3Y_AVG": 241232333333.333,
        "Last4Y_AVG": 229906500000.0,
        "Last5Y_AVG": 217277400000.0,
        "Last10Y_AVG": 180934444444.444,
        "Last15Y_AVG": 180934444444.444
      },
      "CostOfRevenue": {
        "Last1Y_AVG": 222358000000.0,
        "Last2Y_AVG": 217472000000.0,
        "Last3Y_AVG": 211442000000.0,
        "Last4Y_AVG": 201252500000.0,
        "Last5Y_AVG": 189989800000.0,
        "Last10Y_AVG": 53236444444.4444,
        "Last15Y_AVG": 53236444444.4444
      },
      "GrossMargin": {
        "Last1Y_AVG": 32095000000.0,
        "Last2Y_AVG": 30899500000.0,
        "Last3Y_AVG": 29790333333.3333,
        "Last4Y_AVG": 28654000000.0,
        "Last5Y_AVG": 27287600000.0,
        "Last10Y_AVG": 20764000000.0,
        "Last15Y_AVG": 13842666666.6666
      },
      "SellingGeneralAndAdministration": {
        "Last1Y_AVG": 20573000000.0,
        "Last2Y_AVG": 20043000000.0,
        "Last3Y_AVG": 19321666666.6666,
        "Last4Y_AVG": 18680250000.0,
        "Last5Y_AVG": 17892600000.0,
        "Last10Y_AVG": 2413000000.0,
        "Last15Y_AVG": -1528666666.66666
      },
      "Depreciation": {
        "Last1Y_AVG": 2237000000.0,
        "Last2Y_AVG": 2157000000.0,
        "Last3Y_AVG": 2071333333.33333,
        "Last4Y_AVG": 1998750000.0,
        "Last5Y_AVG": 1928000000.0,
        "Last10Y_AVG": 1928000000.0,
        "Last15Y_AVG": 1928000000.0
      },
      "OperatingIncome": {
        "Last1Y_AVG": 9285000000.0,
        "Last2Y_AVG": 8699500000.0,
        "Last3Y_AVG": 8397333333.33333,
        "Last4Y_AVG": 7975000000.0,
        "Last5Y_AVG": 7467000000.0,
        "Last10Y_AVG": 5795900000.0,
        "Last15Y_AVG": 4767133333.33333
      },
      "InterestExpense": {
        "Last1Y_AVG": 169000000.0,
        "Last2Y_AVG": 164500000.0,
        "Last3Y_AVG": 162333333.333333,
        "Last4Y_AVG": 164500000.0,
        "Last5Y_AVG": 163600000.0,
        "Last10Y_AVG": 11800000.0,
        "Last15Y_AVG": -27733333.3333333
      },
      "InterestIncome": {
        "Last1Y_AVG": 533000000.0,
        "Last2Y_AVG": 501500000.0,
        "Last3Y_AVG": 354666666.666666,
        "Last4Y_AVG": 276250000.0,
        "Last5Y_AVG": 238800000.0,
        "Last10Y_AVG": 238800000.0,
        "Last15Y_AVG": 238800000.0
      },
      "OtherIncome": {
        "Last1Y_AVG": 91000000.0,
        "Last2Y_AVG": 77000000.0,
        "Last3Y_AVG": 99333333.3333333,
        "Last4Y_AVG": 100000000.0,
        "Last5Y_AVG": 80600000.0,
        "Last10Y_AVG": 94800000.0,
        "Last15Y_AVG": 92400000.0
      },
      "PretaxIncome": {
        "Last1Y_AVG": 9740000000.0,
        "Last2Y_AVG": 9113500000.0,
        "Last3Y_AVG": 8689000000.0,
        "Last4Y_AVG": 8186750000.0,
        "Last5Y_AVG": 7622800000.0,
        "Last10Y_AVG": 5858300000.0,
        "Last15Y_AVG": 4802333333.33333
      },
      "TaxProvision": {
        "Last1Y_AVG": 2373000000.0,
        "Last2Y_AVG": 2284000000.0,
        "Last3Y_AVG": 2164333333.33333,
        "Last4Y_AVG": 2023500000.0,
        "Last5Y_AVG": 1880400000.0,
        "Last10Y_AVG": 331500000.0,
        "Last15Y_AVG": -90400000.0
      },
      "NetIncomeControlling": {
        "Last1Y_AVG": 7367000000.0,
        "Last2Y_AVG": 6829500000.0,
        "Last3Y_AVG": 6524666666.66666,
        "Last4Y_AVG": 6163250000.0,
        "Last5Y_AVG": 5742400000.0,
        "Last10Y_AVG": 4309400000.0,
        "Last15Y_AVG": 3458333333.33333
      },
      "NetIncomeNoncontrolling": {
        "Last1Y_AVG": 0.0,
        "Last2Y_AVG": 0.0,
        "Last3Y_AVG": 23666666.6666666,
        "Last4Y_AVG": 35750000.0,
        "Last5Y_AVG": 40000000.0,
        "Last10Y_AVG": 38300000.0,
        "Last15Y_AVG": 39533333.3333333
      },
      "NetIncome": {
        "Last1Y_AVG": 7367000000.0,
        "Last2Y_AVG": 6829500000.0,
        "Last3Y_AVG": 6501000000.0,
        "Last4Y_AVG": 6127500000.0,
        "Last5Y_AVG": 5702400000.0,
        "Last10Y_AVG": 4271100000.0,
        "Last15Y_AVG": 3418800000.0
      },
      "OperatingLeaseCost": {
        "Last1Y_AVG": 284000000.0,
        "Last2Y_AVG": 296500000.0,
        "Last3Y_AVG": 296666666.666666,
        "Last4Y_AVG": 296500000.0,
        "Last5Y_AVG": 287600000.0,
        "Last10Y_AVG": 287600000.0,
        "Last15Y_AVG": 287600000.0
      },
      "VariableLeaseCost": {
        "Last1Y_AVG": 163000000.0,
        "Last2Y_AVG": 161500000.0,
        "Last3Y_AVG": 160000000.0,
        "Last4Y_AVG": 157750000.0,
        "Last5Y_AVG": 143600000.0,
        "Last10Y_AVG": 143600000.0,
        "Last15Y_AVG": 143600000.0
      },
      "LeasesDiscountRate": {
        "Last1Y_AVG": 2.67,
        "Last2Y_AVG": 2.57,
        "Last3Y_AVG": 2.46666666666666,
        "Last4Y_AVG": 2.39,
        "Last5Y_AVG": 2.358,
        "Last10Y_AVG": 2.358,
        "Last15Y_AVG": 2.358
      },
      "ForeignCurrencyAdjustment": {
        "Last1Y_AVG": -72000000.0,
        "Last2Y_AVG": -35000000.0,
        "Last3Y_AVG": -47333333.3333333,
        "Last4Y_AVG": 9750000.0,
        "Last5Y_AVG": 40200000.0,
        "Last10Y_AVG": 40200000.0,
        "Last15Y_AVG": 40200000.0
      },
      "Cash": {
        "Last1Y_AVG": 9906000000.0,
        "Last2Y_AVG": 11803000000.0,
        "Last3Y_AVG": 11269666666.6666,
        "Last4Y_AVG": 11266750000.0,
        "Last5Y_AVG": 11468800000.0,
        "Last10Y_AVG": 8450900000.0,
        "Last15Y_AVG": 7042800000.0
      },
      "ShortTermInvestments": {
        "Last1Y_AVG": 1238000000.0,
        "Last2Y_AVG": 1386000000.0,
        "Last3Y_AVG": 1206000000.0,
        "Last4Y_AVG": 1133750000.0,
        "Last5Y_AVG": 1112600000.0,
        "Last10Y_AVG": 1202800000.0,
        "Last15Y_AVG": 1303333333.33333
      },
      "CashAndCashEquivalents": {
        "Last1Y_AVG": 11144000000.0,
        "Last2Y_AVG": 13189000000.0,
        "Last3Y_AVG": 12475666666.6666,
        "Last4Y_AVG": 12400500000.0,
        "Last5Y_AVG": 12581400000.0,
        "Last10Y_AVG": 9653700000.0,
        "Last15Y_AVG": 8346133333.33333
      },
      "ReceivablesCurrent": {
        "Last1Y_AVG": 2721000000.0,
        "Last2Y_AVG": 2503000000.0,
        "Last3Y_AVG": 2415666666.66666,
        "Last4Y_AVG": 2262500000.0,
        "Last5Y_AVG": 2120000000.0,
        "Last10Y_AVG": 1771200000.0,
        "Last15Y_AVG": 1529066666.66666
      },
      "Inventory": {
        "Last1Y_AVG": 18647000000.0,
        "Last2Y_AVG": 17649000000.0,
        "Last3Y_AVG": 17735000000.0,
        "Last4Y_AVG": 16855000000.0,
        "Last5Y_AVG": 15932400000.0,
        "Last10Y_AVG": 12980800000.0,
        "Last15Y_AVG": 11035333333.3333
      },
      "OtherAssetsCurrent": {
        "Last1Y_AVG": 1734000000.0,
        "Last2Y_AVG": 1721500000.0,
        "Last3Y_AVG": 1647333333.33333,
        "Last4Y_AVG": 1563500000.0,
        "Last5Y_AVG": 1455400000.0,
        "Last10Y_AVG": 947700000.0,
        "Last15Y_AVG": 947700000.0
      },
      "AssetsCurrent": {
        "Last1Y_AVG": 34246000000.0,
        "Last2Y_AVG": 35062500000.0,
        "Last3Y_AVG": 34273666666.6666,
        "Last4Y_AVG": 33081500000.0,
        "Last5Y_AVG": 32089200000.0,
        "Last10Y_AVG": 25405400000.0,
        "Last15Y_AVG": 21761466666.6666
      },
      "PropertyPlantAndEquipment": {
        "Last1Y_AVG": 29032000000.0,
        "Last2Y_AVG": 27858000000.0,
        "Last3Y_AVG": 26787333333.3333,
        "Last4Y_AVG": 25963500000.0,
        "Last5Y_AVG": 25132200000.0,
        "Last10Y_AVG": 21683700000.0,
        "Last15Y_AVG": 18817000000.0
      },
      "OperatingLeaseAssets": {
        "Last1Y_AVG": 2617000000.0,
        "Last2Y_AVG": 2665000000.0,
        "Last3Y_AVG": 2701333333.33333,
        "Last4Y_AVG": 2748500000.0,
        "Last5Y_AVG": 2756400000.0,
        "Last10Y_AVG": 2297000000.0,
        "Last15Y_AVG": 2297000000.0
      },
      "FinanceLeaseAssets": {
        "Last1Y_AVG": 1433000000.0,
        "Last2Y_AVG": 1379000000.0,
        "Last3Y_AVG": 1459333333.33333,
        "Last4Y_AVG": 1344500000.0,
        "Last5Y_AVG": 1194000000.0,
        "Last10Y_AVG": 1194000000.0,
        "Last15Y_AVG": 1194000000.0
      },
      "Goodwill": {
        "Last1Y_AVG": 994000000.0,
        "Last2Y_AVG": 994000000.0,
        "Last3Y_AVG": 993666666.666666,
        "Last4Y_AVG": 994250000.0,
        "Last5Y_AVG": 993000000.0,
        "Last10Y_AVG": 993000000.0,
        "Last15Y_AVG": 993000000.0
      },
      "OtherAssetsNoncurrent": {
        "Last1Y_AVG": 961000000.0,
        "Last2Y_AVG": 934500000.0,
        "Last3Y_AVG": 953666666.666666,
        "Last4Y_AVG": 950500000.0,
        "Last5Y_AVG": 931400000.0,
        "Last10Y_AVG": 915000000.0,
        "Last15Y_AVG": 825800000.0
      },
      "AssetsNoncurrent": {
        "Last1Y_AVG": 35585000000.0,
        "Last2Y_AVG": 34350000000.0,
        "Last3Y_AVG": 33390000000.0,
        "Last4Y_AVG": 32483250000.0,
        "Last5Y_AVG": 31473800000.0,
        "Last10Y_AVG": 25303800000.0,
        "Last15Y_AVG": 21446200000.0
      },
      "Assets": {
        "Last1Y_AVG": 69831000000.0,
        "Last2Y_AVG": 69412500000.0,
        "Last3Y_AVG": 67663666666.6666,
        "Last4Y_AVG": 65564750000.0,
        "Last5Y_AVG": 63563000000.0,
        "Last10Y_AVG": 50699500000.0,
        "Last15Y_AVG": 43201200000.0
      },
      "AccountsPayableCurrent": {
        "Last1Y_AVG": 19421000000.0,
        "Last2Y_AVG": 18452000000.0,
        "Last3Y_AVG": 18250666666.6666,
        "Last4Y_AVG": 17757500000.0,
        "Last5Y_AVG": 17040400000.0,
        "Last10Y_AVG": 13434900000.0,
        "Last15Y_AVG": 11367066666.6666
      },
      "EmployeeLiabilitiesCurrent": {
        "Last1Y_AVG": 4794000000.0,
        "Last2Y_AVG": 4536000000.0,
        "Last3Y_AVG": 4484333333.33333,
        "Last4Y_AVG": 4385750000.0,
        "Last5Y_AVG": 4229600000.0,
        "Last10Y_AVG": 3511800000.0,
        "Last15Y_AVG": 2969800000.0
      },
      "AccruedLiabilitiesCurrent": {
        "Last1Y_AVG": 2435000000.0,
        "Last2Y_AVG": 2292500000.0,
        "Last3Y_AVG": 2165333333.33333,
        "Last4Y_AVG": 2041750000.0,
        "Last5Y_AVG": 1912000000.0,
        "Last10Y_AVG": 1912000000.0,
        "Last15Y_AVG": 1912000000.0
      },
      "DeferredRevenueCurrent": {
        "Last1Y_AVG": 2501000000.0,
        "Last2Y_AVG": 2419000000.0,
        "Last3Y_AVG": 2337333333.33333,
        "Last4Y_AVG": 2263500000.0,
        "Last5Y_AVG": 2181000000.0,
        "Last10Y_AVG": 1900000000.0,
        "Last15Y_AVG": 1900000000.0
      },
      "LongTermDebtCurrent": {
        "Last1Y_AVG": 103000000.0,
        "Last2Y_AVG": 592000000.0,
        "Last3Y_AVG": 419000000.0,
        "Last4Y_AVG": 514000000.0,
        "Last5Y_AVG": 430200000.0,
        "Last10Y_AVG": 640900000.0,
        "Last15Y_AVG": 522142857.142857
      },
      "OperatingLeaseLiabilitiesCurrent": {
        "Last1Y_AVG": 179000000.0,
        "Last2Y_AVG": 199500000.0,
        "Last3Y_AVG": 212666666.666666,
        "Last4Y_AVG": 215000000.0,
        "Last5Y_AVG": 218200000.0,
        "Last10Y_AVG": 218200000.0,
        "Last15Y_AVG": 218200000.0
      },
      "FinanceLeaseLiabilitiesCurrent": {
        "Last1Y_AVG": 147000000.0,
        "Last2Y_AVG": 138000000.0,
        "Last3Y_AVG": 173666666.666666,
        "Last4Y_AVG": 148250000.0,
        "Last5Y_AVG": 124800000.0,
        "Last10Y_AVG": 124800000.0,
        "Last15Y_AVG": 124800000.0
      },
      "OtherLiabilitiesCurrent": {
        "Last1Y_AVG": 5884000000.0,
        "Last2Y_AVG": 5894500000.0,
        "Last3Y_AVG": 5638666666.66666,
        "Last4Y_AVG": 5295750000.0,
        "Last5Y_AVG": 4929800000.0,
        "Last10Y_AVG": 3787900000.0,
        "Last15Y_AVG": 2964333333.33333
      },
      "LiabilitiesCurrent": {
        "Last1Y_AVG": 35464000000.0,
        "Last2Y_AVG": 34523500000.0,
        "Last3Y_AVG": 33681666666.6666,
        "Last4Y_AVG": 32621500000.0,
        "Last5Y_AVG": 31066000000.0,
        "Last10Y_AVG": 24810300000.0,
        "Last15Y_AVG": 20676333333.3333
      },
      "LongTermDebtNoncurrent": {
        "Last1Y_AVG": 5794000000.0,
        "Last2Y_AVG": 5585500000.0,
        "Last3Y_AVG": 5885000000.0,
        "Last4Y_AVG": 6086750000.0,
        "Last5Y_AVG": 6372200000.0,
        "Last10Y_AVG": 5897000000.0,
        "Last15Y_AVG": 4922400000.0
      },
      "OperatingLeaseLiabilitiesNoncurrent": {
        "Last1Y_AVG": 2375000000.0,
        "Last2Y_AVG": 2400500000.0,
        "Last3Y_AVG": 2427666666.66666,
        "Last4Y_AVG": 2481250000.0,
        "Last5Y_AVG": 2496600000.0,
        "Last10Y_AVG": 2080500000.0,
        "Last15Y_AVG": 2080500000.0
      },
      "FinanceLeaseLiabilitiesNoncurrent": {
        "Last1Y_AVG": 1351000000.0,
        "Last2Y_AVG": 1327000000.0,
        "Last3Y_AVG": 1345666666.66666,
        "Last4Y_AVG": 1254250000.0,
        "Last5Y_AVG": 1134800000.0,
        "Last10Y_AVG": 1134800000.0,
        "Last15Y_AVG": 1134800000.0
      },
      "DeferredIncomeTaxLiabilitiesNoncurrent": {
        "Last1Y_AVG": 769000000.0,
        "Last2Y_AVG": 782000000.0,
        "Last3Y_AVG": 762666666.666666,
        "Last4Y_AVG": 760500000.0,
        "Last5Y_AVG": 741400000.0,
        "Last10Y_AVG": 741400000.0,
        "Last15Y_AVG": 741400000.0
      },
      "OtherLiabilitiesNoncurrent": {
        "Last1Y_AVG": 456000000.0,
        "Last2Y_AVG": 454000000.0,
        "Last3Y_AVG": 452000000.0,
        "Last4Y_AVG": 509250000.0,
        "Last5Y_AVG": 530000000.0,
        "Last10Y_AVG": 859700000.0,
        "Last15Y_AVG": 859700000.0
      },
      "LiabilitiesNoncurrent": {
        "Last1Y_AVG": 10745000000.0,
        "Last2Y_AVG": 10549000000.0,
        "Last3Y_AVG": 10873000000.0,
        "Last4Y_AVG": 11092000000.0,
        "Last5Y_AVG": 11275000000.0,
        "Last10Y_AVG": 8943100000.0,
        "Last15Y_AVG": 6953133333.33333
      },
      "Liabilities": {
        "Last1Y_AVG": 46209000000.0,
        "Last2Y_AVG": 45072500000.0,
        "Last3Y_AVG": 44554666666.6666,
        "Last4Y_AVG": 43713500000.0,
        "Last5Y_AVG": 42341000000.0,
        "Last10Y_AVG": 33794400000.0,
        "Last15Y_AVG": 27961266666.6666
      },
      "Equity": {
        "Last1Y_AVG": 23622000000.0,
        "Last2Y_AVG": 24340000000.0,
        "Last3Y_AVG": 23107333333.3333,
        "Last4Y_AVG": 21721500000.0,
        "Last5Y_AVG": 21034000000.0,
        "Last10Y_AVG": 16668600000.0,
        "Last15Y_AVG": 15000933333.3333
      },
      "LiabilitiesAndEquity": {
        "Last1Y_AVG": 69831000000.0,
        "Last2Y_AVG": 69412500000.0,
        "Last3Y_AVG": 67662000000.0,
        "Last4Y_AVG": 65435000000.0,
        "Last5Y_AVG": 63375000000.0,
        "Last10Y_AVG": 50463000000.0,
        "Last15Y_AVG": 42962200000.0
      },
      "EBITA_Unadjusted": {
        "Last1Y_AVG": 9285000000.0,
        "Last2Y_AVG": 8699500000.0,
        "Last3Y_AVG": 8397333333.33333,
        "Last4Y_AVG": 7975000000.0,
        "Last5Y_AVG": 7467000000.0,
        "Last15Y_AVG": 7975000000.0
      },
      "OperatingLeaseInterest": {
        "Last1Y_AVG": 68191800.0,
        "Last2Y_AVG": 66774000.0,
        "Last3Y_AVG": 65014200.0,
        "Last4Y_AVG": 64226250.0,
        "Last5Y_AVG": 63819940.0,
        "Last15Y_AVG": 64226250.0
      },
      "VariableLeaseInterest": {
        "Last1Y_AVG": 69873900.0,
        "Last2Y_AVG": 68442500.0,
        "Last3Y_AVG": 66525800.0,
        "Last4Y_AVG": 65500350.0,
        "Last5Y_AVG": 64834760.0,
        "Last15Y_AVG": 65500350.0
      },
      "EBITAAdjusted": {
        "Last1Y_AVG": 9423065700.0,
        "Last2Y_AVG": 8834716500.0,
        "Last3Y_AVG": 8528873333.33333,
        "Last4Y_AVG": 8104726600.0,
        "Last5Y_AVG": 7595654700.0,
        "Last15Y_AVG": 8104726600.0
      },
      "NetOperatingProfitAfterTaxes": {
        "Last1Y_AVG": 7050065700.0,
        "Last2Y_AVG": 6550716500.0,
        "Last3Y_AVG": 6364540000.0,
        "Last4Y_AVG": 6081226600.0,
        "Last5Y_AVG": 5715254700.0,
        "Last15Y_AVG": 6081226600.0
      },
      "OperatingCash": {
        "Last1Y_AVG": 5089060000.0,
        "Last2Y_AVG": 4967430000.0,
        "Last3Y_AVG": 4824646666.66666,
        "Last4Y_AVG": 4598130000.0,
        "Last5Y_AVG": 4345548000.0,
        "Last15Y_AVG": 4598130000.0
      },
      "OperaingAssetsCurrent": {
        "Last1Y_AVG": 28191060000.0,
        "Last2Y_AVG": 26840930000.0,
        "Last3Y_AVG": 26622646666.6666,
        "Last4Y_AVG": 25279130000.0,
        "Last5Y_AVG": 23853348000.0,
        "Last15Y_AVG": 25279130000.0
      },
      "OperaingLiabilitiesCurrent": {
        "Last1Y_AVG": 35035000000.0,
        "Last2Y_AVG": 33594000000.0,
        "Last3Y_AVG": 32876333333.3333,
        "Last4Y_AVG": 31744250000.0,
        "Last5Y_AVG": 30292800000.0,
        "Last15Y_AVG": 31744250000.0
      },
      "OperatingWorkingCapital": {
        "Last1Y_AVG": -6843940000.0,
        "Last2Y_AVG": -6753070000.0,
        "Last3Y_AVG": -6253686666.66666,
        "Last4Y_AVG": -6465120000.0,
        "Last5Y_AVG": -6439452000.0,
        "Last15Y_AVG": -6465120000.0
      },
      "VariableLeaseAssets": {
        "Last1Y_AVG": 1502010563.38028,
        "Last2Y_AVG": 1453400103.69661,
        "Last3Y_AVG": 1457730259.92793,
        "Last4Y_AVG": 1461870330.08108,
        "Last5Y_AVG": 1362001025.96962,
        "Last15Y_AVG": 1461870330.08108
      },
      "OtherAssetsNetOtherLiabilities": {
        "Last1Y_AVG": 505000000.0,
        "Last2Y_AVG": 480500000.0,
        "Last3Y_AVG": 501666666.666666,
        "Last4Y_AVG": 441250000.0,
        "Last5Y_AVG": 401400000.0,
        "Last15Y_AVG": 441250000.0
      },
      "InvestedCapitalExcludingGoodwill": {
        "Last1Y_AVG": 28245070563.3802,
        "Last2Y_AVG": 27082830103.6966,
        "Last3Y_AVG": 26653710259.9279,
        "Last4Y_AVG": 25494500330.081,
        "Last5Y_AVG": 24406549025.9696,
        "Last15Y_AVG": 25494500330.081
      },
      "InvestedCapitalIncludingGoodwill": {
        "Last1Y_AVG": 29239070563.3802,
        "Last2Y_AVG": 28076830103.6966,
        "Last3Y_AVG": 27647376926.5946,
        "Last4Y_AVG": 26488750330.081,
        "Last5Y_AVG": 25399549025.9696,
        "Last15Y_AVG": 26488750330.081
      },
      "ExcessCash": {
        "Last1Y_AVG": 6054940000.0,
        "Last2Y_AVG": 8221570000.0,
        "Last3Y_AVG": 7651020000.0,
        "Last4Y_AVG": 7802370000.0,
        "Last5Y_AVG": 8235852000.0,
        "Last15Y_AVG": 7802370000.0
      },
      "ForeignTaxCreditCarryForward": {
        "Last1Y_AVG": 315000000.0,
        "Last2Y_AVG": 282500000.0,
        "Last3Y_AVG": 255333333.333333,
        "Last4Y_AVG": 228000000.0,
        "Last5Y_AVG": 202600000.0,
        "Last15Y_AVG": 228000000.0
      },
      "TotalFundsInvested": {
        "Last1Y_AVG": 35609010563.3802,
        "Last2Y_AVG": 36580900103.6966,
        "Last3Y_AVG": 35553730259.9279,
        "Last4Y_AVG": 34519120330.081,
        "Last5Y_AVG": 33838001025.9696,
        "Last15Y_AVG": 34519120330.081
      },
      "Debt": {
        "Last1Y_AVG": 5897000000.0,
        "Last2Y_AVG": 6177500000.0,
        "Last3Y_AVG": 6304000000.0,
        "Last4Y_AVG": 6600750000.0,
        "Last5Y_AVG": 6802400000.0,
        "Last15Y_AVG": 6600750000.0
      },
      "OperatingLeaseLiabilities": {
        "Last1Y_AVG": 2554000000.0,
        "Last2Y_AVG": 2600000000.0,
        "Last3Y_AVG": 2640333333.33333,
        "Last4Y_AVG": 2696250000.0,
        "Last5Y_AVG": 2714800000.0,
        "Last15Y_AVG": 2696250000.0
      },
      "VariableLeaseLiabilities": {
        "Last1Y_AVG": 1502010563.38028,
        "Last2Y_AVG": 1453400103.69661,
        "Last3Y_AVG": 1457730259.92793,
        "Last4Y_AVG": 1461870330.08108,
        "Last5Y_AVG": 1362001025.96962,
        "Last15Y_AVG": 1461870330.08108
      },
      "FinanceLeaseLiabilities": {
        "Last1Y_AVG": 1498000000.0,
        "Last2Y_AVG": 1465000000.0,
        "Last3Y_AVG": 1519333333.33333,
        "Last4Y_AVG": 1402500000.0,
        "Last5Y_AVG": 1259600000.0,
        "Last15Y_AVG": 1402500000.0
      },
      "DebtAndDebtEquivalents": {
        "Last1Y_AVG": 11451010563.3802,
        "Last2Y_AVG": 11695900103.6966,
        "Last3Y_AVG": 11921396926.5946,
        "Last4Y_AVG": 12161370330.081,
        "Last5Y_AVG": 12138801025.9696,
        "Last15Y_AVG": 12161370330.081
      },
      "DeferredIncomeTaxesNet": {
        "Last1Y_AVG": -1466000000.0,
        "Last2Y_AVG": -456000000.0,
        "Last3Y_AVG": -144000000.0,
        "Last4Y_AVG": 6000000.0,
        "Last5Y_AVG": 76800000.0,
        "Last15Y_AVG": 6000000.0
      },
      "NoncontrollingInterests": {
        "Last1Y_AVG": 0.0,
        "Last2Y_AVG": 0.0,
        "Last3Y_AVG": 1666666.66666666,
        "Last4Y_AVG": -16750000.0,
        "Last5Y_AVG": 70800000.0,
        "Last15Y_AVG": -16750000.0
      },
      "TotalFundsInvestedValidation": {
        "Last1Y_AVG": 33607010563.3802,
        "Last2Y_AVG": 35579900103.6966,
        "Last3Y_AVG": 34886396926.5946,
        "Last4Y_AVG": 33872120330.081,
        "Last5Y_AVG": 33320401025.9696,
        "Last15Y_AVG": 33872120330.081
      },
      "PPEBeginingOfYear": {
        "Last1Y_AVG": 26684000000.0,
        "Last2Y_AVG": 25665000000.0,
        "Last3Y_AVG": 24940666666.6666,
        "Last4Y_AVG": 24157250000.0,
        "Last5Y_AVG": 23503800000.0,
        "Last15Y_AVG": 24157250000.0
      },
      "CapitalExpenditures": {
        "Last1Y_AVG": 4710000000.0,
        "Last2Y_AVG": 4516500000.0,
        "Last3Y_AVG": 4308000000.0,
        "Last4Y_AVG": 4128000000.0,
        "Last5Y_AVG": 3864400000.0,
        "Last15Y_AVG": 4128000000.0
      },
      "UnexplainedChangesInPPE": {
        "Last1Y_AVG": -125000000.0,
        "Last2Y_AVG": -166500000.0,
        "Last3Y_AVG": -390000000.0,
        "Last4Y_AVG": -323000000.0,
        "Last5Y_AVG": -308000000.0,
        "Last15Y_AVG": -323000000.0
      },
      "PPEEndOfYear": {
        "Last1Y_AVG": 29032000000.0,
        "Last2Y_AVG": 27858000000.0,
        "Last3Y_AVG": 26787333333.3333,
        "Last4Y_AVG": 25963500000.0,
        "Last5Y_AVG": 25132200000.0,
        "Last15Y_AVG": 25963500000.0
      },
      "RevenueAsPercentOfRevenue": {
        "Last1Y_AVG": 1.0,
        "Last2Y_AVG": 1.0,
        "Last3Y_AVG": 1.0,
        "Last4Y_AVG": 1.0,
        "Last10Y_AVG": 1.0,
        "Last15Y_AVG": 1.0
      },
      "CostOfRevenueAsPercentOfRevenue": {
        "Last1Y_AVG": -0.87386668657866,
        "Last2Y_AVG": -0.875634899275958,
        "Last3Y_AVG": -0.876594208313214,
        "Last4Y_AVG": -0.875233732527853,
        "Last10Y_AVG": -0.87386668657866,
        "Last15Y_AVG": -0.875233732527853
      },
      "GrossMarginAsPercentOfRevenue": {
        "Last1Y_AVG": 0.126133313421339,
        "Last2Y_AVG": 0.124365100724041,
        "Last3Y_AVG": 0.123405791686785,
        "Last4Y_AVG": 0.124766267472146,
        "Last10Y_AVG": 0.126133313421339,
        "Last15Y_AVG": 0.124766267472146
      },
      "SGAAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0808518665529587,
        "Last2Y_AVG": -0.0806937941044128,
        "Last3Y_AVG": -0.0800552221953139,
        "Last4Y_AVG": -0.0814216104922152,
        "Last10Y_AVG": -0.0808518665529587,
        "Last15Y_AVG": -0.0814216104922152
      },
      "DepreciationAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0087914074504918,
        "Last2Y_AVG": -0.0086818897007298,
        "Last3Y_AVG": -0.0085785066434591,
        "Last4Y_AVG": -0.0087063868600856,
        "Last10Y_AVG": -0.0087914074504918,
        "Last15Y_AVG": -0.0087063868600856
      },
      "DepreciationAsPercentOfLastYearPPE": {
        "Last1Y_AVG": -0.0838330085444461,
        "Last2Y_AVG": -0.0840531593075229,
        "Last3Y_AVG": -0.0829949718614089,
        "Last4Y_AVG": -0.0826639846625537,
        "Last10Y_AVG": -0.0838330085444461,
        "Last15Y_AVG": -0.0826639846625537
      },
      "OperatingIncomeAsPercentOfRevenue": {
        "Last1Y_AVG": 0.036490039417888503,
        "Last2Y_AVG": 0.0349894169188993,
        "Last3Y_AVG": 0.0347720628480128,
        "Last4Y_AVG": 0.0346382701198456,
        "Last10Y_AVG": 0.036490039417888503,
        "Last15Y_AVG": 0.0346382701198456
      },
      "InterestExpenseAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0006641698073907,
        "Last2Y_AVG": -0.0006622677424423,
        "Last3Y_AVG": -0.0006735706008508,
        "Last4Y_AVG": -0.0007233692342153,
        "Last10Y_AVG": -0.0006641698073907,
        "Last15Y_AVG": -0.0007233692342153
      },
      "InterestIncomeAsPercentOfRevenue": {
        "Last1Y_AVG": 0.00209468939254,
        "Last2Y_AVG": 0.0020172567850892,
        "Last3Y_AVG": 0.0014344301676496,
        "Last4Y_AVG": 0.001128137494899,
        "Last10Y_AVG": 0.00209468939254,
        "Last15Y_AVG": 0.001128137494899
      },
      "OtherIncomeAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0003576298962873,
        "Last2Y_AVG": 0.0003088244409002,
        "Last3Y_AVG": 0.000417379563436,
        "Last4Y_AVG": 0.0004431838592721,
        "Last10Y_AVG": 0.0003576298962873,
        "Last15Y_AVG": 0.0004431838592721
      },
      "PretaxIncomeAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0382781888993252,
        "Last2Y_AVG": 0.0366532304024464,
        "Last3Y_AVG": 0.0359503019782476,
        "Last4Y_AVG": 0.0354862222398014,
        "Last10Y_AVG": 0.0382781888993252,
        "Last15Y_AVG": 0.0354862222398014
      },
      "TaxProvisionAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0093258872954926,
        "Last2Y_AVG": -0.0091926394668061,
        "Last3Y_AVG": -0.0089557246477245,
        "Last4Y_AVG": -0.0087596253279403,
        "Last10Y_AVG": -0.0093258872954926,
        "Last15Y_AVG": -0.0087596253279403
      },
      "TaxProvisionAsPercentOfPretaxIncome": {
        "Last1Y_AVG": -0.243634496919917,
        "Last2Y_AVG": -0.251132672048977,
        "Last3Y_AVG": -0.249267019461223,
        "Last4Y_AVG": -0.246867929266575,
        "Last10Y_AVG": -0.243634496919917,
        "Last15Y_AVG": -0.246867929266575
      },
      "NetIncomeNoncontrollingAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0,
        "Last2Y_AVG": 0.0,
        "Last3Y_AVG": 0.0001042795750093,
        "Last4Y_AVG": 0.0001700796953947,
        "Last10Y_AVG": 0.0,
        "Last15Y_AVG": 0.0001700796953947
      },
      "NetIncomeAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0289523016038325,
        "Last2Y_AVG": 0.0274605909356403,
        "Last3Y_AVG": 0.0268902977555137,
        "Last4Y_AVG": 0.0265565172164664,
        "Last10Y_AVG": 0.0289523016038325,
        "Last15Y_AVG": 0.0265565172164664
      },
      "CapitalExpendituresAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0185102946320145,
        "Last2Y_AVG": 0.0181762748904016,
        "Last3Y_AVG": 0.0178323310493938,
        "Last4Y_AVG": 0.0179524373249111,
        "Last10Y_AVG": 0.0185102946320145,
        "Last15Y_AVG": 0.0179524373249111
      },
      "UnexplainedChangesInPPEAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0004912498575375,
        "Last2Y_AVG": -0.0006748626191398,
        "Last3Y_AVG": -0.001679232416743,
        "Last4Y_AVG": -0.001415092947624,
        "Last10Y_AVG": -0.0004912498575375,
        "Last15Y_AVG": -0.001415092947624
      },
      "InterestExpenseAsPercentOfPriorYearDebt": {
        "Last1Y_AVG": -0.0261690925983276,
        "Last2Y_AVG": -0.0252852478395024,
        "Last3Y_AVG": -0.0238874909060394,
        "Last4Y_AVG": -0.0235339648742332,
        "Last10Y_AVG": -0.0261690925983276,
        "Last15Y_AVG": -0.0235339648742332
      },
      "InterestIncomeAsPercentOfPriorYearExcessCash": {
        "Last1Y_AVG": 0.0513082150901984,
        "Last2Y_AVG": 0.0617528614468369,
        "Last3Y_AVG": 0.0436313043108185,
        "Last4Y_AVG": 0.0337515851722841,
        "Last10Y_AVG": 0.0513082150901984,
        "Last15Y_AVG": 0.0337515851722841
      },
      "DividendAsPercentOfNetIncome": {
        "Last1Y_AVG": 1.22722953712501,
        "Last2Y_AVG": 0.713026720247187,
        "Last3Y_AVG": 0.560794906813206,
        "Last4Y_AVG": 0.707594382626381,
        "Last10Y_AVG": 1.22722953712501,
        "Last15Y_AVG": 0.707594382626381
      },
      "OperatingLeaseCostAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0011161196763252,
        "Last2Y_AVG": 0.0011957254454927,
        "Last3Y_AVG": 0.001233362040344,
        "Last4Y_AVG": 0.0013027093661577,
        "Last10Y_AVG": 0.0011161196763252,
        "Last15Y_AVG": 0.0013027093661577
      },
      "VariableLeaseCostAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0006405898142289,
        "Last2Y_AVG": 0.0006504777458614,
        "Last3Y_AVG": 0.0006642418767216,
        "Last4Y_AVG": 0.0006908532427468,
        "Last10Y_AVG": 0.0006405898142289,
        "Last15Y_AVG": 0.0006908532427468
      },
      "CashAndCashEquivalentsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0437959072991868,
        "Last2Y_AVG": 0.053335487183788,
        "Last3Y_AVG": 0.0517849495442818,
        "Last4Y_AVG": 0.0543736763544253,
        "Last10Y_AVG": 0.0437959072991868,
        "Last15Y_AVG": 0.0543736763544253
      },
      "ReceivablesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0106935268988772,
        "Last2Y_AVG": 0.0100621871152935,
        "Last3Y_AVG": 0.0099995406251614,
        "Last4Y_AVG": 0.0098002337395711,
        "Last10Y_AVG": 0.0106935268988772,
        "Last15Y_AVG": 0.0098002337395711
      },
      "InventoryAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0732826887480202,
        "Last2Y_AVG": 0.0710030596738574,
        "Last3Y_AVG": 0.0736358569143839,
        "Last4Y_AVG": 0.0733648406159055,
        "Last10Y_AVG": 0.0732826887480202,
        "Last15Y_AVG": 0.0733648406159055
      },
      "OtherAssetsCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0068146180237607,
        "Last2Y_AVG": 0.0069340744582463,
        "Last3Y_AVG": 0.006824337191962,
        "Last4Y_AVG": 0.0067923287071487,
        "Last10Y_AVG": 0.0068146180237607,
        "Last15Y_AVG": 0.0067923287071487
      },
      "AssetsCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.134586740969845,
        "Last2Y_AVG": 0.141334808431185,
        "Last3Y_AVG": 0.142244684275789,
        "Last4Y_AVG": 0.14433107941705,
        "Last10Y_AVG": 0.134586740969845,
        "Last15Y_AVG": 0.14433107941705
      },
      "PropertyPlantAndEquipmentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.114095726912239,
        "Last2Y_AVG": 0.112114106388143,
        "Last3Y_AVG": 0.110940968658008,
        "Last4Y_AVG": 0.113180870550792,
        "Last10Y_AVG": 0.114095726912239,
        "Last15Y_AVG": 0.113180870550792
      },
      "OperatingLeaseAssetsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0102848070174059,
        "Last2Y_AVG": 0.010741066268206,
        "Last3Y_AVG": 0.0112349579028773,
        "Last4Y_AVG": 0.0121137787168547,
        "Last10Y_AVG": 0.0102848070174059,
        "Last15Y_AVG": 0.0121137787168547
      },
      "FinanceLeaseAssetsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0056316883668103,
        "Last2Y_AVG": 0.0055501708167784,
        "Last3Y_AVG": 0.0060794506597552,
        "Last4Y_AVG": 0.0058355604133966,
        "Last10Y_AVG": 0.0056316883668103,
        "Last15Y_AVG": 0.0058355604133966
      },
      "GoodwillAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0039064188671385,
        "Last2Y_AVG": 0.0040044703192847,
        "Last3Y_AVG": 0.0041280922032451,
        "Last4Y_AVG": 0.0043669376813397,
        "Last10Y_AVG": 0.0039064188671385,
        "Last15Y_AVG": 0.0043669376813397
      },
      "OtherAssetsNoncurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0037767289047486,
        "Last2Y_AVG": 0.0037621520622632,
        "Last3Y_AVG": 0.0039650779721555,
        "Last4Y_AVG": 0.0041744985250006,
        "Last10Y_AVG": 0.0037767289047486,
        "Last15Y_AVG": 0.0041744985250006
      },
      "AssetsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.274435750413632,
        "Last2Y_AVG": 0.279596842559988,
        "Last3Y_AVG": 0.280640193773068,
        "Last4Y_AVG": 0.286104478634212,
        "Last10Y_AVG": 0.274435750413632,
        "Last15Y_AVG": 0.286104478634212
      },
      "AccountsPayableCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0763245078658927,
        "Last2Y_AVG": 0.0742409199942778,
        "Last3Y_AVG": 0.0757077756032245,
        "Last4Y_AVG": 0.0775511107320668,
        "Last10Y_AVG": 0.0763245078658927,
        "Last15Y_AVG": 0.0775511107320668
      },
      "EmployeeLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0188404145362797,
        "Last2Y_AVG": 0.0182484709191366,
        "Last3Y_AVG": 0.0186001376754224,
        "Last4Y_AVG": 0.0191688304485598,
        "Last10Y_AVG": 0.0188404145362797,
        "Last15Y_AVG": 0.0191688304485598
      },
      "AccruedLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0095695472248313,
        "Last2Y_AVG": 0.0092216055080778,
        "Last3Y_AVG": 0.0089544731721855,
        "Last4Y_AVG": 0.0088480047905866,
        "Last10Y_AVG": 0.0095695472248313,
        "Last15Y_AVG": 0.0088480047905866
      },
      "DeferredRevenueCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0098289271496111,
        "Last2Y_AVG": 0.0097371966632532,
        "Last3Y_AVG": 0.0096844756544262,
        "Last4Y_AVG": 0.0098688924195604,
        "Last10Y_AVG": 0.0098289271496111,
        "Last15Y_AVG": 0.0098688924195604
      },
      "LongTermDebtCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0004047898826109,
        "Last2Y_AVG": 0.0024331927455895,
        "Last3Y_AVG": 0.0017293455248862,
        "Last4Y_AVG": 0.0023165111061102,
        "Last10Y_AVG": 0.0004047898826109,
        "Last15Y_AVG": 0.0023165111061102
      },
      "OperatingLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0007034697959937,
        "Last2Y_AVG": 0.0008057363012739,
        "Last3Y_AVG": 0.0008881831458337,
        "Last4Y_AVG": 0.0009494032363001,
        "Last10Y_AVG": 0.0007034697959937,
        "Last15Y_AVG": 0.0009494032363001
      },
      "FinanceLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0005777098324641,
        "Last2Y_AVG": 0.0005550648299718,
        "Last3Y_AVG": 0.0007298811900838,
        "Last4Y_AVG": 0.0006392809067006,
        "Last10Y_AVG": 0.0005777098324641,
        "Last15Y_AVG": 0.0006392809067006
      },
      "OtherLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0231241132940071,
        "Last2Y_AVG": 0.0237478670395084,
        "Last3Y_AVG": 0.0233620716564725,
        "Last4Y_AVG": 0.022966128052436,
        "Last10Y_AVG": 0.0231241132940071,
        "Last15Y_AVG": 0.022966128052436
      },
      "LiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.13937347958169,
        "Last2Y_AVG": 0.138990054001089,
        "Last3Y_AVG": 0.139656343622535,
        "Last4Y_AVG": 0.14230816169232,
        "Last10Y_AVG": 0.13937347958169,
        "Last15Y_AVG": 0.14230816169232
      },
      "LongTermDebtNoncurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0227704133965801,
        "Last2Y_AVG": 0.0224814137229299,
        "Last3Y_AVG": 0.024510831181866,
        "Last4Y_AVG": 0.0269219308115382,
        "Last10Y_AVG": 0.0227704133965801,
        "Last15Y_AVG": 0.0269219308115382
      },
      "OperatingLeaseLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0093337472932132,
        "Last2Y_AVG": 0.0096732709391073,
        "Last3Y_AVG": 0.0100942262388389,
        "Last4Y_AVG": 0.010941788809018,
        "Last10Y_AVG": 0.0093337472932132,
        "Last15Y_AVG": 0.010941788809018
      },
      "FinanceLeaseLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0053094284602657,
        "Last2Y_AVG": 0.0053436407231783,
        "Last3Y_AVG": 0.0055936757718545,
        "Last4Y_AVG": 0.0054457097990995,
        "Last10Y_AVG": 0.0053094284602657,
        "Last15Y_AVG": 0.0054457097990995
      },
      "DeferredIncomeTaxLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0030221691235709,
        "Last2Y_AVG": 0.0031516805418094,
        "Last3Y_AVG": 0.0031644782810196,
        "Last4Y_AVG": 0.0033354419143742,
        "Last10Y_AVG": 0.0030221691235709,
        "Last15Y_AVG": 0.0033354419143742
      },
      "OtherLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0017920794802969,
        "Last2Y_AVG": 0.0018288062596086,
        "Last3Y_AVG": 0.0018771936041171,
        "Last4Y_AVG": 0.002276832420141,
        "Last10Y_AVG": 0.0017920794802969,
        "Last15Y_AVG": 0.002276832420141
      },
      "LiabilitiesAsPercentOfRevenue": {
        "Last1Y_AVG": 0.181601317335617,
        "Last2Y_AVG": 0.181468866187723,
        "Last3Y_AVG": 0.184896748700231,
        "Last4Y_AVG": 0.191229865446492,
        "Last10Y_AVG": 0.181601317335617,
        "Last15Y_AVG": 0.191229865446492
      },
      "EquityAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0928344330780144,
        "Last2Y_AVG": 0.0981279763722648,
        "Last3Y_AVG": 0.0957361014407941,
        "Last4Y_AVG": 0.0942132556405382,
        "Last10Y_AVG": 0.0928344330780144,
        "Last15Y_AVG": 0.0942132556405382
      },
      "VariableLeaseAssetsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0059028998022435,
        "Last2Y_AVG": 0.0058504338542625,
        "Last3Y_AVG": 0.0060540157951408,
        "Last4Y_AVG": 0.006421665913059,
        "Last10Y_AVG": 0.0059028998022435,
        "Last15Y_AVG": 0.006421665913059
      },
      "ForeignTaxCreditCarryForwardAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0012379496409946,
        "Last2Y_AVG": 0.0011348855060394,
        "Last3Y_AVG": 0.0010518043454846,
        "Last4Y_AVG": 0.0009751452322261,
        "Last10Y_AVG": 0.0012379496409946,
        "Last15Y_AVG": 0.0009751452322261
      },
      "DeferredIncomeTaxesNetAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0057613783292002,
        "Last2Y_AVG": -0.0017374310854388,
        "Last3Y_AVG": -0.0004532987141731,
        "Last4Y_AVG": 0.0002418693872427,
        "Last10Y_AVG": -0.0057613783292002,
        "Last15Y_AVG": 0.0002418693872427
      },
      "NoncontrollingInterestsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0,
        "Last2Y_AVG": 0.0,
        "Last3Y_AVG": 7.34363204291031e-06,
        "Last4Y_AVG": -8.63622901055916e-05,
        "Last10Y_AVG": 0.0,
        "Last15Y_AVG": -8.63622901055916e-05
      },
      "DaysCashAsPercentOfRevenue": {
        "Last1Y_AVG": 15.9855061642032,
        "Last2Y_AVG": 19.4674528220826,
        "Last3Y_AVG": 18.9015065836628,
        "Last4Y_AVG": 19.8463918693652,
        "Last10Y_AVG": 15.9855061642032,
        "Last15Y_AVG": 19.8463918693652
      },
      "DaysReceivablesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 3.90313731809017,
        "Last2Y_AVG": 3.67269829708215,
        "Last3Y_AVG": 3.64983232818392,
        "Last4Y_AVG": 3.57708531494348,
        "Last10Y_AVG": 3.90313731809017,
        "Last15Y_AVG": 3.57708531494348
      },
      "DaysInventoryAsPercentOfRevenue": {
        "Last1Y_AVG": 26.7481813930274,
        "Last2Y_AVG": 25.9161167809579,
        "Last3Y_AVG": 26.8770877737501,
        "Last4Y_AVG": 26.7781668248055,
        "Last10Y_AVG": 26.7481813930274,
        "Last15Y_AVG": 26.7781668248055
      },
      "DaysOtherAssetsCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 2.48733557867268,
        "Last2Y_AVG": 2.5309371772599,
        "Last3Y_AVG": 2.49088307506614,
        "Last4Y_AVG": 2.47919997810929,
        "Last10Y_AVG": 2.48733557867268,
        "Last15Y_AVG": 2.47919997810929
      },
      "DaysAssetsCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 49.1241604539934,
        "Last2Y_AVG": 51.5872050773826,
        "Last3Y_AVG": 51.9193097606631,
        "Last4Y_AVG": 52.6808439872235,
        "Last10Y_AVG": 49.1241604539934,
        "Last15Y_AVG": 52.6808439872235
      },
      "DaysAccountsPayableCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 27.8584453710508,
        "Last2Y_AVG": 27.0979357979114,
        "Last3Y_AVG": 27.6333380951769,
        "Last4Y_AVG": 28.3061554172044,
        "Last10Y_AVG": 27.8584453710508,
        "Last15Y_AVG": 28.3061554172044
      },
      "DaysEmployeeLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 6.87675130574212,
        "Last2Y_AVG": 6.66069188548487,
        "Last3Y_AVG": 6.78905025152918,
        "Last4Y_AVG": 6.99662311372434,
        "Last10Y_AVG": 6.87675130574212,
        "Last15Y_AVG": 6.99662311372434
      },
      "DaysAccruedLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 3.49288473706342,
        "Last2Y_AVG": 3.36588601044842,
        "Last3Y_AVG": 3.26838270784773,
        "Last4Y_AVG": 3.22952174856414,
        "Last10Y_AVG": 3.49288473706342,
        "Last15Y_AVG": 3.22952174856414
      },
      "DaysDeferredRevenueCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 3.58755840960806,
        "Last2Y_AVG": 3.55407678208745,
        "Last3Y_AVG": 3.53483361386558,
        "Last4Y_AVG": 3.60214573313957,
        "Last10Y_AVG": 3.58755840960806,
        "Last15Y_AVG": 3.60214573313957
      },
      "DaysLongTermDebtCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.14774830715299,
        "Last2Y_AVG": 0.8881153521402,
        "Last3Y_AVG": 0.631211116583469,
        "Last4Y_AVG": 0.845526553730238,
        "Last10Y_AVG": 0.14774830715299,
        "Last15Y_AVG": 0.845526553730238
      },
      "DaysOperatingLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.256766475537722,
        "Last2Y_AVG": 0.294093749964989,
        "Last3Y_AVG": 0.324186848229316,
        "Last4Y_AVG": 0.34653218124954,
        "Last10Y_AVG": 0.256766475537722,
        "Last15Y_AVG": 0.34653218124954
      },
      "DaysFinanceLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 0.210864088849414,
        "Last2Y_AVG": 0.202598662939709,
        "Last3Y_AVG": 0.26640663438059,
        "Last4Y_AVG": 0.23333753094573,
        "Last10Y_AVG": 0.210864088849414,
        "Last15Y_AVG": 0.23333753094573
      },
      "DaysOtherLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 8.4403013523126,
        "Last2Y_AVG": 8.66797146942057,
        "Last3Y_AVG": 8.52715615461246,
        "Last4Y_AVG": 8.38263673913917,
        "Last10Y_AVG": 8.4403013523126,
        "Last15Y_AVG": 8.38263673913917
      },
      "DaysLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_AVG": 50.8713200473171,
        "Last2Y_AVG": 50.7313697103976,
        "Last3Y_AVG": 50.9745654222253,
        "Last4Y_AVG": 51.9424790176971,
        "Last10Y_AVG": 50.8713200473171,
        "Last15Y_AVG": 51.9424790176971
      },
      "SellingGeneralAndAdministrationAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0808518665529587,
        "Last2Y_AVG": -0.0806937941044128,
        "Last3Y_AVG": -0.0800552221953139,
        "Last4Y_AVG": -0.0814216104922152,
        "Last10Y_AVG": -0.0808518665529587,
        "Last15Y_AVG": -0.0814216104922152
      },
      "OperatingProfitAsPercentOfRevenue": {
        "Last1Y_AVG": 0.036490039417888503,
        "Last2Y_AVG": 0.0349894169188993,
        "Last3Y_AVG": 0.0347720628480128,
        "Last4Y_AVG": 0.0346382701198456,
        "Last10Y_AVG": 0.036490039417888503,
        "Last15Y_AVG": 0.0346382701198456
      },
      "WorkingCapitalAsPercentOfRevenue": {
        "Last1Y_AVG": -0.0268966763999638,
        "Last2Y_AVG": -0.0271967388768567,
        "Last3Y_AVG": -0.0258491990302238,
        "Last4Y_AVG": -0.0284455633805845,
        "Last10Y_AVG": -0.0268966763999638,
        "Last15Y_AVG": -0.0284455633805845
      },
      "FixedAssetsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.135915122098699,
        "Last2Y_AVG": 0.13425577732739,
        "Last3Y_AVG": 0.134309393015782,
        "Last4Y_AVG": 0.137551875594103,
        "Last10Y_AVG": 0.135915122098699,
        "Last15Y_AVG": 0.137551875594103
      },
      "OtherAssetsAsPercentOfRevenue": {
        "Last1Y_AVG": 0.0019846494244516,
        "Last2Y_AVG": 0.0019333458026546,
        "Last3Y_AVG": 0.0020878843680384,
        "Last4Y_AVG": 0.0018976661048596,
        "Last10Y_AVG": 0.0019846494244516,
        "Last15Y_AVG": 0.0018976661048596
      },
      "PretaxReturnOnInvestedCapital": {
        "Last1Y_AVG": 0.32872992755196,
        "Last2Y_AVG": 0.320881464971278,
        "Last3Y_AVG": 0.314623410409165,
        "Last4Y_AVG": 0.312136420993496,
        "Last10Y_AVG": 0.32872992755196,
        "Last15Y_AVG": 0.312136420993496
      },
      "ReturnOnInvestedCapitalExcludingGoodwill": {
        "Last1Y_AVG": 0.26031495501047,
        "Last2Y_AVG": 0.247168852205441,
        "Last3Y_AVG": 0.248330703741276,
        "Last4Y_AVG": 0.248419238500086,
        "Last10Y_AVG": 0.26031495501047,
        "Last15Y_AVG": 0.248419238500086
      },
      "GoodwillAsPercentOfInvestedCapital": {
        "Last1Y_AVG": 0.0367022204176632,
        "Last2Y_AVG": 0.0375714451655288,
        "Last3Y_AVG": 0.0388934277557006,
        "Last4Y_AVG": 0.0410070304317858,
        "Last10Y_AVG": 0.0367022204176632,
        "Last15Y_AVG": 0.0410070304317858
      },
      "ReturnOnInvestedCapitalIncludingGoodwill": {
        "Last1Y_AVG": 0.251099061894162,
        "Last2Y_AVG": 0.238231513605336,
        "Last3Y_AVG": 0.239035542334993,
        "Last4Y_AVG": 0.238648049900281,
        "Last10Y_AVG": 0.251099061894162,
        "Last15Y_AVG": 0.238648049900281
      },
      "AdjustedEBITDA": {
        "Last1Y_AVG": 7186065700.0,
        "Last2Y_AVG": 6677716500.0,
        "Last3Y_AVG": 6457540000.0,
        "Last4Y_AVG": 6105976600.0,
        "Last10Y_AVG": 7186065700.0,
        "Last15Y_AVG": 6105976600.0
      },
      "EBITAToInterest": {
        "Last1Y_AVG": -304.615449517202,
        "Last2Y_AVG": -301.52165065075,
        "Last3Y_AVG": -279.063182276123,
        "Last4Y_AVG": -245.862147290734,
        "Last10Y_AVG": -304.615449517202,
        "Last15Y_AVG": -245.862147290734
      },
      "EBITDAToInterest": {
        "Last1Y_AVG": -232.300899002078,
        "Last2Y_AVG": -227.78209063636,
        "Last3Y_AVG": -211.173007042405,
        "Last4Y_AVG": -185.413030387982,
        "Last10Y_AVG": -232.300899002078,
        "Last15Y_AVG": -185.413030387982
      },
      "DebtToEBITA": {
        "Last1Y_AVG": 0.625804826978973,
        "Last2Y_AVG": 0.704468770229381,
        "Last3Y_AVG": 0.745711912540488,
        "Last4Y_AVG": 0.833386905264433,
        "Last10Y_AVG": 0.625804826978973,
        "Last15Y_AVG": 0.833386905264433
      },
      "DebtToEBITDA": {
        "Last1Y_AVG": 0.820615931746908,
        "Last2Y_AVG": 0.933700372741497,
        "Last3Y_AVG": 0.985704199737107,
        "Last4Y_AVG": 1.11002529255046,
        "Last10Y_AVG": 0.820615931746908,
        "Last15Y_AVG": 1.11002529255046
      },
      "DebtToEquity": {
        "Last1Y_AVG": 0.249640165946998,
        "Last2Y_AVG": 0.253681125355173,
        "Last3Y_AVG": 0.275005192958741,
        "Last4Y_AVG": 0.312878239970706,
        "Last10Y_AVG": 0.249640165946998,
        "Last15Y_AVG": 0.312878239970706
      },
      "GrossCashFlow": {
        "Last1Y_AVG": 9287065700.0,
        "Last2Y_AVG": 8707716500.0,
        "Last3Y_AVG": 8435873333.33333,
        "Last4Y_AVG": 8079976600.0,
        "Last10Y_AVG": 9287065700.0,
        "Last15Y_AVG": 8079976600.0
      },
      "DecreaseInWorkingCapital": {
        "Last1Y_AVG": 181740000.0,
        "Last2Y_AVG": 794510000.0,
        "Last3Y_AVG": -85160000.0,
        "Last4Y_AVG": 126790000.0,
        "Last10Y_AVG": 181740000.0,
        "Last15Y_AVG": 126790000.0
      },
      "DecreaseInOperatingLeases": {
        "Last1Y_AVG": 96000000.0,
        "Last2Y_AVG": 78500000.0,
        "Last3Y_AVG": 91000000.0,
        "Last4Y_AVG": 42750000.0,
        "Last10Y_AVG": 96000000.0,
        "Last15Y_AVG": 42750000.0
      },
      "DecreaseInVariableLeases": {
        "Last1Y_AVG": -97220919.3673367,
        "Last2Y_AVG": -17809995.4948545,
        "Last3Y_AVG": -9240007.61324707,
        "Last4Y_AVG": -134871688.464118,
        "Last10Y_AVG": -97220919.3673367,
        "Last15Y_AVG": -134871688.464118
      },
      "DecreaseInFinanceLeases": {
        "Last1Y_AVG": -108000000.0,
        "Last2Y_AVG": 93500000.0,
        "Last3Y_AVG": -144333333.333333,
        "Last4Y_AVG": -210250000.0,
        "Last10Y_AVG": -108000000.0,
        "Last15Y_AVG": -210250000.0
      },
      "DecreaseInGoodwill": {
        "Last1Y_AVG": 0.0,
        "Last2Y_AVG": -500000.0,
        "Last3Y_AVG": 666666.666666666,
        "Last4Y_AVG": -1500000.0,
        "Last10Y_AVG": 0.0,
        "Last15Y_AVG": -1500000.0
      },
      "DecreaseInOtherAssetsNetOfOtherLiabilities": {
        "Last1Y_AVG": -49000000.0,
        "Last2Y_AVG": 19500000.0,
        "Last3Y_AVG": -81666666.6666666,
        "Last4Y_AVG": -65750000.0,
        "Last10Y_AVG": -49000000.0,
        "Last15Y_AVG": -65750000.0
      },
      "FreeCashFlow": {
        "Last1Y_AVG": 4600584780.63266,
        "Last2Y_AVG": 5158916504.50514,
        "Last3Y_AVG": 3899139992.38675,
        "Last4Y_AVG": 3709144911.53588,
        "Last10Y_AVG": 4600584780.63266,
        "Last15Y_AVG": 3709144911.53588
      },
      "TaxesNonoperating": {
        "Last1Y_AVG": 0.0,
        "Last2Y_AVG": 0.0,
        "Last3Y_AVG": 0.0,
        "Last4Y_AVG": 0.0,
        "Last10Y_AVG": 0.0,
        "Last15Y_AVG": 0.0
      },
      "DecreaseInExcessCash": {
        "Last1Y_AVG": -4333260000.0,
        "Last2Y_AVG": -227490000.0,
        "Last3Y_AVG": -733826666.666666,
        "Last4Y_AVG": -978710000.0,
        "Last10Y_AVG": -4333260000.0,
        "Last15Y_AVG": -978710000.0
      },
      "DecreaseInForeignTaxCreditCarryForward": {
        "Last1Y_AVG": -65000000.0,
        "Last2Y_AVG": -57000000.0,
        "Last3Y_AVG": -56333333.3333333,
        "Last4Y_AVG": -53500000.0,
        "Last10Y_AVG": -65000000.0,
        "Last15Y_AVG": -53500000.0
      },
      "CashFlowToInvestors": {
        "Last1Y_AVG": 879324780.632663,
        "Last2Y_AVG": 5584426504.50514,
        "Last3Y_AVG": 3905646659.05341,
        "Last4Y_AVG": 3385934911.53588,
        "Last10Y_AVG": 879324780.632663,
        "Last15Y_AVG": 3385934911.53588
      }
    },
    "cagr": {
      "RevenueGrowthRate": {
        "Last1Y_CAGR": -0.257098973554649,
        "Last2Y_CAGR": -0.436951151968006,
        "Last3Y_CAGR": -0.340374121755766,
        "Last4Y_CAGR": -0.140675267032557
      },
      "Revenue": {
        "Last1Y_CAGR": 0.0502001733459902,
        "Last2Y_CAGR": 0.0588510388760046,
        "Last3Y_CAGR": 0.0910289751053341,
        "Last4Y_CAGR": 0.111420162648683,
        "Last5Y_CAGR": 0.107521080359638
      },
      "CostOfRevenue": {
        "Last1Y_CAGR": 0.0459672791246836,
        "Last2Y_CAGR": 0.0560473850569445,
        "Last3Y_CAGR": 0.0921609617195566,
        "Last4Y_CAGR": 0.112927502152588
      },
      "GrossMargin": {
        "Last1Y_CAGR": 0.0804942095340695,
        "Last2Y_CAGR": 0.0789083521155151,
        "Last3Y_CAGR": 0.0833131168725047,
        "Last4Y_CAGR": 0.101249456659304,
        "Last5Y_CAGR": 0.101234716570343
      },
      "SellingGeneralAndAdministration": {
        "Last1Y_CAGR": 0.0543227591861836,
        "Last2Y_CAGR": 0.0726973329921691,
        "Last3Y_CAGR": 0.0708017973090133,
        "Last4Y_CAGR": 0.0868892787019881
      },
      "Depreciation": {
        "Last1Y_CAGR": 0.0770341839191142,
        "Last2Y_CAGR": 0.0850660906380917,
        "Last3Y_CAGR": 0.078948431999952,
        "Last4Y_CAGR": 0.0798788129111853
      },
      "OperatingIncome": {
        "Last1Y_CAGR": 0.144318461917673,
        "Last2Y_CAGR": 0.0915373877502621,
        "Last3Y_CAGR": 0.114456063305613,
        "Last4Y_CAGR": 0.143261529736499,
        "Last5Y_CAGR": 0.144078185021564,
        "Last10Y_CAGR": 0.111712793814489,
        "Last15Y_CAGR": 0.11653660402243
      },
      "InterestExpense": {
        "Last1Y_CAGR": 0.0562499999999999,
        "Last2Y_CAGR": 0.034224469428449,
        "Last3Y_CAGR": -0.0039139343741682,
        "Last4Y_CAGR": 0.0137752411430864
      },
      "InterestIncome": {
        "Last1Y_CAGR": 0.134042553191489,
        "Last2Y_CAGR": 1.9559609128053,
        "Last3Y_CAGR": 1.35133468772075,
        "Last4Y_CAGR": 0.564351347461637
      },
      "OtherIncome": {
        "Last1Y_CAGR": 0.444444444444444,
        "Last2Y_CAGR": -0.205050665485878,
        "Last3Y_CAGR": -0.037323419052587,
        "Last4Y_CAGR": 1.3468213709795,
        "Last5Y_CAGR": -0.125571552363106,
        "Last10Y_CAGR": 0.0011055943379814,
        "Last15Y_CAGR": 0.0304831463614869
      },
      "PretaxIncome": {
        "Last1Y_CAGR": 0.147637563332155,
        "Last2Y_CAGR": 0.114606181023373,
        "Last3Y_CAGR": 0.133950677436177,
        "Last4Y_CAGR": 0.160664871623991,
        "Last5Y_CAGR": 0.153716783178891,
        "Last10Y_CAGR": 0.11784511185781,
        "Last15Y_CAGR": 0.122236633206101
      },
      "TaxProvision": {
        "Last1Y_CAGR": 0.0810933940774487,
        "Last2Y_CAGR": 0.110282519328874,
        "Last3Y_CAGR": 0.140167879723553,
        "Last4Y_CAGR": 0.160573095665972
      },
      "NetIncomeControlling": {
        "Last1Y_CAGR": 0.17085187539733,
        "Last2Y_CAGR": 0.116009677074421,
        "Last3Y_CAGR": 0.131976694827132,
        "Last4Y_CAGR": 0.160694441500562,
        "Last5Y_CAGR": 0.147424023362666,
        "Last10Y_CAGR": 0.134373356628668,
        "Last15Y_CAGR": 0.135236114262463
      },
      "NetIncomeNoncontrolling": {
        "Last2Y_CAGR": -1.0,
        "Last3Y_CAGR": -1.0,
        "Last4Y_CAGR": -1.0,
        "Last5Y_CAGR": -1.0,
        "Last10Y_CAGR": -1.0,
        "Last15Y_CAGR": -1.0
      },
      "NetIncome": {
        "Last1Y_CAGR": 0.17085187539733,
        "Last2Y_CAGR": 0.122768529929538,
        "Last3Y_CAGR": 0.137376784644651,
        "Last4Y_CAGR": 0.164805456430436,
        "Last5Y_CAGR": 0.150232546560159,
        "Last10Y_CAGR": 0.136016213936899,
        "Last15Y_CAGR": 0.136137050891567
      },
      "OperatingLeaseCost": {
        "Last1Y_CAGR": -0.0809061488673139,
        "Last2Y_CAGR": -0.0221303991692163,
        "Last3Y_CAGR": -0.0137003560858915,
        "Last4Y_CAGR": 0.030337365221609
      },
      "VariableLeaseCost": {
        "Last1Y_CAGR": 0.01875,
        "Last2Y_CAGR": 0.0189291243798825,
        "Last3Y_CAGR": 0.0258177725057642,
        "Last4Y_CAGR": 0.169949424015368
      },
      "LeasesDiscountRate": {
        "Last1Y_CAGR": 0.0809716599190282,
        "Last2Y_CAGR": 0.0869295879694966,
        "Last3Y_CAGR": 0.0732127826064847,
        "Last4Y_CAGR": 0.0460479665723188
      },
      "ForeignCurrencyAdjustment": {
        "Last1Y_CAGR": -37.0
      },
      "Cash": {
        "Last1Y_CAGR": -0.276934306569343,
        "Last2Y_CAGR": -0.0146620303485051,
        "Last3Y_CAGR": -0.041749561987457,
        "Last4Y_CAGR": -0.0522331442798221,
        "Last5Y_CAGR": 0.0339258909450028,
        "Last10Y_CAGR": 0.0561212424932806,
        "Last15Y_CAGR": 0.0792156870716007
      },
      "ShortTermInvestments": {
        "Last1Y_CAGR": -0.192959582790091,
        "Last2Y_CAGR": 0.209692925496083,
        "Last3Y_CAGR": 0.105224328956796,
        "Last4Y_CAGR": 0.0475671772743615,
        "Last5Y_CAGR": 0.0315325956040224,
        "Last10Y_CAGR": -0.0239121763524464
      },
      "CashAndCashEquivalents": {
        "Last1Y_CAGR": -0.268478403570959,
        "Last2Y_CAGR": 0.0042898302647189,
        "Last3Y_CAGR": -0.0290637603753636,
        "Last4Y_CAGR": -0.043342333698489,
        "Last5Y_CAGR": 0.0336583684246429,
        "Last10Y_CAGR": 0.0429960826890847,
        "Last15Y_CAGR": 0.0877216382038019
      },
      "ReceivablesCurrent": {
        "Last1Y_CAGR": 0.190809628008752,
        "Last2Y_CAGR": 0.10190294205441,
        "Last3Y_CAGR": 0.147037469713858,
        "Last4Y_CAGR": 0.151063309592958,
        "Last5Y_CAGR": 0.121305706610383,
        "Last10Y_CAGR": 0.090130938608772
      },
      "Inventory": {
        "Last1Y_CAGR": 0.1198726803195,
        "Last2Y_CAGR": 0.0204531452528016,
        "Last3Y_CAGR": 0.0946804673523487,
        "Last4Y_CAGR": 0.110936277695849,
        "Last5Y_CAGR": 0.103516746615979,
        "Last10Y_CAGR": 0.0822918788283839
      },
      "OtherAssetsCurrent": {
        "Last1Y_CAGR": 0.0146284376828553,
        "Last2Y_CAGR": 0.0755329752207467,
        "Last3Y_CAGR": 0.0974171747766285,
        "Last4Y_CAGR": 0.141020283699953,
        "Last5Y_CAGR": 0.0931179020885279
      },
      "AssetsCurrent": {
        "Last1Y_CAGR": -0.0455140890214331,
        "Last2Y_CAGR": 0.0234287520731966,
        "Last3Y_CAGR": 0.0509242443287636,
        "Last4Y_CAGR": 0.0505062340564927,
        "Last5Y_CAGR": 0.0783602173086639,
        "Last10Y_CAGR": 0.0689055684779775
      },
      "PropertyPlantAndEquipment": {
        "Last1Y_CAGR": 0.08799280467696,
        "Last2Y_CAGR": 0.0853386164506464,
        "Last3Y_CAGR": 0.0731299629433464,
        "Last4Y_CAGR": 0.0741631708205108,
        "Last5Y_CAGR": 0.0680404548231026,
        "Last10Y_CAGR": 0.0694822484106778,
        "Last15Y_CAGR": 0.0674888901487784
      },
      "OperatingLeaseAssets": {
        "Last1Y_CAGR": -0.035385182454847,
        "Last2Y_CAGR": -0.0287106362580505,
        "Last3Y_CAGR": -0.0325349313895978,
        "Last4Y_CAGR": -0.0156994261436761
      },
      "FinanceLeaseAssets": {
        "Last1Y_CAGR": 0.0815094339622641,
        "Last2Y_CAGR": -0.0594852998306896,
        "Last3Y_CAGR": 0.127410469404449,
        "Last4Y_CAGR": 0.247329290797728
      },
      "Goodwill": {
        "Last1Y_CAGR": 0.0,
        "Last2Y_CAGR": 0.0005033979679518,
        "Last3Y_CAGR": -0.0006697925647566,
        "Last4Y_CAGR": 0.001514773339057
      },
      "OtherAssetsNoncurrent": {
        "Last1Y_CAGR": 0.0583700440528633,
        "Last2Y_CAGR": -0.0157490157485236,
        "Last3Y_CAGR": 0.007035053667717,
        "Last4Y_CAGR": 0.0296492754758741,
        "Last5Y_CAGR": -0.0128119161126868,
        "Last10Y_CAGR": 0.0471890114493309
      },
      "AssetsNoncurrent": {
        "Last1Y_CAGR": 0.0745885550354823,
        "Last2Y_CAGR": 0.0633717381272309,
        "Last3Y_CAGR": 0.0613617249009557,
        "Last4Y_CAGR": 0.0671772145620375,
        "Last5Y_CAGR": 0.10180591372862,
        "Last10Y_CAGR": 0.0871093224440286,
        "Last15Y_CAGR": 0.0820716816392699
      },
      "Assets": {
        "Last1Y_CAGR": 0.0121314896947559,
        "Last2Y_CAGR": 0.0432097735112619,
        "Last3Y_CAGR": 0.0561914877768052,
        "Last4Y_CAGR": 0.0588375220779984,
        "Last5Y_CAGR": 0.0899296865849885,
        "Last10Y_CAGR": 0.0777594972759236,
        "Last15Y_CAGR": 0.0801134036617776
      },
      "AccountsPayableCurrent": {
        "Last1Y_CAGR": 0.110850540525081,
        "Last2Y_CAGR": 0.0431361963615153,
        "Last3Y_CAGR": 0.0606127607831659,
        "Last4Y_CAGR": 0.0819572743252536,
        "Last5Y_CAGR": 0.10706516633966,
        "Last10Y_CAGR": 0.0862537149652153
      },
      "EmployeeLiabilitiesCurrent": {
        "Last1Y_CAGR": 0.120617110799438,
        "Last2Y_CAGR": 0.0460739526671887,
        "Last3Y_CAGR": 0.054366439565249,
        "Last4Y_CAGR": 0.0738612967366127,
        "Last5Y_CAGR": 0.0858341772180357,
        "Last10Y_CAGR": 0.0794930384170367
      },
      "AccruedLiabilitiesCurrent": {
        "Last1Y_CAGR": 0.132558139534883,
        "Last2Y_CAGR": 0.128805558317154,
        "Last3Y_CAGR": 0.133724430287827,
        "Last4Y_CAGR": 0.149838807815899
      },
      "DeferredRevenueCurrent": {
        "Last1Y_CAGR": 0.0701754385964912,
        "Last2Y_CAGR": 0.0725735328827867,
        "Last3Y_CAGR": 0.0699233146823505,
        "Last4Y_CAGR": 0.0781441189250293,
        "Last5Y_CAGR": 0.0788789916716175
      },
      "LongTermDebtCurrent": {
        "Last1Y_CAGR": -0.904717853839038,
        "Last2Y_CAGR": 0.187837911547526,
        "Last3Y_CAGR": -0.494838611300476,
        "Last4Y_CAGR": 0.0204186907071153,
        "Last5Y_CAGR": -0.429141109415058
      },
      "OperatingLeaseLiabilitiesCurrent": {
        "Last1Y_CAGR": -0.186363636363636,
        "Last2Y_CAGR": -0.134578729811083,
        "Last3Y_CAGR": -0.0692493414456164,
        "Last4Y_CAGR": -0.0617679534326801
      },
      "FinanceLeaseLiabilitiesCurrent": {
        "Last1Y_CAGR": 0.13953488372093,
        "Last2Y_CAGR": -0.225403330758516,
        "Last3Y_CAGR": 0.26861043517004,
        "Last4Y_CAGR": 0.475668851380245
      },
      "OtherLiabilitiesCurrent": {
        "Last1Y_CAGR": -0.0035563082133784,
        "Last2Y_CAGR": 0.0712841348955721,
        "Last3Y_CAGR": 0.113055125158388,
        "Last4Y_CAGR": 0.141460865340716,
        "Last5Y_CAGR": 0.0918446918957356,
        "Last10Y_CAGR": 0.13469212684105
      },
      "LiabilitiesCurrent": {
        "Last1Y_CAGR": 0.0560104814936128,
        "Last2Y_CAGR": 0.0527674339351367,
        "Last3Y_CAGR": 0.0640083928683974,
        "Last4Y_CAGR": 0.0930538277411834,
        "Last5Y_CAGR": 0.0882320993749574,
        "Last10Y_CAGR": 0.0942242781689639
      },
      "LongTermDebtNoncurrent": {
        "Last1Y_CAGR": 0.0775525385902919,
        "Last2Y_CAGR": -0.0547041694371771,
        "Last3Y_CAGR": -0.0468947695830856,
        "Last4Y_CAGR": -0.0629196630555846,
        "Last5Y_CAGR": 0.0248820195244354,
        "Last10Y_CAGR": 0.0129790917721106
      },
      "OperatingLeaseLiabilitiesNoncurrent": {
        "Last1Y_CAGR": -0.0210222588623247,
        "Last2Y_CAGR": -0.0217926573792591,
        "Last3Y_CAGR": -0.0348897378461756,
        "Last4Y_CAGR": -0.0183859442041326
      },
      "FinanceLeaseLiabilitiesNoncurrent": {
        "Last1Y_CAGR": 0.0368380660015348,
        "Last2Y_CAGR": -0.0116367598739857,
        "Last3Y_CAGR": 0.112951974869252,
        "Last4Y_CAGR": 0.197491652934333
      },
      "DeferredIncomeTaxLiabilitiesNoncurrent": {
        "Last1Y_CAGR": -0.0327044025157232,
        "Last2Y_CAGR": 0.0306088958147978,
        "Last3Y_CAGR": 0.0065878052548937,
        "Last4Y_CAGR": 0.0369938329431021
      },
      "OtherLiabilitiesNoncurrent": {
        "Last1Y_CAGR": 0.0088495575221239,
        "Last2Y_CAGR": 0.0088890637018239,
        "Last3Y_CAGR": -0.12513862365676,
        "Last4Y_CAGR": -0.0712986175410563,
        "Last5Y_CAGR": -0.207096436155824
      },
      "LiabilitiesNoncurrent": {
        "Last1Y_CAGR": 0.0378634212305613,
        "Last2Y_CAGR": -0.0342646658115765,
        "Last3Y_CAGR": -0.0293369330407405,
        "Last4Y_CAGR": -0.0273804891818851,
        "Last5Y_CAGR": 0.103085832321253,
        "Last10Y_CAGR": 0.0775148752309287
      },
      "Liabilities": {
        "Last1Y_CAGR": 0.0517343408594319,
        "Last2Y_CAGR": 0.0304426631691314,
        "Last3Y_CAGR": 0.0390702870946797,
        "Last4Y_CAGR": 0.0582038156246633,
        "Last5Y_CAGR": 0.0915796686750263,
        "Last10Y_CAGR": 0.084621498706394
      },
      "Equity": {
        "Last1Y_CAGR": -0.0573070476494532,
        "Last2Y_CAGR": 0.0697503708911269,
        "Last3Y_CAGR": 0.103818695741538,
        "Last4Y_CAGR": 0.0661329432183204,
        "Last5Y_CAGR": 0.0915640980082559,
        "Last10Y_CAGR": 0.0674082720548467
      },
      "LiabilitiesAndEquity": {
        "Last1Y_CAGR": 0.0121314896947559,
        "Last2Y_CAGR": 0.0432504208457114,
        "Last3Y_CAGR": 0.0592625238909578,
        "Last4Y_CAGR": 0.0608530286593163,
        "Last5Y_CAGR": 0.0915744013767492,
        "Last10Y_CAGR": 0.0784538268051988
      },
      "EBITA_Unadjusted": {
        "Last1Y_CAGR": 0.144318461917673,
        "Last2Y_CAGR": 0.0915373877502621,
        "Last3Y_CAGR": 0.114456063305613,
        "Last4Y_CAGR": 0.143261529736499,
        "Last5Y_CAGR": 144.32169835882,
        "Last10Y_CAGR": 0.0153250978036463,
        "Last15Y_CAGR": 0.0067215555821429
      },
      "OperatingLeaseInterest": {
        "Last1Y_CAGR": 0.0433868554169305,
        "Last2Y_CAGR": 0.0530465913492679,
        "Last3Y_CAGR": 0.0330035083547712,
        "Last4Y_CAGR": 0.0232804908340529,
        "Last5Y_CAGR": 77.2254381489998,
        "Last10Y_CAGR": 0.0060092150634227,
        "Last15Y_CAGR": 0.0031863065468098
      },
      "VariableLeaseInterest": {
        "Last1Y_CAGR": 0.0427212805042744,
        "Last2Y_CAGR": 0.0557231479311917,
        "Last3Y_CAGR": 0.0382958783579432,
        "Last4Y_CAGR": 0.0296256137783741,
        "Last5Y_CAGR": 73.9082283036212,
        "Last10Y_CAGR": 0.00648460487881,
        "Last15Y_CAGR": 0.0032788534926433
      },
      "EBITAAdjusted": {
        "Last1Y_CAGR": 0.142692940684318,
        "Last2Y_CAGR": 0.0909645986236264,
        "Last3Y_CAGR": 0.113120169172066,
        "Last4Y_CAGR": 0.141015953326605,
        "Last5Y_CAGR": 145.212598091319,
        "Last10Y_CAGR": 0.0151854507621123,
        "Last15Y_CAGR": 0.0066690203089065
      },
      "NetOperatingProfitAfterTaxes": {
        "Last1Y_CAGR": 0.165036817381751,
        "Last2Y_CAGR": 0.0846856710969861,
        "Last3Y_CAGR": 0.104574184716939,
        "Last4Y_CAGR": 0.134791670121895,
        "Last5Y_CAGR": 138.221408104227,
        "Last10Y_CAGR": 0.014892861436879,
        "Last15Y_CAGR": 0.0068429719850267
      },
      "OperatingCash": {
        "Last1Y_CAGR": 0.0502001733459902,
        "Last2Y_CAGR": 0.0588510388760046,
        "Last3Y_CAGR": 0.0910289751053341,
        "Last4Y_CAGR": 0.111420162648683,
        "Last5Y_CAGR": 134.498583968198,
        "Last10Y_CAGR": 0.0101959721437492,
        "Last15Y_CAGR": 0.003563376134072
      },
      "OperaingAssetsCurrent": {
        "Last1Y_CAGR": 0.105930767178746,
        "Last2Y_CAGR": 0.0375772905551219,
        "Last3Y_CAGR": 0.0988215407495329,
        "Last4Y_CAGR": 0.116367997132325,
        "Last5Y_CAGR": 188.171439785055,
        "Last10Y_CAGR": 0.0109622248820926,
        "Last15Y_CAGR": 0.0038234691724554
      },
      "OperaingLiabilitiesCurrent": {
        "Last1Y_CAGR": 0.0896339377352035,
        "Last2Y_CAGR": 0.0556085170677329,
        "Last3Y_CAGR": 0.0731486887323655,
        "Last4Y_CAGR": 0.0936834371066492,
        "Last5Y_CAGR": 205.332604944368,
        "Last10Y_CAGR": 0.0099124011172624,
        "Last15Y_CAGR": 0.0042486342624548
      },
      "VariableLeaseAssets": {
        "Last1Y_CAGR": 0.0692067454950862,
        "Last2Y_CAGR": 0.0120725913519186,
        "Last3Y_CAGR": 0.0062285511130995,
        "Last4Y_CAGR": 0.117674587287743,
        "Last5Y_CAGR": 104.002118318135,
        "Last10Y_CAGR": 0.0027124643240203,
        "Last15Y_CAGR": 0.0019969229756855
      },
      "OtherAssetsNetOtherLiabilities": {
        "Last1Y_CAGR": 0.107456140350877,
        "Last2Y_CAGR": -0.0365121570411944,
        "Last3Y_CAGR": 0.247688034179894,
        "Last4Y_CAGR": 0.201901848286921,
        "Last5Y_CAGR": 74.7931953337092,
        "Last10Y_CAGR": 0.0135861462889297,
        "Last15Y_CAGR": 0.0004416001940357
      },
      "InvestedCapitalExcludingGoodwill": {
        "Last1Y_CAGR": 0.0896770077876774,
        "Last2Y_CAGR": 0.0464045143299509,
        "Last3Y_CAGR": 0.0865816298757231,
        "Last4Y_CAGR": 0.0893849882855721,
        "Last5Y_CAGR": 198.496653675027,
        "Last10Y_CAGR": 0.0102982854158855,
        "Last15Y_CAGR": 0.0038735218590912
      },
      "InvestedCapitalIncludingGoodwill": {
        "Last1Y_CAGR": 0.0863650886048121,
        "Last2Y_CAGR": 0.0447390358116881,
        "Last3Y_CAGR": 0.0830892774290334,
        "Last4Y_CAGR": 0.0857136523048252,
        "Last5Y_CAGR": 201.573537646188,
        "Last10Y_CAGR": 0.0099275262479747,
        "Last15Y_CAGR": 0.0037386374322003
      },
      "ExcessCash": {
        "Last1Y_CAGR": -0.417132900791282,
        "Last2Y_CAGR": -0.0355780279297545,
        "Last3Y_CAGR": -0.0982087392301666,
        "Last4Y_CAGR": -0.117212719145879,
        "Last10Y_CAGR": -0.0250365604558129,
        "Last15Y_CAGR": -0.0154766205350439
      },
      "ForeignTaxCreditCarryForward": {
        "Last1Y_CAGR": 0.26,
        "Last2Y_CAGR": 0.2518642814237,
        "Last3Y_CAGR": 0.292168746665145,
        "Last4Y_CAGR": 0.328915279967112,
        "Last5Y_CAGR": 61.5525906407302,
        "Last10Y_CAGR": 0.0328507534901654,
        "Last15Y_CAGR": 0.0140986453807241
      },
      "TotalFundsInvested": {
        "Last1Y_CAGR": -0.0517612432806987,
        "Last2Y_CAGR": 0.0310067297088914,
        "Last3Y_CAGR": 0.0426525473952072,
        "Last4Y_CAGR": 0.0343146509870724,
        "Last5Y_CAGR": 252.055665029001,
        "Last10Y_CAGR": 0.003113369354496,
        "Last15Y_CAGR": 0.0001035807537692
      },
      "Debt": {
        "Last1Y_CAGR": -0.0868689996903065,
        "Last2Y_CAGR": -0.0516623954033,
        "Last3Y_CAGR": -0.0766554781197661,
        "Last4Y_CAGR": -0.0617342012166053,
        "Last10Y_CAGR": -0.0112106403339614,
        "Last15Y_CAGR": -0.004439489903647
      },
      "OperatingLeaseLiabilities": {
        "Last1Y_CAGR": -0.0347694633408919,
        "Last2Y_CAGR": -0.031173129331704,
        "Last3Y_CAGR": -0.0374662647551198,
        "Last4Y_CAGR": -0.0217652311039522,
        "Last10Y_CAGR": -0.0054054537842248,
        "Last15Y_CAGR": -0.0022138401134641
      },
      "VariableLeaseLiabilities": {
        "Last1Y_CAGR": 0.0692067454950862,
        "Last2Y_CAGR": 0.0120725913519186,
        "Last3Y_CAGR": 0.0062285511130995,
        "Last4Y_CAGR": 0.117674587287743,
        "Last5Y_CAGR": 104.002118318135,
        "Last10Y_CAGR": 0.0027124643240203,
        "Last15Y_CAGR": 0.0019969229756855
      },
      "FinanceLeaseLiabilities": {
        "Last1Y_CAGR": 0.0460893854748603,
        "Last2Y_CAGR": -0.0407568503515805,
        "Last3Y_CAGR": 0.125033249420219,
        "Last4Y_CAGR": 0.214733038846081,
        "Last5Y_CAGR": 92.0513307876022,
        "Last10Y_CAGR": 0.0066091976561617,
        "Last15Y_CAGR": -0.0009422729191581
      },
      "DebtAndDebtEquivalents": {
        "Last1Y_CAGR": -0.0410173108508143,
        "Last2Y_CAGR": -0.0379556420394612,
        "Last3Y_CAGR": -0.0384730090750795,
        "Last4Y_CAGR": -0.0126355332830648,
        "Last10Y_CAGR": -0.0060005818511987,
        "Last15Y_CAGR": -0.0026801926320058
      },
      "DeferredIncomeTaxesNet": {
        "Last1Y_CAGR": -3.64620938628158
      },
      "NoncontrollingInterests": {
        "Last2Y_CAGR": -1.0,
        "Last4Y_CAGR": -1.0,
        "Last15Y_CAGR": -1.0
      },
      "TotalFundsInvestedValidation": {
        "Last1Y_CAGR": -0.105072861910852,
        "Last2Y_CAGR": 0.0016050097156987,
        "Last3Y_CAGR": 0.0291739475036776,
        "Last4Y_CAGR": 0.019459953539143,
        "Last5Y_CAGR": 279.193216445125,
        "Last10Y_CAGR": -0.0007854487690406,
        "Last15Y_CAGR": -0.0024877196456201
      },
      "PPEBeginingOfYear": {
        "Last1Y_CAGR": 0.0826909031891585,
        "Last2Y_CAGR": 0.0657748556370731,
        "Last3Y_CAGR": 0.0695924683525037,
        "Last4Y_CAGR": 0.0631098034295865,
        "Last5Y_CAGR": 210.461262563317,
        "Last10Y_CAGR": 0.0099976047101497,
        "Last15Y_CAGR": 0.0045144572054962
      },
      "CapitalExpenditures": {
        "Last1Y_CAGR": 0.0895211658570436,
        "Last2Y_CAGR": 0.100220767080212,
        "Last3Y_CAGR": 0.0949379057802868,
        "Last4Y_CAGR": 0.137833318498922,
        "Last5Y_CAGR": 126.859599264221,
        "Last10Y_CAGR": 0.0132768529587721,
        "Last15Y_CAGR": 0.0059653320648556
      },
      "PPEEndOfYear": {
        "Last1Y_CAGR": 0.08799280467696,
        "Last2Y_CAGR": 0.0853386164506464,
        "Last3Y_CAGR": 0.0731299629433464,
        "Last4Y_CAGR": 0.0741631708205108,
        "Last5Y_CAGR": 207.227331296375,
        "Last10Y_CAGR": 0.0112333216370672,
        "Last15Y_CAGR": 0.0053790508186237
      },
      "RevenueAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0,
        "Last2Y_CAGR": 0.0,
        "Last3Y_CAGR": 0.0,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0
      },
      "GrossMarginAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0288459638047484,
        "Last2Y_CAGR": 0.0189425259107283,
        "Last3Y_CAGR": -0.0070720928672719,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0009416290880512
      },
      "OperatingIncomeAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0896193801528495,
        "Last2Y_CAGR": 0.0308696385744258,
        "Last3Y_CAGR": 0.0214724711578051,
        "Last4Y_CAGR": 0.14175540474678,
        "Last5Y_CAGR": 0.111881388864164,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0028035017259753
      },
      "InterestIncomeAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0798346657841171,
        "Last2Y_CAGR": 1.79166833131044,
        "Last3Y_CAGR": 1.15515329232548,
        "Last4Y_CAGR": -0.793642620925073,
        "Last5Y_CAGR": -0.717058922786277,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0025142701417761
      },
      "OtherIncomeAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.375399167800908,
        "Last2Y_CAGR": -0.2492340231748,
        "Last3Y_CAGR": -0.117643433022051,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0098297092745012
      },
      "PretaxIncomeAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.092779826607459,
        "Last2Y_CAGR": 0.0526562661793812,
        "Last3Y_CAGR": 0.0393405705166534,
        "Last4Y_CAGR": -0.0068206484457065,
        "Last5Y_CAGR": -0.0054602506482022,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0028960980885761
      },
      "NetIncomeNoncontrollingAsPercentOfRevenue": {
        "Last2Y_CAGR": -1.0,
        "Last3Y_CAGR": -1.0
      },
      "NetIncomeAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.114884481181275,
        "Last2Y_CAGR": 0.0603649509768471,
        "Last3Y_CAGR": 0.042480823696587,
        "Last4Y_CAGR": -0.0914003999559657,
        "Last5Y_CAGR": -0.0738143816824925,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0035327443906274
      },
      "CapitalExpendituresAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0374414264147136,
        "Last2Y_CAGR": 0.0390703948764343,
        "Last3Y_CAGR": 0.0035827927251659,
        "Last4Y_CAGR": 0.507640904433134,
        "Last5Y_CAGR": 0.388795592556149,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0012147290312791
      },
      "InterestIncomeAsPercentOfPriorYearExcessCash": {
        "Last1Y_CAGR": -0.289335371106414,
        "Last2Y_CAGR": 1.63526579128898,
        "Last3Y_CAGR": 1.31933175944116,
        "Last4Y_CAGR": -0.555923059321112,
        "Last5Y_CAGR": -0.477644011587427,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0122766485249876
      },
      "DividendAsPercentOfNetIncome": {
        "Last1Y_CAGR": 5.1724446423586,
        "Last2Y_CAGR": 1.18807445860988,
        "Last3Y_CAGR": 0.022497395484883,
        "Last4Y_CAGR": 1.71768044303178,
        "Last5Y_CAGR": 1.22514702158219,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0368628944916888
      },
      "OperatingLeaseCostAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.124839364476196,
        "Last2Y_CAGR": -0.0764804822132343,
        "Last3Y_CAGR": -0.0959913380679139,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.004582466546476
      },
      "VariableLeaseCostAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0299468369404172,
        "Last2Y_CAGR": -0.0377030507884282,
        "Last3Y_CAGR": -0.0597703673206974,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0010206620936911
      },
      "CashAndCashEquivalentsAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.303445557337535,
        "Last2Y_CAGR": -0.0515286915798881,
        "Last3Y_CAGR": -0.11007291118836,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0130515164271444
      },
      "ReceivablesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.133888241719456,
        "Last2Y_CAGR": 0.0406590744096606,
        "Last3Y_CAGR": 0.0513354786046051,
        "Last4Y_CAGR": -0.324421472252695,
        "Last5Y_CAGR": -0.269297370536823,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0040651770104254
      },
      "InventoryAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.066342120999209,
        "Last2Y_CAGR": -0.0362637351368736,
        "Last3Y_CAGR": 0.0033468334300306,
        "Last4Y_CAGR": 1.16317584238943,
        "Last5Y_CAGR": 0.853845168305971,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0021089835180487
      },
      "OtherAssetsCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0338713862042142,
        "Last2Y_CAGR": 0.0157547527766044,
        "Last3Y_CAGR": 0.0058552062475496,
        "Last4Y_CAGR": 0.0386634038471516,
        "Last5Y_CAGR": 0.0308129454750631,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0011578339326693
      },
      "AssetsCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0911390654816527,
        "Last2Y_CAGR": -0.0334535128193383,
        "Last3Y_CAGR": -0.0367586303312417,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0032562002484354
      },
      "PropertyPlantAndEquipmentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0359861217795847,
        "Last2Y_CAGR": 0.0250153955581504,
        "Last3Y_CAGR": -0.0164056249379258,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0011687255007561
      },
      "OperatingLeaseAssetsAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0814943264845958,
        "Last2Y_CAGR": -0.0826949891148088,
        "Last3Y_CAGR": -0.113254468317857,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0028895907272878
      },
      "FinanceLeaseAssetsAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0298126599203663,
        "Last2Y_CAGR": -0.111759194033856,
        "Last3Y_CAGR": 0.0333460385830746,
        "Last4Y_CAGR": -0.35894012928118,
        "Last5Y_CAGR": -0.299321368142152,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0009725112256466
      },
      "GoodwillAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0478005761378329,
        "Last2Y_CAGR": -0.0551046736186707,
        "Last3Y_CAGR": -0.0840479673431566,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0016513186277646
      },
      "OtherAssetsNoncurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.007779346180113,
        "Last2Y_CAGR": -0.0704537766744962,
        "Last3Y_CAGR": -0.0769859677003609,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0002578409163518
      },
      "AssetsAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0362489786398964,
        "Last2Y_CAGR": -0.0147719223861235,
        "Last3Y_CAGR": -0.0319308543800731,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0012413318735871
      },
      "AccountsPayableCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0577512446849595,
        "Last2Y_CAGR": -0.0148414101110682,
        "Last3Y_CAGR": -0.0278784661234424,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0018469441814799
      },
      "EmployeeLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0670509672733119,
        "Last2Y_CAGR": -0.0120669345731379,
        "Last3Y_CAGR": -0.0336036314127639,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0021304649307682
      },
      "AccruedLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0784212079555239,
        "Last2Y_CAGR": 0.0660664407671622,
        "Last3Y_CAGR": 0.0391332000860662,
        "Last4Y_CAGR": -0.29678762197197,
        "Last5Y_CAGR": -0.245482694208879,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0024721665640772
      },
      "DeferredRevenueCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0190204360630208,
        "Last2Y_CAGR": 0.0129597965180718,
        "Last3Y_CAGR": -0.0193447295209971,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0006252973145031
      },
      "LongTermDebtCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.909272395321181,
        "Last2Y_CAGR": 0.121817770333817,
        "Last3Y_CAGR": -0.536986276051236,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.112700556620309
      },
      "OperatingLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.225255923312145,
        "Last2Y_CAGR": -0.182678924216213,
        "Last3Y_CAGR": -0.146905646145169,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0090079549124014
      },
      "FinanceLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.085064459749911,
        "Last2Y_CAGR": -0.268455485425281,
        "Last3Y_CAGR": 0.162765118174393,
        "Last4Y_CAGR": -0.755917240099243,
        "Last5Y_CAGR": -0.676384224511327,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0026693433679891
      },
      "OtherLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0511868907696883,
        "Last2Y_CAGR": 0.0117420633904892,
        "Last3Y_CAGR": 0.0201884189656169,
        "Last4Y_CAGR": 0.0345242966410568,
        "Last5Y_CAGR": 0.0275253754976638,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0017728785219153
      },
      "LiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0055325720706276,
        "Last2Y_CAGR": -0.0057454776144206,
        "Last3Y_CAGR": -0.0247661454035426,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0001836739794918
      },
      "LongTermDebtNoncurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0260449064268915,
        "Last2Y_CAGR": -0.107243799310735,
        "Last3Y_CAGR": -0.126416206934471,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0008519042744612
      },
      "OperatingLeaseLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.06781795891482,
        "Last2Y_CAGR": -0.0761615121432652,
        "Last3Y_CAGR": -0.115412803715275,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.002379160984312
      },
      "FinanceLeaseLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0127233909149749,
        "Last2Y_CAGR": -0.0665700803625927,
        "Last3Y_CAGR": 0.0200938749237171,
        "Last4Y_CAGR": -0.283038195378139,
        "Last5Y_CAGR": -0.233703546209625,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0004281089465939
      },
      "DeferredIncomeTaxLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.078941689371061,
        "Last2Y_CAGR": -0.0266724421323575,
        "Last3Y_CAGR": -0.0773959003630384,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.002793490224893
      },
      "OtherLiabilitiesNoncurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0393740325638314,
        "Last2Y_CAGR": -0.0471850839634786,
        "Last3Y_CAGR": -0.198131858726505,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0013515372121312
      },
      "LiabilitiesAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0014608334224071,
        "Last2Y_CAGR": -0.0268294355521713,
        "Last3Y_CAGR": -0.0476235638064864,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 4.86423401029334e-05
      },
      "EquityAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.102368313892884,
        "Last2Y_CAGR": 0.0102935461315616,
        "Last3Y_CAGR": 0.0117226223391269,
        "Last4Y_CAGR": 0.677533025864378,
        "Last5Y_CAGR": 0.512644467063694,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0036901672713712
      },
      "VariableLeaseAssetsAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0180980470499638,
        "Last2Y_CAGR": -0.0441784970752282,
        "Last3Y_CAGR": -0.0777251804738253,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0005953705266612
      },
      "ForeignTaxCreditCarryForwardAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.19977127406633,
        "Last2Y_CAGR": 0.182285548638252,
        "Last3Y_CAGR": 0.184357864134994,
        "Last4Y_CAGR": -0.713740223702163,
        "Last5Y_CAGR": -0.632372270464346,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0058118050955942
      },
      "DeferredIncomeTaxesNetAsPercentOfRevenue": {
        "Last1Y_CAGR": -3.51971905303598
      },
      "NoncontrollingInterestsAsPercentOfRevenue": {
        "Last2Y_CAGR": -1.0
      },
      "DaysCashAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.303445557337535,
        "Last2Y_CAGR": -0.051528691579888,
        "Last3Y_CAGR": -0.11007291118836,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0130515164271444
      },
      "DaysReceivablesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.133888241719456,
        "Last2Y_CAGR": 0.0406590744096608,
        "Last3Y_CAGR": 0.0513354786046051,
        "Last4Y_CAGR": 1.95290213502805,
        "Last5Y_CAGR": 1.37793096958849,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0040651770104254
      },
      "DaysInventoryAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.066342120999209,
        "Last2Y_CAGR": -0.0362637351368737,
        "Last3Y_CAGR": 0.0033468334300306,
        "Last4Y_CAGR": 8.45507635467973,
        "Last5Y_CAGR": 5.03298203781668,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0021089835180487
      },
      "DaysOtherAssetsCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0338713862042141,
        "Last2Y_CAGR": 0.0157547527766044,
        "Last3Y_CAGR": 0.0058552062475496,
        "Last4Y_CAGR": 3.5399183911644,
        "Last5Y_CAGR": 2.35458218988305,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0011578339326693
      },
      "DaysAssetsCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0911390654816527,
        "Last2Y_CAGR": -0.0334535128193383,
        "Last3Y_CAGR": -0.0367586303312417,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0032562002484354
      },
      "DaysAccountsPayableCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0577512446849595,
        "Last2Y_CAGR": -0.0148414101110682,
        "Last3Y_CAGR": -0.0278784661234424,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0018469441814799
      },
      "DaysEmployeeLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0670509672733119,
        "Last2Y_CAGR": -0.0120669345731379,
        "Last3Y_CAGR": -0.0336036314127639,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.002130464930768
      },
      "DaysAccruedLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0784212079555239,
        "Last2Y_CAGR": 0.0660664407671622,
        "Last3Y_CAGR": 0.0391332000860662,
        "Last4Y_CAGR": 2.07368758356072,
        "Last5Y_CAGR": 1.45543124683882,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0024721665640772
      },
      "DaysDeferredRevenueCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0190204360630208,
        "Last2Y_CAGR": 0.0129597965180718,
        "Last3Y_CAGR": -0.0193447295209973,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0006252973145031
      },
      "DaysLongTermDebtCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.909272395321181,
        "Last2Y_CAGR": 0.121817770333817,
        "Last3Y_CAGR": -0.536986276051236,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.112700556620309
      },
      "DaysOperatingLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.225255923312145,
        "Last2Y_CAGR": -0.182678924216213,
        "Last3Y_CAGR": -0.146905646145169,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0090079549124014
      },
      "DaysFinanceLeaseLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.085064459749911,
        "Last2Y_CAGR": -0.268455485425281,
        "Last3Y_CAGR": 0.162765118174393,
        "Last4Y_CAGR": 0.0668670972089817,
        "Last5Y_CAGR": 0.0531452108599423,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0026693433679891
      },
      "DaysOtherLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": -0.0511868907696883,
        "Last2Y_CAGR": 0.0117420633904892,
        "Last3Y_CAGR": 0.0201884189656169,
        "Last4Y_CAGR": 3.52182666976713,
        "Last5Y_CAGR": 2.34388342659861,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0017728785219153
      },
      "DaysLiabilitiesCurrentAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0055325720706276,
        "Last2Y_CAGR": -0.0057454776144205,
        "Last3Y_CAGR": -0.0247661454035426,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0001836739794918
      },
      "OperatingProfitAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0896193801528495,
        "Last2Y_CAGR": 0.0308696385744258,
        "Last3Y_CAGR": 0.0214724711578051,
        "Last4Y_CAGR": 0.14175540474678,
        "Last5Y_CAGR": 0.111881388864164,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0028035017259753
      },
      "FixedAssetsAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0250284979666715,
        "Last2Y_CAGR": 0.0055586295937612,
        "Last3Y_CAGR": -0.0264117291636752,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0008192568829892
      },
      "OtherAssetsAsPercentOfRevenue": {
        "Last1Y_CAGR": 0.0545190987947243,
        "Last2Y_CAGR": -0.0900629006497737,
        "Last3Y_CAGR": 0.143588358008031,
        "Last4Y_CAGR": -0.657120797688664,
        "Last5Y_CAGR": -0.575270022466921,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0017475390138323
      },
      "PretaxReturnOnInvestedCapital": {
        "Last1Y_CAGR": 0.0501446334459527,
        "Last2Y_CAGR": 0.0431313825602246,
        "Last3Y_CAGR": 0.0256533266010379,
        "Last4Y_CAGR": 0.89201200807835,
        "Last5Y_CAGR": 0.665478807059722,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.001612280850791
      },
      "ReturnOnInvestedCapitalExcludingGoodwill": {
        "Last1Y_CAGR": 0.112348930509627,
        "Last2Y_CAGR": 0.0190884681994718,
        "Last3Y_CAGR": 0.0153519353495146,
        "Last4Y_CAGR": 1.02924271967562,
        "Last5Y_CAGR": 0.76143733464114,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0034606775710195
      },
      "GoodwillAsPercentOfInvestedCapital": {
        "Last1Y_CAGR": -0.0452242247507095,
        "Last2Y_CAGR": -0.0600028170074719,
        "Last3Y_CAGR": -0.0813909339800225,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0015592544121261
      },
      "ReturnOnInvestedCapitalIncludingGoodwill": {
        "Last1Y_CAGR": 0.114193484932293,
        "Last2Y_CAGR": 0.0214929821757223,
        "Last3Y_CAGR": 0.018753904803838,
        "Last4Y_CAGR": 0.912882727799384,
        "Last5Y_CAGR": 0.680160137220355,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0035131288266321
      },
      "AdjustedEBITDA": {
        "Last1Y_CAGR": 0.16479783915605,
        "Last2Y_CAGR": 0.0928205106237347,
        "Last3Y_CAGR": 0.124681962814108,
        "Last4Y_CAGR": 488.972705965242,
        "Last5Y_CAGR": 140.950690877189,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0049031642706391
      },
      "DebtToEBITA": {
        "Last1Y_CAGR": -0.200895561879596,
        "Last2Y_CAGR": -0.130734759135966,
        "Last3Y_CAGR": -0.17048981102641,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0078626237127621
      },
      "DebtToEBITDA": {
        "Last1Y_CAGR": -0.216060530322327,
        "Last2Y_CAGR": -0.132211012350573,
        "Last3Y_CAGR": -0.1790172222822,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0085697612566071
      },
      "DebtToEquity": {
        "Last1Y_CAGR": -0.0313590464075734,
        "Last2Y_CAGR": -0.113496353540206,
        "Last3Y_CAGR": -0.16349983430935,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0010699286531046
      },
      "GrossCashFlow": {
        "Last1Y_CAGR": 0.142549955881053,
        "Last2Y_CAGR": 0.0847772671723245,
        "Last3Y_CAGR": 0.0981785520318492,
        "Last4Y_CAGR": 553.581622240271,
        "Last5Y_CAGR": 155.737306432282,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.0043034373461177
      },
      "DecreaseInWorkingCapital": {
        "Last1Y_CAGR": -0.870857256551645,
        "Last3Y_CAGR": -0.38002099720286,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0936622336523715
      },
      "DecreaseInOperatingLeases": {
        "Last1Y_CAGR": 0.573770491803278,
        "Last2Y_CAGR": -0.0902823477053159,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": 0.013507044729925
      },
      "DecreaseInVariableLeases": {
        "Last1Y_CAGR": -2.57823789231471
      },
      "DecreaseInFinanceLeases": {
        "Last1Y_CAGR": -1.36610169491525
      },
      "DecreaseInGoodwill": {
        "Last2Y_CAGR": -1.0
      },
      "DecreaseInOtherAssetsNetOfOtherLiabilities": {
        "Last1Y_CAGR": -1.55681818181818
      },
      "FreeCashFlow": {
        "Last1Y_CAGR": -0.195314844334096,
        "Last2Y_CAGR": 0.826131204060461,
        "Last3Y_CAGR": 0.135881982540146,
        "Last4Y_CAGR": 427.956043511772,
        "Last5Y_CAGR": 126.623377171229,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.0076071286211454
      },
      "DecreaseInExcessCash": {
        "Last1Y_CAGR": -2.11731489216869
      },
      "CashFlowToInvestors": {
        "Last1Y_CAGR": -0.91454177867868,
        "Last2Y_CAGR": 0.266630432112028,
        "Last3Y_CAGR": -0.216294677907932,
        "Last10Y_CAGR": 0.0,
        "Last15Y_CAGR": -0.115947515826977
      }
    }
  }
};

// Updated ValuationPage component with real data
const ValuationPage: React.FC<ValuationPageProps> = ({ onClose }) => {
  const [allData, setAllData] = useState<{[key: string]: TableData}>({
    balanceSheet: realCostcoData.balanceSheet,
    ppeChanges: {}, // To be populated as needed
    cashFlow: realCostcoData.cashFlow,
    incomeStatement: realCostcoData.incomeStatement,
    nopat: realCostcoData.nopat,
    investedCapital: {}, // To be populated as needed
    incomeStatementCommonSize: {}, // To be populated as needed
    balanceSheetCommonSize: {}, // To be populated as needed
    roicPerformance: {}, // To be populated as needed
    financingHealth: {} // To be populated as needed
  });

  const [analysisData, setAnalysisData] = useState<{
    averages: {[metric: string]: {[period: string]: number}},
    cagr: {[metric: string]: {[period: string]: number}}
  }>(realCostcoData.analysisData);

  // Rest of your component logic...
};
