#!/usr/bin/env python3
import re

file_path = "/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

# We need to read the file and replace specific patterns
# 1. Make borders visible. 
#    Current: dark:border-[#161C1A] (which matches bg, so invisible)
#    Target: dark:border-white/10 (subtle) or dark:border-gray-700 (standard)
#    Let's use dark:border-gray-800 for a subtle but visible line against #161C1A, or #2A3430

# 2. Make inputs visible.
#    Current: dark:bg-[#161C1A] (matches bg)
#    Target: dark:bg-[#1C2422] (slightly lighter) or dark:bg-black/20 (darker)
#    And give them a visible border.

# 3. Remove hover from breakdown cells.
#    Look for: hover:bg-blue-50 dark:hover:bg-[#232D2A]
#    Target: remove the class or set to hover:bg-transparent

with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix Borders
# Replace the invisible border with a visible one
content = content.replace("dark:border-[#161C1A]", "dark:border-gray-700")

# 2. Fix Inputs
# Inputs likely have the class "w-full ... text-center border ... rounded bg-..."
# We want to change their specific bg and border.
# The previous script replaced "dark:bg-green-900/20" with "dark:bg-[#161C1A]" in inputs.
# Let's target the input class string pattern or just replace the specific combination if unique enough.
# Actually, standardizing the input background to be distinct is better.
# Let's search for the input className and update it.
# We can just do a global replace for the input background if we can identify it.
# Or better, let's just make the standard dark bg for inputs distinct.
# If we change "dark:bg-[#161C1A]" globally, we change the table bg too, which is NOT what we want.
# We need to target the INPUTS specifically. 
# Inputs usually have "rounded" and "focus:ring" classes.
# Let's try to match the input className pattern using regex for precision.

# Regex to find input/div className that has the dark bg and focus rings
# Pattern: className="... dark:bg-[#161C1A] ... focus:ring-2 ..."
# We will change dark:bg-[#161C1A] to dark:bg-[#232B28] (lighter) inside these matches.

def replacer(match):
    s = match.group(0)
    # Replace background in inputs to be lighter/distinct
    s = s.replace("dark:bg-[#161C1A]", "dark:bg-[#0f1211]") # Darker for inputs? or Lighter? User said "make input section ... more visible". 
    # Usually inputs are distinct. Let's try dark:bg-[#1E2522] (lighter).
    # And ensure border is visible.
    return s

# Regex for inputs (approximation)
# Matches classNames containing focus rings which are typical for inputs in this file
input_pattern = r'className="[^"]*focus:ring-2[^"]*"'
# We'll use a specific function to handle the replacement manually to avoid regex complexity if possible, 
# but python regex is fine.

# Actually, simply replacing the specific string combination for inputs might be safer if they are consistent.
# In the previous step, I blindly replaced generic classes. 
# Let's look at the file content for inputs. They usually look like:
# className="w-full ... dark:bg-[#161C1A] ... text-gray-900 ..."
# Let's try to find them by the "w-full" and "p-2" and "rounded" flags common in inputs.

# Instead of regex, let's do this:
# The inputs have `rounded` property, table cells don't usually (except the container).
# Let's replace `rounded bg-green-50 dark:bg-[#161C1A]` logic if we can match it?
# Wait, I replaced `dark:bg-green-900/20` with `dark:bg-[#161C1A]`.
# So the inputs now have `dark:bg-[#161C1A]`.
# Table rows/cells generally don't have `rounded` on the `td` or `tr` usually.
# So if I target `dark:bg-[#161C1A]` inside a string that also has `rounded`, I'm likely hitting an input or the main container.
# Main container: `rounded-lg`. Inputs: `rounded`.
# Let's be careful.

# Let's just use string replacement for the specific input definition if possible.
# The inputs usually are:
# className="w-full ... text-center border ... rounded ... dark:bg-[#161C1A] ..."
# I will use a regex to update any class string that contains "focus:ring" (inputs) 
# and change its background and border.

content = re.sub(
    r'(className="[^"]*focus:ring[^"]*dark:bg-)\[#161C1A\]', 
    r'\1[#111615]', # Darker input background 
    content
)
# Make input borders visible
content = re.sub(
    r'(className="[^"]*focus:ring[^"]*dark:border-)gray-700', # We just changed all borders to gray-700 above
    r'\1gray-600', # Slightly lighter/more visible border for inputs?
    content
)


# 3. Remove hover from breakdown cells
# Class is likely: `hover:bg-blue-50 dark:hover:bg-[#232D2A]`
# We want to remove `dark:hover:bg-[#232D2A]` and `hover:bg-blue-50`.
# Or just make them transparent.
content = content.replace("hover:bg-blue-50", "")
content = content.replace("dark:hover:bg-[#232D2A]", "")


with open(file_path, 'w') as f:
    f.write(content)

print("Refined dark mode styles: visible borders, distinct inputs, removed hover.")
