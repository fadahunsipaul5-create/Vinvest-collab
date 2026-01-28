#!/usr/bin/env python3

files = [
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/InvestedCapitalTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/FreeCashFlowTable.tsx"
]

def add_subtle_border(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # Target the outer container I recently changed:
    # <div className="bg-white dark:bg-[#161C1A] rounded-lg relative overflow-hidden">
    # We want to add 'border dark:border-gray-700'
    
    old_line = 'className="bg-white dark:bg-[#161C1A] rounded-lg relative overflow-hidden"'
    new_line = 'className="bg-white dark:bg-[#161C1A] rounded-lg border dark:border-gray-700 relative overflow-hidden"'
    
    new_content = content.replace(old_line, new_line)
    
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Added subtle border to {path}")

for f in files:
    add_subtle_border(f)
