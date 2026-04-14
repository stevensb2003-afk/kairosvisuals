
import re

def check_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    # Simplified regex for tags
    tag_pattern = re.compile(r'<(/?)([A-Z][a-zA-Z0-9]*|div|p|h[1-6]|ul|li|span|table|thead|tbody|tr|th|td|tfoot|Button|Badge|Card|Input|Label|Tabs|TabsList|TabsTrigger|TabsContent|Select|Dialog|AlertDialog)[^>]*>')
    
    # We also need to track { ( 
    
    for i, line in enumerate(lines):
        line_num = i + 1
        # Find all tags in line
        for match in tag_pattern.finditer(line):
            is_closing = match.group(1) == '/'
            tag_name = match.group(2)
            
            # Skip self-closing tags if they end with />
            if not is_closing and match.group(0).endswith('/>'):
                continue
                
            if is_closing:
                if not stack:
                    print(f"Error: Closing tag </{tag_name}> at line {line_num} has no opening tag.")
                else:
                    last_tag, last_line = stack.pop()
                    if last_tag != tag_name:
                        print(f"Error: Mismatched tag. Found </{tag_name}> at line {line_num}, but expected </{last_tag}> (opened at line {last_line}).")
            else:
                stack.append((tag_name, line_num))
                
        # Also track braces for JS expressions
        # This is harder because of strings, but let's try a simple count
        # (Though we shouldn't really mix them, but tsc errors suggest they are related)

    if stack:
        print("\nRemaining open tags in stack:")
        for tag, line in stack:
            print(f"  <{tag}> opened at line {line}")

if __name__ == "__main__":
    import sys
    path = r"c:\Users\Lenovo Flex i7\Documents\Apps\KairosVisuals\src\app\clients\[id]\page.tsx"
    check_tags(path)
