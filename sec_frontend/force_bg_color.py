#!/usr/bin/env python3

files = [
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx",
    "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/utils/forecastDisplay.tsx"
]

# We want to replace any existing bg class in the relevant sections with !bg-[#161C1A]
# In forecastDisplay.tsx:
#   const inputClasses = ... dark:bg-[#161C1A] ...
#   const baseClasses = ... dark:bg-[#161C1A] ...
# In IncomeStatementTable.tsx:
#   inputs at lines 525, 588, 742... have dark:bg-[#161C1A]

def update_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Force !important on the background color to override anything else
    # We replace "dark:bg-[#161C1A]" with "dark:!bg-[#161C1A]"
    # And just in case, replace any "dark:bg-[...]" that might be lingering if my regex failed before? 
    # (unlikely given grep, but good to be safe)
    
    # First, blindly replace the one we know is there
    new_content = content.replace("dark:bg-[#161C1A]", "dark:!bg-[#161C1A]")
    
    if new_content != content:
        print(f"Updated {path} with !important")
        with open(path, 'w') as f:
            f.write(new_content)
    else:
        print(f"No changes in {path} (maybe already updated or not found)")

for f in files:
    update_file(f)
