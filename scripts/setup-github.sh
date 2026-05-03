#!/bin/bash
# Setup GitHub Remote Script
# Usage: ./scripts/setup-github.sh <github-repo-url>

REPO_URL="$1"

if [ -z "$REPO_URL" ]; then
    echo "Usage: ./scripts/setup-github.sh <github-repo-url>"
    echo "Example: ./scripts/setup-github.sh https://github.com/username/repo.git"
    exit 1
fi

# Check if remote already exists
if git remote | grep -q origin; then
    echo "Remote 'origin' already exists. Updating URL..."
    git remote set-url origin "$REPO_URL"
else
    echo "Adding remote 'origin'..."
    git remote add origin "$REPO_URL"
fi

echo "Remote configured: $REPO_URL"
echo ""
echo "To push for the first time, run:"
echo "  git push -u origin master"
echo ""
echo "Or use the auto-push script:"
echo "  ./scripts/git-auto-push.sh"
