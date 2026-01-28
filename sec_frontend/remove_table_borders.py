#!/usr/bin/env python3

files = [
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/InvestedCapitalTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/FreeCashFlowTable.tsx"
]

def remove_outer_border(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # Target the outer container: <div className="bg-white rounded-lg shadow-sm border relative">
    # We want to remove 'border' and 'shadow-sm' to make it cleaner
    new_content = content.replace('className="bg-white rounded-lg shadow-sm border relative"', 'className="bg-white dark:bg-[#161C1A] rounded-lg relative overflow-hidden"')
    
    # Also check if it was already updated to have dark bg
    if new_content == content:
        new_content = content.replace('className="bg-white dark:bg-[#161C1A] rounded-lg shadow-sm border relative"', 'className="bg-white dark:bg-[#161C1A] rounded-lg relative overflow-hidden"')

    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Updated outer container in {path}")

for f in files:
    remove_outer_border(f)
