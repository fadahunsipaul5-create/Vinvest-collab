#!/usr/bin/env python3
import re

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Find all breakdown field cells and add onClick if missing
lines = content.split('\n')
result_lines = []
i = 0

while i < len(lines):
    line = lines[i]
    
    # Check if this is a breakdown cell line with cursor-pointer
    if 'cursor-pointer' in line and '<td className=' in line:
        # Look ahead for the onMouseEnter line
        if i + 1 < len(lines) and 'onMouseEnter' in lines[i + 1]:
            # Check if onClick is already present
            if 'onClick' not in lines[i + 1]:
                # Extract field name from the setHoveredBreakdown call
                field_match = None
                for j in range(i + 1, min(i + 5, len(lines))):
                    field_match = re.search(r"setHoveredBreakdown\('([^']+)'\)", lines[j])
                    if field_match:
                        break
                
                if field_match:
                    field_name = field_match.group(1)
                    # Get the indentation from the onMouseEnter line
                    indent_match = re.match(r'(\s+)', lines[i + 1])
                    indent = indent_match.group(1) if indent_match else '                '
                    
                    # Add the original line
                    result_lines.append(line)
                    # Add onClick handler
                    onclick_line = f"{indent}onClick={{() => handleBreakdownClick('{field_name}')}}"
                    result_lines.append(onclick_line)
                    i += 1
                    continue
    
    result_lines.append(line)
    i += 1

# Write back
with open(file_path, 'w') as f:
    f.write('\n'.join(result_lines))

print("Added onClick handlers to all breakdown fields")
