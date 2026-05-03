# GitHub CLI Setup Instructions

## GitHub CLI Installation ✅
GitHub CLI (`gh`) has been installed on your system.

## Authentication Required

You need to authenticate GitHub CLI. Run this command in your terminal:

```bash
gh auth login
```

### Interactive Setup Process:

1. **GitHub.com or GitHub Enterprise Server?**
   - Select: `GitHub.com` (option 1)

2. **Protocol**
   - Select: `HTTPS` (option 1)

3. **Authenticate Git with your GitHub credentials?**
   - Select: `Yes` (option Y)

4. **How would you like to authenticate GitHub CLI?**
   - Select: `Login with a web browser` (option 1)

5. **Paste your one-time code:**
   - A code will be displayed (e.g., `ABCD-1234`)
   - A URL will be displayed
   - Open the URL in your browser
   - Enter the code when prompted
   - Authorize GitHub CLI

6. **Done!** GitHub CLI is now authenticated.

### Alternative: Token-based authentication

If browser login doesn't work, you can use a token:

```bash
gh auth login --with-token < token.txt
```

Where `token.txt` contains your GitHub Personal Access Token (create a new one at https://github.com/settings/tokens).

## After Authentication

Once authenticated, GitHub CLI will automatically handle Git authentication. You can:

1. **Verify authentication:**
   ```bash
   gh auth status
   ```

2. **Configure Git to use GitHub CLI:**
   ```bash
   gh auth setup-git
   ```

3. **Test pushing:**
   ```bash
   git push
   ```

4. **Use auto-push scripts:**
   ```bash
   ./scripts/git-auto-push.sh "Your commit message"
   ```

## Benefits

- ✅ Secure authentication (no tokens in git config)
- ✅ Automatic credential management
- ✅ Works with git hooks and auto-push scripts
- ✅ No need to store passwords/tokens in plain text
