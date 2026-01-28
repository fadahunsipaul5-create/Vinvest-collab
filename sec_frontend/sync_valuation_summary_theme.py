#!/usr/bin/env python3

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tabs/ValuationSummaryTab.tsx"

with open(file_path, 'r') as f:
    content = f.read()

# Replace all instances of generic dark backgrounds with #161C1A
content = content.replace('dark:bg-gray-700', 'dark:bg-[#161C1A]')
content = content.replace('dark:bg-gray-800', 'dark:bg-[#161C1A]')
content = content.replace('dark:bg-[#0B0F0E]', 'dark:bg-[#161C1A]')
content = content.replace('dark:bg-blue-900/20', 'dark:bg-[#161C1A]')

# Ensure borders use consistent gray-700
content = content.replace('dark:border-[#161C1A]', 'dark:border-gray-700')

# Update hover states to #232D2A
content = content.replace('dark:hover:bg-gray-800', 'dark:hover:bg-[#232D2A]')

with open(file_path, 'w') as f:
    f.write(content)

print("Synchronized ValuationSummaryTab.tsx theme.")
