#!/usr/bin/env python3
import re

files = [
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/modals/BreakdownChartModal.tsx"
]

# The target color from the user request/codebase match
custom_bg = "dark:bg-[#161C1A]"
custom_border = "dark:border-[#161C1A]"
custom_text = "dark:text-[#E0E6E4]" # Using the text color found in ReportGenerationForm for consistency, or keep white?
# Let's execute replacements for background and border first.

replacements = [
    # Replace the green theme I added
    ("dark:bg-green-950", custom_bg),
    ("dark:bg-green-900", custom_bg), 
    ("dark:border-green-800", custom_border),
    ("dark:hover:bg-green-800", "dark:hover:bg-[#232D2A]"), # Slightly lighter for hover
    ("dark:hover:bg-green-900", "dark:hover:bg-[#232D2A]"),
    
    # Also handle the /20 opacity inputs, maybe make them solid or maintain opacity?
    # dark:bg-green-900/20 -> dark:bg-[#161C1A] to match the solid look in verify? 
    # Or keep it distinct? The user wants "the dark mode side of the table like this".
    # I'll replace the transparent green with the solid custom color for inputs too, or maybe slightly lighter.
    ("dark:bg-green-900/20", "dark:bg-[#161C1A]"), 
    
    # Catch any remaining generic gray classes if any (from previous replaces)
    ("dark:bg-gray-900", custom_bg),
    ("dark:bg-gray-800", custom_bg),
    ("dark:border-gray-700", custom_border),
    ("dark:border-gray-600", custom_border),
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w') as f:
        f.write(content)

print("Updated dark mode colors to custom hex #161C1A")
