#!/bin/bash
# Auto-commit and push script for successful updates
# Usage: ./scripts/auto-commit.sh "Commit message"

COMMIT_MSG="${1:-Auto-commit: Updates from development}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Check if there are changes to commit
if git diff-index --quiet HEAD -- && git diff-index --cached --quiet HEAD --; then
    echo "No changes to commit"
    exit 0
fi

# Add all changes
git add -A

# Commit with the provided message
git commit -m "$COMMIT_MSG" || exit 1

# Push to remote (if configured)
if git remote | grep -q origin; then
    git push || echo "Warning: Push failed (remote may not be configured or network issue)"
else
    echo "Warning: No remote 'origin' configured. Run: git remote add origin <url>"
fi

echo "Auto-commit successful: $COMMIT_MSG"
