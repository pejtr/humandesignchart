import glob
import re

files = [
    'e:/ANTIGRAVITY/humandesignchart/client/src/pages/Blog.tsx',
    'e:/ANTIGRAVITY/humandesignchart/client/src/pages/BlogArticle.tsx',
    'e:/ANTIGRAVITY/humandesignchart/client/src/pages/Home.tsx',
    'e:/ANTIGRAVITY/humandesignchart/client/src/pages/AiGuide.tsx'
]

pattern_link_button = re.compile(
    r'<Link ([^>]*)>\s*<Button([^>]*)>(.*?)</Button>\s*</Link>',
    re.DOTALL
)

count = 0
for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        def replacer(match):
            link_attrs = match.group(1)
            btn_attrs = match.group(2)
            inner = match.group(3)
            # Add asChild directly if not present
            if 'asChild' not in btn_attrs:
                btn_attrs = btn_attrs.rstrip() + ' asChild'
            return f'<Button{btn_attrs}>\n              <Link {link_attrs}>{inner}</Link>\n            </Button>'

        new_content, num_subs = pattern_link_button.subn(replacer, content)
        if num_subs > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {num_subs} buttons in {filepath}')
            count += num_subs
    except Exception as e:
        print(e)
print(f'Total replaced: {count}')
