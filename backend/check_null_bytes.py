import os
import glob

# Find all Python files in migrations
migration_dirs = glob.glob('apps/*/migrations/**/*.py', recursive=True)

for filepath in migration_dirs:
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            if b'\x00' in content:
                print(f'NULL BYTES FOUND: {filepath}')
            else:
                print(f'OK: {filepath}')
    except Exception as e:
        print(f'ERROR reading {filepath}: {e}')
