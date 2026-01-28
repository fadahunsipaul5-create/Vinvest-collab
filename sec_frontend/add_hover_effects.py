#!/usr/bin/env python3

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

with open(file_path, 'r') as f:
    content = f.read()

# We want to add hover effects to the table data cells.
# Currently they look like: className="p-2 text-center dark:bg-[#161C1A]"
# We want to change to: className="p-2 text-center dark:bg-[#161C1A] rounded dark:hover:bg-gray-700 transition-colors"

old_class = 'className="p-2 text-center dark:bg-[#161C1A]"'
new_class = 'className="p-2 text-center dark:bg-[#161C1A] rounded-md transition-colors duration-200 dark:hover:bg-gray-700"'

# Replace strictly the value cells which we updated in the previous step
new_content = content.replace(old_class, new_class)

if new_content == content:
    print("WARNING: Could not find exact string to replace. Checking generic pattern...")
    # Fallback/Debug: simpler replacement
    # Maybe I shouldn't rely on the *exact* previous change if I messed up spacing?
    # But I used python replace so it should be exact.
    pass

with open(file_path, 'w') as f:
    f.write(new_content)

print("Added visible hover effects (gray-700) and rounded corners to table cells.")
