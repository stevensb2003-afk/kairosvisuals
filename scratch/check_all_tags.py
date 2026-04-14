import sys
import re

def check_all_tags_balance(file_path):
    with open(file_path, 'r', encoding='utf8') as f:
        lines = f.readlines()

    stack = []
    
    # Heuristic: find all <Tag and </Tag>
    # Ignore self-closing <Tag ... />
    
    for i, line in enumerate(lines):
        line_num = i + 1
        line = re.sub(r'{\s*/\*.*?\*/\s*}', '', line)
        line = re.sub(r'//.*', '', line)
        
        # Find all tags
        # This regex matches <TagName or </TagName
        matches = re.finditer(r'<(/?[a-zA-Z0-9]+)', line)
        for m in matches:
            tag = m.group(1)
            full_tag_match = line[m.start():]
            # Find the end of this tag definition
            end_bracket = full_tag_match.find('>')
            if end_bracket == -1: continue # Multi-line tag start, handled by heuristic
            
            tag_content = full_tag_match[:end_bracket+1]
            
            if tag.startswith('/'):
                # Closing tag
                name = tag[1:]
                if not stack:
                    print(f"ERROR: Extra closing tag </{name}> at line {line_num}")
                else:
                    last_name, last_line = stack.pop()
                    if last_name != name:
                        print(f"ERROR: Mismatched tag: opened <{last_name}> at {last_line}, closed </{name}> at {line_num}")
                        # Push back to try to recover? No, just keep going.
            else:
                # Opening tag
                # Check if self-closing
                if tag_content.endswith('/>'):
                    continue
                
                # Heuristic for multi-line self-closing: if it's a known component that often self-closes
                # and the line doesn't end with >, we'd need a more complex parser.
                # But for now, let's just assume if it doesn't end with /> it's opening.
                stack.append((tag, line_num))

    print(f"Final stack size: {len(stack)}")
    for name, line in stack:
        print(f"Unclosed tag <{name}> started at line {line}")

if __name__ == "__main__":
    check_all_tags_balance(sys.argv[1])
