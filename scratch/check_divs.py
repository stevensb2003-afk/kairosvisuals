import sys

def check_jsx_balance(file_path):
    with open(file_path, 'r', encoding='utf8') as f:
        lines = f.readlines()

    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Very simple tag finding - works for <div> and </div>
        # and also <TabsContent, <DialogContent etc.
        # But we need to handle self-closing tags like <Input />
        
        # Simplified: just count <div and </div>
        # A real parser would be better but let's try this.
        
        # Count occurrences of '<div' that are not self-closing or part of a string
        # Actually, let's just use a counter for div tags
        
        # To be more accurate, let's search for tags using a regex-like approach
        import re
        
        # Find all start tags (not self-closing) and end tags
        # This is a heuristic.
        tags = re.findall(r'<(div|TabsContent|TabsList|TabsTrigger|Dialog|DialogContent|DialogHeader|DialogTitle|AlertDialog|AlertDialogContent|AlertDialogHeader|AlertDialogTitle|AlertDialogDescription|AlertDialogFooter|AlertDialogCancel|AlertDialogAction|Card|CardHeader|CardTitle|CardContent|Badge|Button|Select|SelectTrigger|SelectValue|SelectContent|SelectItem|Separator|Textarea|Label|Input|ArrowLeft|Edit2|LayoutDashboard|Zap|Receipt|Contact|Calendar|CheckCircle|AlertTriangle|Sparkles|MessageSquare|Building|Target|Trash2|Plus|Check|ChevronRight|Mail|Globe|TrendingUp|Loader2|User|MessageCircle|ExternalLink|Instagram|Facebook|Music2|Linkedin|Twitter|Youtube|AtSign|X|PhoneInput)\b|/(div|TabsContent|TabsList|TabsTrigger|Dialog|DialogContent|DialogHeader|DialogTitle|AlertDialog|AlertDialogContent|AlertDialogHeader|AlertDialogTitle|AlertDialogDescription|AlertDialogFooter|AlertDialogCancel|AlertDialogAction|Card|CardHeader|CardTitle|CardContent|Badge|Button|Select|SelectTrigger|SelectValue|SelectContent|SelectItem|Separator|Textarea|Label|Input|ArrowLeft|Edit2|LayoutDashboard|Zap|Receipt|Contact|Calendar|CheckCircle|AlertTriangle|Sparkles|MessageSquare|Building|Target|Trash2|Plus|Check|ChevronRight|Mail|Globe|TrendingUp|Loader2|User|MessageCircle|ExternalLink|Instagram|Facebook|Music2|Linkedin|Twitter|Youtube|AtSign|X|PhoneInput)>', line)
        
        # The regex above is flawed. Let's do a more robust one for start/end tags.
        # Start tag: <Name ... (possibly />)
        # End tag: </Name>
        
        # Let's find all tags in the line
        matches = re.finditer(r'<(/?[a-zA-Z0-9]+)(\s|/?>)', line)
        for match in matches:
            tag_name = match.group(1)
            full_match = match.group(0)
            
            # Check if self-closing
            is_self_closing = '/' in full_match and not tag_name.startswith('/')
            # Wait, <Input /> has match.group(0) as '<Input />'? No, with my regex it is '<Input ' or '<Input/>'
            # Let's refine.
            
    # Actually, let's just use a simpler script to find div imbalance specifically.
    div_depth = 0
    for i, line in enumerate(lines):
        line_num = i + 1
        # Remove comments
        line = re.sub(r'{\s*/\*.*?\*/\s*}', '', line)
        line = re.sub(r'//.*', '', line)
        
        # Find <div (not closed)
        # We need to exclude self-closing <div /> though it's rare
        starts = re.findall(r'<div\b', line)
        for _ in starts:
            # Check if this specific instance is self-closing in the same line
            # (Heuristic: look ahead for /> before another <)
            # This is hard.
            div_depth += 1
            
        ends = re.findall(r'</div>', line)
        for _ in ends:
            div_depth -= 1
            if div_depth < 0:
                print(f"ERROR: Extra </div> at line {line_num}")
                div_depth = 0 # reset to continue
                
    print(f"Final div depth: {div_depth}")

if __name__ == "__main__":
    import re
    check_jsx_balance(sys.argv[1])
