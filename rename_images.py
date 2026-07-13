import os
import glob
from pathlib import Path

# Move folder if it exists
app_dir = Path('e:/ANTIGRAVITY/humandesignchart')
manus_dir = app_dir / 'client' / 'public' / 'manus-storage'
images_dir = app_dir / 'client' / 'public' / 'images'

if manus_dir.exists():
    try:
        manus_dir.rename(images_dir)
        print('Renamed directory to images')
    except Exception as e:
        print('Error renaming:', e)
else:
    print('manus-storage dir not found')

# Update references in client/src
target_files = glob.glob('e:/ANTIGRAVITY/humandesignchart/client/src/**/*.tsx', recursive=True) + glob.glob('e:/ANTIGRAVITY/humandesignchart/client/src/**/*.ts', recursive=True)
count = 0
for filepath in target_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if '/manus-storage/' in content:
            content = content.replace('/manus-storage/', '/images/')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {filepath}')
            count += 1
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print(f'Done! Updated {count} files.')
