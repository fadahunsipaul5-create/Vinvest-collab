#!/usr/bin/env python3
import re

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Replace all gray dark mode colors with green equivalents
replacements = [
    ('dark:bg-gray-800 border-r dark:border-gray-600', 'dark:bg-green-950 border-r dark:border-green-800'),
    ('dark:bg-gray-700', 'dark:bg-green-900'),
    ('dark:border-gray-600', 'dark:border-green-800'),
    ('dark:border-gray-700', 'dark:border-green-800'),
    ('dark:hover:bg-gray-700', 'dark:hover:bg-green-800'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Write back
with open(file_path, 'w') as f:
    f.write(content)

print("Updated all dark mode colors to green theme")
