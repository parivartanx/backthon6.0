import os
import ast

def test_engine_imports_no_agents():
    """Ensure app/engine never imports from app/agents or google."""
    engine_dir = os.path.join(os.path.dirname(__file__), "..", "app", "engine")
    for root, _, files in os.walk(engine_dir):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                tree = ast.parse(content)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            assert not alias.name.startswith("app.agents"), f"Forbidden import in {file}"
                            assert not alias.name.startswith("google."), f"Forbidden import in {file}"
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            assert not node.module.startswith("app.agents"), f"Forbidden import in {file}"
                            assert not node.module.startswith("google."), f"Forbidden import in {file}"
