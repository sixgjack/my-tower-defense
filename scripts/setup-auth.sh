#!/bin/bash
# Setup Authentication for GitHub
# This script helps set up secure authentication methods

echo "🔐 GitHub Authentication Setup"
echo "=============================="
echo ""

# Check current remote
echo "Current remote URL:"
git remote get-url origin
echo ""

# Check for GitHub CLI
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI is installed"
    if gh auth status &> /dev/null; then
        echo "✅ GitHub CLI is authenticated"
        echo ""
        echo "To use GitHub CLI for authentication:"
        echo "  git remote set-url origin https://github.com/sixgjack/my-tower-defense.git"
        echo "  (GitHub CLI will handle authentication automatically)"
    else
        echo "⚠️  GitHub CLI is not authenticated"
        echo ""
        echo "To authenticate GitHub CLI:"
        echo "  gh auth login"
    fi
else
    echo "⚠️  GitHub CLI is not installed"
    echo "  Install: https://cli.github.com/"
fi

echo ""

# Check for SSH keys
if [ -f ~/.ssh/id_ed25519.pub ] || [ -f ~/.ssh/id_rsa.pub ]; then
    echo "✅ SSH keys found"
    SSH_KEY=$(ls ~/.ssh/id_*.pub 2>/dev/null | head -1)
    echo "  Key: $SSH_KEY"
    echo ""
    echo "To use SSH authentication:"
    echo "  git remote set-url origin git@github.com:sixgjack/my-tower-defense.git"
    echo ""
    echo "Make sure your SSH key is added to GitHub:"
    echo "  1. Copy your public key: cat $SSH_KEY"
    echo "  2. Add it at: https://github.com/settings/keys"
else
    echo "⚠️  No SSH keys found"
    echo ""
    echo "To create SSH keys:"
    echo "  ssh-keygen -t ed25519 -C \"your_email@example.com\""
    echo "  cat ~/.ssh/id_ed25519.pub"
    echo "  (Then add to GitHub: https://github.com/settings/keys)"
fi

echo ""
echo "=============================="
echo "Recommended: Use SSH keys for best security"
echo "Alternative: Use GitHub CLI for convenience"
