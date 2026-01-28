#!/usr/bin/env python3

files = [
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/InvestedCapitalTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/FreeCashFlowTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tabs/ValuationSummaryTab.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tabs/ThreeStatementModelTab.tsx"
]

target_bg = "#161C1A"
target_hover = "#232D2A"

def sync_theme(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # Replace main backgrounds (avoiding tooltip bg-gray-900 etc if possible, but targeting gray-800/700)
    # We target common container/row backgrounds
    replacements = [
        ('dark:bg-gray-800', f'dark:bg-[{target_bg}]'),
        ('dark:bg-gray-700', f'dark:bg-[{target_bg}]'),
        ('dark:bg-green-900/20', f'dark:bg-[{target_bg}]'),
        ('dark:bg-[#0B0F0E]', f'dark:bg-[{target_bg}]'),
        ('dark:bg-blue-900/20', f'dark:bg-[{target_bg}]'),
        ('dark:hover:bg-gray-800', f'dark:hover:bg-[{target_hover}]'),
        ('dark:hover:bg-gray-700', f'dark:hover:bg-[{target_hover}]'),
        ('dark:hover:bg-gray-600', f'dark:hover:bg-[{target_hover}]'),
        ('dark:border-[#161C1A]', 'dark:border-gray-700') # Ensure borders stay visible
    ]
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Synced {path}")

for f in files:
    sync_theme(f)
