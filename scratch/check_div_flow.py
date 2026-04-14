import sys
import re

def check_div_flow(file_path):
    with open(file_path, 'r', encoding='utf8') as f:
        lines = f.readlines()

    div_depth = 0
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Simple regex for <div and </div>
        line = re.sub(r'{\s*/\*.*?\*/\s*}', '', line)
        line = re.sub(r'//.*', '', line)
        
        # Avoid self-closing <div ... />
        # Match <div but not followed by ... />
        open_tags = len(re.findall(r'<div(?![^>]*/>)', line))
        close_tags = len(re.findall(r'</div>', line))
        
        if open_tags > 0 or close_tags > 0:
            div_depth += open_tags - close_tags
            if open_tags != close_tags:
                print(f"L{line_num:4}: depth {div_depth:3} (+{open_tags} -{close_tags}) | {line.strip()[:60]}")

    print(f"\nFinal div depth: {div_depth}")

if __name__ == "__main__":
    check_div_flow(sys.argv[1])
