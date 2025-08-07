# SSL Monitor MCP Server

**Languages:** [English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

An MCP server that provides domain registration information and SSL certificate monitoring capabilities.

## Features

1. **Domain Registration Info** - Get domain registration and expiration dates via WHOIS lookup
2. **SSL Certificate Monitoring** - Check SSL certificate validity periods and details

## Tools

### get_domain_info
Get domain registration and expiration information using WHOIS lookup.

**Parameters:**
- `domain` (string, required): The top-level domain to check (e.g., "example.com")

**Returns:** JSON object with:
- `domain`: The queried domain
- `registrationDate`: Domain registration date
- `expirationDate`: Domain expiration date
- `registrar`: Domain registrar name
- `status`: Domain status

### check_ssl_certificate
Check SSL certificate validity period for a domain.

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

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm start
```

## Development

```bash
npm run dev
```

## Example Usage

Once configured in your MCP client:

```javascript
// Check domain registration info
await mcp.callTool("get_domain_info", { domain: "google.com" });

// Check SSL certificate
await mcp.callTool("check_ssl_certificate", { domain: "google.com" });
```