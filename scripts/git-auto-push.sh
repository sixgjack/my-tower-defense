#!/bin/bash
# Git Auto-Push Script
# Automatically commits and pushes changes after successful updates

COMMIT_MSG="${1:-Auto-commit: Updates from development session}"

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
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git push origin "$CURRENT_BRANCH" || {
        echo "Warning: Push failed. This is normal if remote is not configured yet."
        echo "To set up remote, run: git remote add origin <your-repo-url>"
        exit 0
    }
    echo "✅ Successfully pushed to GitHub"
else
    echo "⚠️  No remote 'origin' configured."
    echo "   To set up, run: git remote add origin <your-repo-url>"
    echo "   Then run: git push -u origin master"
fi

echo "Auto-commit successful: $COMMIT_MSG"
