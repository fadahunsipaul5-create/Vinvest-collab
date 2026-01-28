#!/usr/bin/env python3
import re

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

with open(file_path, 'r') as f:
    content = f.read()

# Replace blue backgrounds/borders with gray/custom dark theme
replacements = [
    # Header ForecastDriverValue background
    ('bg-blue-50 dark:bg-blue-900/20', 'bg-gray-50 dark:bg-[#1C2422]'),
    
    # Hover states (blue hover -> dark gray hover)
    ('dark:hover:bg-blue-900/20', 'dark:hover:bg-[#232D2A]'),
    ('hover:bg-blue-50', 'hover:bg-gray-50'),
    
    # Input focus rings (blue focus -> gray focus)
    ('focus:ring-blue-500', 'focus:ring-gray-500'),
    ('focus:border-blue-500', 'focus:border-gray-500'),
    
    # Any other blue backgrounds in cells
    ('dark:bg-blue-900/20', 'dark:bg-[#1C2422]'),
]

for old, new in replacements:
    content = content.replace(old, new)

# One specific fix: The user said "check from 2027 going".
# If there are specific styles applied to forecast columns causing lightness, 
# they might be inside renderCell or using specific indices. 
# But looking at the code, it seems the styles use logical classes.
# The `dark:bg-[#161C1A]/20` I saw earlier in inputs was likely the culprit for lighter inputs.
# I replaced that in the previous step (in the regex script) but maybe not global enough.
# Let's ensure no `dark:bg-[#161C1A]/20` remains.
content = content.replace('dark:bg-[#161C1A]/20', 'dark:bg-[#1C2422]')

with open(file_path, 'w') as f:
    content = f.write(content)

print("Updated IncomeStatementTable.tsx to remove blue accents and enforce dark theme.")
