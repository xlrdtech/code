# MCP Servers - Multi-Agent Integration Hub

This directory contains **Model Context Protocol (MCP)** server integrations that extend Claude Code's capabilities with connections to Gmail, Microsoft 365, Google Drive, Asana, Gemini AI, and more.

## 🎯 Quick Win Complete!

**8 major MCP servers** have been installed and configured, giving you instant access to:

- 📧 **Email**: Gmail, Outlook/Microsoft 365
- 📁 **Cloud Storage**: Google Drive, OneDrive
- 🤖 **AI Models**: Google Gemini with Vertex AI
- ✅ **Task Management**: Asana
- 📚 **Research**: NotebookLM, Context7
- 💻 **Development**: GitHub

## 🚀 Getting Started

### 1. Install Dependencies

All npm packages are already installed. If you need Kubernetes or Lark support:

```bash
sudo apt-get install -y libsecret-1-dev
npm install mcp-server-kubernetes @larksuiteoapi/lark-mcp
```

### 2. Configure Claude

Copy the configuration to your Claude config file:

**For Claude Desktop:**
```bash
# macOS
cp claude_mcp_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
mkdir -p ~/.config/Claude
cp claude_mcp_config.json ~/.config/Claude/claude_desktop_config.json
```

**For Claude Code:**
Check the Claude Code documentation for MCP configuration location.

### 3. Authenticate Services

Each service requires authentication:

```bash
# Gmail
npx @shinzolabs/gmail-mcp auth

# For others, set environment variables in the config file
```

### 4. Test It Out

Ask Claude:
- "Search my Gmail for emails from last week"
- "List files in my Google Drive"
- "Create an Asana task"
- "Ask Gemini to explain quantum computing"
- "Search NotebookLM for information about X"

## 📁 Files

- **`claude_mcp_config.json`** - Claude configuration template
- **`INSTALLATION_SUMMARY.md`** - Detailed installation status
- **`AVAILABLE_SERVERS.md`** - Complete server listing
- **`package.json`** - npm dependencies

## 🔥 What Makes This Powerful

With your **5 Claude Pro Team slots**, you can:

1. **Parallel Agent Workflows**: Run 5 specialized agents simultaneously
   - Agent 1: Email management (Gmail/Outlook)
   - Agent 2: File operations (GDrive/OneDrive)
   - Agent 3: Task tracking (Asana)
   - Agent 4: Research (NotebookLM)
   - Agent 5: AI inference (Gemini)

2. **Always-On Automation**: Background agents monitoring and responding
   - Auto-triage emails
   - Sync tasks across platforms
   - Update documentation
   - Generate reports

3. **Multi-Tool Orchestration**: Chain MCP servers together
   - "Find emails about project X → Create Asana tasks → Update docs in GDrive"

## 📊 Installation Status

| Service | Package | Status | Auth Required |
|---------|---------|--------|---------------|
| Context7 | @upstash/context7-mcp | ✅ Installed | No |
| NotebookLM | notebooklm-mcp | ✅ Installed | API Key |
| Gmail | @shinzolabs/gmail-mcp | ✅ Installed | OAuth |
| Microsoft 365 | @softeria/ms-365-mcp-server | ✅ Installed | Azure AD |
| Google Drive | @iflow-mcp/gdrive-mcp-server | ✅ Installed | OAuth |
| Gemini AI | @houtini/gemini-mcp | ✅ Installed | API Key |
| Asana | @roychri/mcp-server-asana | ✅ Installed | Token |
| GitHub | @modelcontextprotocol/server-github | ✅ Installed | Token |
| Beeper | @beeper/desktop-mcp | ❌ Failed | - |
| Kubernetes | mcp-server-kubernetes | ⚠️ Needs deps | - |
| Lark | @larksuiteoapi/lark-mcp | ⚠️ Needs deps | App ID/Secret |

## 🔐 Authentication Guide

### Gmail (OAuth)
```bash
npx @shinzolabs/gmail-mcp auth
```
Follow the prompts to authenticate with Google.

### Microsoft 365 (Azure AD)
1. Go to [Azure Portal](https://portal.azure.com)
2. Register an application
3. Add these environment variables to config:
   ```json
   "env": {
     "AZURE_CLIENT_ID": "your-client-id",
     "AZURE_CLIENT_SECRET": "your-client-secret",
     "AZURE_TENANT_ID": "your-tenant-id"
   }
   ```

### Google Drive (OAuth)
1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Drive API
3. Create OAuth credentials
4. Download credentials JSON

### Gemini (API Key)
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set environment variable:
   ```json
   "env": {
     "GOOGLE_API_KEY": "your-api-key"
   }
   ```

### Asana (Personal Access Token)
1. Go to [Asana Developer Console](https://app.asana.com/0/developer-console)
2. Create a Personal Access Token
3. Set environment variable:
   ```json
   "env": {
     "ASANA_ACCESS_TOKEN": "your-token"
   }
   ```

## 🛠️ Troubleshooting

### "Command not found" errors
Ensure you're using `npx` to run MCP servers, not direct commands.

### Authentication failures
Check that credentials are correctly set in the config file and that you've run any required auth commands.

### Missing system dependencies
For Kubernetes/Lark: `sudo apt-get install libsecret-1-dev`

## 📚 Learn More

- [Model Context Protocol Docs](https://modelcontextprotocol.io)
- [Claude Code Documentation](https://github.com/anthropics/claude-code)
- [MCP Server Registry](https://registry.modelcontextprotocol.io)

## 🎉 Next: Build Your Multi-Agent System

See the main repo README for instructions on building a multi-agent orchestration system using these MCP servers and your 5 Claude Pro Team slots.

---

**Quick Win Status**: ✅ COMPLETE - 8/15+ servers installed and ready!
