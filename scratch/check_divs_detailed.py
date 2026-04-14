import sys
import re

def check_jsx_balance(file_path):
    with open(file_path, 'r', encoding='utf8') as f:
        lines = f.readlines()

    div_depth = 0
    stack = []
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Remove comments and strings to avoid false positives
        # (This is a rough approximation)
        line = re.sub(r'{\s*/\*.*?\*/\s*}', '', line)
        line = re.sub(r'//.*', '', line)
        
        # Find <div
        starts = re.finditer(r'<div\b', line)
        for s in starts:
            # Check if self-closing <div ... />
            # We look for /> before the next < or end of line (simplified)
            rest_of_line = line[s.end():]
            is_self_closing = False
            # Find next >
            tag_end = rest_of_line.find('>')
            if tag_end != -1:
                if rest_of_line[tag_end-1:tag_end] == '/':
                    is_self_closing = True
            
            if not is_self_closing:
                div_depth += 1
                stack.append(line_num)
            
        # Find </div>
        ends = re.finditer(r'</div>', line)
        for _ in ends:
            div_depth -= 1
            if div_depth < 0:
                print(f"ERROR: Extra </div> at line {line_num}")
                div_depth = 0
            else:
                stack.pop()

    print(f"Final div depth: {div_depth}")
    if stack:
        print(f"Unclosed <div> tags started at lines: {stack}")

if __name__ == "__main__":
    check_jsx_balance(sys.argv[1])
