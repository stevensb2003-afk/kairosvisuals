
import re

def count_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple tag counting
    tags = [
        'div', 'Dialog', 'DialogContent', 'Tabs', 'TabsContent', 'Card', 
        'AlertDialog', 'AlertDialogContent', 'Button', 'TabsList', 'TabsTrigger'
    ]
    
    results = {}
    for tag in tags:
        open_tag = len(re.findall(rf'<{tag}(\s|>)', content))
        close_tag = len(re.findall(f'</{tag}>', content))
        results[tag] = (open_tag, close_tag)
    
    print("Tag counts (open, close):")
    for tag, (op, cl) in results.items():
        print(f"{tag}: {op} open, {cl} close. Delta: {op - cl}")

if __name__ == "__main__":
    count_tags('src/app/clients/[id]/page.tsx')
