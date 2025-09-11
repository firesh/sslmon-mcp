# Installation Guide for AI Agents

This guide provides step-by-step instructions for AI agents like Cline to install and configure the SSL Monitoring MCP Server.

## Quick Installation

### Using Remote HTTP MCP Server

- Name: `sslmon`
- URL: `https://sslmon.dev/mcp`

### Using NPX (Local, Recommended)

1. **For Claude Desktop on Mac/Linux:**
   ```bash
   claude mcp add sslmon -- npx -y sslmon-mcp
   ```

2. **For Claude Desktop on Windows:**
   ```bash
   claude mcp add sslmon -- cmd /c npx -y sslmon-mcp
   ```

### Manual Configuration (Local MCP server)

If the above commands don't work, manually add this configuration to your MCP settings file:

```json
{
  "mcpServers": {
    "sslmon": {
      "command": "npx",
      "args": ["-y", "sslmon-mcp"],
      "env": {}
    }
  }
}
```

```toml
[mcp_servers.sslmon]
command = "npx"
args = ["-y", "sslmon-mcp"]
```

## Verification

After installation, verify the server is working by testing these tools:

1. **Test Domain Info:**
   - Use the `get_domain_info` tool with a domain like "google.com"
   - Should return registration and expiration dates

2. **Test SSL Certificate Info:**
   - Use the `get_ssl_cert_info` tool with a domain like "google.com"
   - Should return certificate validity information

## Troubleshooting

- **Node.js Requirement:** Ensure Node.js 18+ is installed
- **Network Access:** The server needs internet access for domain/SSL queries
- **Firewall:** Ensure outbound connections on port 443 (HTTPS) are allowed

## No Configuration Required

This MCP server requires no API keys or additional configuration. It uses public WHOIS services and standard SSL/TLS connections.
