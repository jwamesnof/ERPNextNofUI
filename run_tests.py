#!/usr/bin/env python
"""Run tests and print summary."""
import subprocess
import sys
import os

# Use BASE_URL from environment (set by CI workflow), default to localhost for local runs
base_url = os.environ.get("BASE_URL", "http://localhost:3000")
os.environ["BASE_URL"] = base_url

result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short"],
    capture_output=True,
    text=True,
    timeout=600
)

print("STDOUT:")
print(result.stdout)
print("\nSTDERR:")
print(result.stderr)
print(f"\nReturn code: {result.returncode}")

# Print summary line
lines = result.stdout.split("\n")
for line in lines:
    if "passed" in line or "failed" in line or "error" in line:
        print(line)
