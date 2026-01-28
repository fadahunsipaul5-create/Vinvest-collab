#!/usr/bin/env python3
import re

files = [
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/utils/forecastDisplay.tsx"
]

# TARGET: Replace #1C2422 with #161C1A to match table background perfectly.
# Also fix any remaining blue ring/border in forecastDisplay if present (though grep said no bg-blue).

replacements = [
    ('dark:bg-[#1C2422]', 'dark:bg-[#161C1A]'),
    ('dark:bg-[#111615]', 'dark:bg-[#161C1A]'), # In case I used this one
    # any other potential "blue-like" colors I introduced?
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)

print("Standardized all dark mode backgrounds to #161C1A.")
