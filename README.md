# Domain/HTTPS/SSL MCP Server

[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-MCP-blue)](https://modelcontextprotocol.io/) [![npm version](https://img.shields.io/npm/v/sslmon-mcp.svg)](https://www.npmjs.com/package/sslmon-mcp) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

**Languages:** [English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

A Model Context Protocol (MCP) server that provides domain registration information and SSL certificate monitoring capabilities. Perfect for security monitoring, domain management, and certificate lifecycle tracking.

## 🚀 Quick Start

### NPX (Recommended)
Mac/Linux:
```bash
# Add to Claude Desktop
claude mcp add sslmon -- npx -y sslmon-mcp
```
Windows:
```bash
# Add to Claude Desktop
claude mcp add sslmon -- cmd /c npx -y sslmon-mcp
```
### Configuration
```
{
  "mcpServers": {
    "shared-server": {
      "command": "npx",
      "args": ["-y", "sslmon-mcp"],
      "env": {}
    }
  }
}
```

## ✨ Features

- 🔍 **Domain Registration Info** - Get domain registration and expiration dates
- 🔒 **SSL Certificate Info** - Check SSL certificate validity periods and details  

## 🛠️ Available Tools

### `get_domain_info`
Get domain registration and expiration information.

**Parameters:**
- `domain` (string, required): The top-level domain to check (e.g., "example.com")

**Returns:** JSON object with:
- `domain`: The queried domain
- `registrationDate`: Domain registration date
- `expirationDate`: Domain expiration date
- `registrar`: Domain registrar name
- `registrant`: Domain registrant information (when available)
- `status`: Domain status

### `get_ssl_cert_info`
Get SSL certificate information and validity status for any domain.

**Parameters:**
- `domain` (string, required): The domain to check SSL certificate for
- `port` (number, optional): Port number to check (default: 443)

**Returns:** JSON object with:
- `domain`: The queried domain
- `validFrom`: Certificate valid from date (ISO string)
- `validTo`: Certificate valid to date (ISO string)
- `issuer`: Certificate issuer
- `subject`: Certificate subject
- `isValid`: Boolean indicating if certificate is currently valid
- `daysUntilExpiry`: Number of days until certificate expires
