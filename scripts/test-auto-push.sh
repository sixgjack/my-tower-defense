#!/bin/bash
# Test script to verify auto-push works
# This creates a small test commit and pushes it

echo "Testing auto-push functionality..."

# Make a small change to test
echo "# Auto-push test $(date)" >> .git-auto-push-test.txt

git add .git-auto-push-test.txt
git commit -m "Test: Auto-push functionality" 2>&1

if [ $? -eq 0 ]; then
    ./scripts/git-auto-push.sh "Test: Auto-push after commit"
    echo "✅ Auto-push test complete!"
else
    echo "No changes to commit"
fi
