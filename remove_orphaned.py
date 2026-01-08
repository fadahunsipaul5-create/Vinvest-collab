#!/usr/bin/env python3
# -*- coding: utf-8 -*-

file_path = r'sec_frontend\src\components\ValuationPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 4257-4598 (0-indexed: 4256-4597)
# Keep lines 0-4256 and 4599 onwards
new_lines = lines[:4256] + lines[4599:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed {4599 - 4256} lines of orphaned code")
print(f"File now has {len(new_lines)} lines (was {len(lines)})")

