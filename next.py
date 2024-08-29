import os
import concurrent.futures
from pathlib import Path
import mimetypes
import re

# Initialize mimetypes
mimetypes.init()

# Files to ignore
IGNORE_FILES = {
    'next.config.js', 'package.json', 'README.md', 'tsconfig.json',
    '.gitignore', '.eslintrc.json', 'package-lock.json', 'yarn.lock'
}

# Directories to ignore
IGNORE_DIRS = {
    'node_modules', '.next', 'out', 'build', '.git'
}

# Important file patterns
IMPORTANT_PATTERNS = [
    r'pages/.*\.(js|jsx|ts|tsx)$',
    r'components/.*\.(js|jsx|ts|tsx)$',
    r'styles/.*\.(css|scss)$',
    r'lib/.*\.(js|jsx|ts|tsx)$',
    r'api/.*\.(js|ts)$',
    r'hooks/.*\.(js|jsx|ts|tsx)$',
    r'context/.*\.(js|jsx|ts|tsx)$',
]

def is_important_file(file_path):
    """Check if the file is important based on patterns."""
    str_path = str(file_path)
    return any(re.search(pattern, str_path) for pattern in IMPORTANT_PATTERNS)

def is_relevant_file(file_path):
    """Check if the file is relevant for analysis."""
    name = file_path.name
    if name.startswith('.') or name in IGNORE_FILES:
        return False
    
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type:
        return mime_type.startswith('text') or mime_type == 'application/json'
    return True

def get_file_summary(file_path):
    """Get a summary of the file content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        lines = content.split('\n')
        total_lines = len(lines)
        non_empty_lines = len([line for line in lines if line.strip()])
        
        # Extract imports and main component/function name
        imports = [line for line in lines if line.strip().startswith('import')]
        main_component = next((line for line in lines if re.search(r'(function|const|class)\s+\w+', line)), "No main component found")
        
        summary = f"Lines: {total_lines} (Non-empty: {non_empty_lines})\n"
        summary += f"Imports: {len(imports)}\n"
        summary += f"Main component: {main_component.strip()}\n"
        return summary
    except Exception as e:
        return f"[Error reading file: {str(e)}]"

def process_file(file_path):
    """Process a single file."""
    rel_path = file_path.relative_to(project_root)
    if is_relevant_file(file_path):
        if is_important_file(file_path):
            content = get_file_summary(file_path)
            return str(rel_path), content, True
        return str(rel_path), "", False
    else:
        return str(rel_path), "[File type not analyzed]", False

def analyze_nextjs_project(root_dir):
    global project_root
    project_root = Path(root_dir)
    project_structure = []
    file_contents = []

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        path = Path(root)
        level = len(path.relative_to(project_root).parts)
        indent = '  ' * level
        project_structure.append(f"{indent}{path.name}/")
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [executor.submit(process_file, path / file) for file in files]
            for future in concurrent.futures.as_completed(futures):
                rel_path, content, is_important = future.result()
                project_structure.append(f"{indent}  {Path(rel_path).name}")
                if is_important:
                    file_contents.append((rel_path, content))

    return project_structure, file_contents

def save_analysis(project_structure, file_contents, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("Project Structure:\n")
        f.write("\n".join(project_structure))
        f.write("\n\nImportant File Summaries:\n")
        for rel_path, content in file_contents:
            f.write(f"\n--- {rel_path} ---\n")
            f.write(content)

def main():
    root_dir = os.getcwd()  # Assume the script is run from the project root
    output_file = 'nextjs_project_analysis.txt'
    print("Analyzing Next.js project...")
    project_structure, file_contents = analyze_nextjs_project(root_dir)
    save_analysis(project_structure, file_contents, output_file)
    print(f"Analysis complete. Results saved to {output_file}")

if __name__ == "__main__":
    main()