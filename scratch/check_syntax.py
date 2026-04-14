import sys

with open(r'c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\quotations\create\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Check braces
open_braces = content.count('{')
close_braces = content.count('}')
print(f"Braces: {open_braces} open, {close_braces} close")

# Check brackets
open_sq = content.count('[')
close_sq = content.count(']')
print(f"Square brackets: {open_sq} open, {close_sq} close")

# Check parens
open_par = content.count('(')
close_par = content.count(')')
print(f"Parens: {open_par} open, {close_par} close")

# List lines with possible issues (missing semicolons at end of blocks are usually fine in JS, but let's see)
lines = content.split('\n')
for i, line in enumerate(lines):
    if '<<' in line or '>>' in line:
        print(f"Line {i+1} might have conflict markers: {line}")
