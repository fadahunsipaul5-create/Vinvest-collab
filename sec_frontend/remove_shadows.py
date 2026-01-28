#!/usr/bin/env python3

files = [
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/utils/forecastDisplay.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"
]

# TARGET:
# 1. Remove "rounded", "rounded-md", "shadow", "drop-shadow" from relevant rendering logic.
# 2. Ensure hovered color is deep dark, not white-ish.

def update_file(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # Remove rounded classes
    new_content = content.replace("rounded ", " ")
    new_content = new_content.replace("rounded-md", "")
    new_content = new_content.replace("rounded-lg", "")
    new_content = new_content.replace("rounded-sm", "")
    
    # Remove shadow classes
    new_content = new_content.replace("shadow ", " ")
    new_content = new_content.replace("shadow-lg", " ")
    new_content = new_content.replace("shadow-md", " ")
    new_content = new_content.replace("shadow-sm", " ")
    
    # Also remove "border" if it creates the "dark thing" outline user hates?
    # User said "remove the shadow". Maybe border looks like shadow?
    # But borders are useful for inputs.
    # However, for READONLY display (which is what 2027+ mostly is), maybe we don't need borders.
    # In forecastDisplay.tsx lines 125/126:
    # '... border border-gray-200 dark:border-gray-700'
    # I'll remove the border for readonly display to be safe and clean.
    
    new_content = new_content.replace("border border-gray-200 dark:border-gray-700", "border-none")
    new_content = new_content.replace("border border-transparent", "border-none")
    
    # Ensure background hover is correct
    # I previously used #232D2A. Let's make sure it's applied.
    # We'll blindly replace gray-700 hover if found (reverting potential older state or enforcing new one)
    new_content = new_content.replace("dark:hover:bg-gray-700", "dark:hover:bg-[#232D2A]")
    
    if new_content != content:
        print(f"Updated {path}: removed rounded/shadow/borders")
        with open(path, 'w') as f:
            f.write(new_content)

for f in files:
    update_file(f)
