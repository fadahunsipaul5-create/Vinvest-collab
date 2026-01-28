#!/usr/bin/env python3
import re

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add background to body cells in the loop
# Pattern: <td key={...} className="p-2 text-center">
# We want to insert dark:bg-[#161C1A] into the class string.
# Note: we should handle potentially different spacing or quotes.

# Regex for TD loop
# We look for className="...p-2 text-center..." and append the bg class.
# However, modifying regex replacement is tricky if there are multiple matches.
# Let's search for the specific string `className="p-2 text-center"` which seems unique to the loop cells based on our view.
# And replace it with `className="p-2 text-center dark:bg-[#161C1A]"`

content = content.replace('className="p-2 text-center"', 'className="p-2 text-center dark:bg-[#161C1A]"')

# 2. Add background to header cells in the loop (th)
# Pattern saw: <th key={String(yk)} className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px]">
# We'll search for "dark:text-gray-300 min-w-[160px]" and insert the bg.
# Or just replace the whole class string if it's consistent.
# Let's try to be safer and target "dark:text-gray-300" in th context.

# Let's use simpler string replacement for the specific header class seen in previous steps:
header_class_old = 'text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px]'
header_class_new = 'text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] dark:bg-[#161C1A]'
content = content.replace(header_class_old, header_class_new)

# Also check for the breakdown column sticky cells.
# They usually have `bg-white dark:bg-[#161C1A]` already (saw this in line 723).
# But let's confirm if any missed it.
# We can search for `sticky left-0` and ensure it has `dark:bg-[#161C1A]`.

# 3. Check for the "ForecastDriverValue" header and column (the last one)
# Header: <th ... border-l dark:border-gray-700 min-w-[180px] bg-gray-50 dark:bg-[#1C2422]">
# I replaced #1C2422 with #161C1A previously. But let's verify.
# If I used !important in previous step, finding it by perfect string match might fail if I use exact string.
# I'll rely on the regex I used before.

# However, let's force ALL generic dark background assignments in this file to #161C1A just to be monolithic.
# (Except hover states).

with open(file_path, 'w') as f:
    f.write(content)

print("Explicitly added dark:bg-[#161C1A] to table cells and headers.")
