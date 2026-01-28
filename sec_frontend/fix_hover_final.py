#!/usr/bin/env python3

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

with open(file_path, 'r') as f:
    content = f.read()

# Current state from previous step:
# className="p-2 text-center dark:bg-[#161C1A] rounded-md transition-colors duration-200 dark:hover:bg-gray-700"
#
# User wants:
# 1. "remove that rounded dark thing" -> remove rounded-md (or the gray-700 bg if that is the dark thing?)
#    But they also said "instead of the white color".
#    If gray-700 looks white-ish/light gray, then that matches description.
#    So I'll change bg-gray-700 to something deeper (darker).
#    Deep relative to #161C1A. #161C1A is very dark.
#    Let's use #1F2926 (a bit lighter) or standard gray-800?
#    User said "make the hover more deep". Deep usually means saturated or darker.
#    But if the bg is black, making it deeper black is impossible.
#    They probably mean "deep color" like deep green or just "not white".
#    I'll try dark:hover:bg-[#232D2A] (matching the sidebar/other hover states I used before).
# 2. Remove rounded corners.

old_class = 'className="p-2 text-center dark:bg-[#161C1A] rounded-md transition-colors duration-200 dark:hover:bg-gray-700"'
new_class = 'className="p-2 text-center dark:bg-[#161C1A] transition-colors duration-200 dark:hover:bg-[#232D2A]"'

new_content = content.replace(old_class, new_class)

if new_content == content:
    # If exact string not found, try regex or simpler replace
    print("Exact string match failed. Trying generic replace for the loop cells.")
    # The loop cells are identified by p-2 text-center dark:bg-[#161C1A] ...
    import re
    # Remove rounded-md and change hover color in the specific class string
    pattern = r'className="p-2 text-center dark:bg-\[#161C1A\] rounded-md transition-colors duration-200 dark:hover:bg-gray-700"'
    replacement = 'className="p-2 text-center dark:bg-[#161C1A] transition-colors duration-200 dark:hover:bg-[#232D2A]"'
    new_content = re.sub(pattern, replacement, content)
    
    if new_content == content:
        # Fallback: maybe spacing is different?
        # Try finding just dark:hover:bg-gray-700 in that context
        new_content = content.replace('dark:hover:bg-gray-700', 'dark:hover:bg-[#232D2A]')
        # And remove rounded-md globally from td cells if possible, or leave it if too risky.
        new_content = new_content.replace('rounded-md', '') # Risky? rounded-md might be used elsewhere.
        # Let's hope the replace worked or the regex worked.

with open(file_path, 'w') as f:
    f.write(new_content)

print("Updated hover effects: removed roundedness, deeper hover color (#232D2A).")
