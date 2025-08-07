# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides SSL certificate monitoring and domain registration information lookup capabilities. The server exposes two main tools for checking domain WHOIS data and SSL certificate validity.

## Development Commands

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

## Architecture

The project follows a single-class architecture with the main `SSLMonitorMCP` class in `src/index.ts`:

- **SSLMonitorMCP**: Main server class that implements MCP protocol handlers
  - `getDomainInfo()`: Performs WHOIS lookup and parses domain registration data
  - `checkSSLCertificate()`: Establishes TLS connection to check certificate validity
  - `parseWhoisData()`: Parses raw WHOIS response into structured data

## MCP Tools

The server exposes two tools via MCP protocol:

1. **get_domain_info**: WHOIS domain registration lookup
   - Input: `domain` (string)
   - Returns: Registration/expiration dates, registrar, status

2. **get_ssl_cert_info**: SSL certificate validation check
   - Input: `domain` (string), `port` (number, default 443)
   - Returns: Certificate validity dates, issuer, subject, expiration countdown

## Key Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `whois`: WHOIS lookup functionality
- `tls`/`https`: Node.js built-in modules for SSL certificate checking
- `node-forge`: Certificate parsing utilities

## Code Structure

- `src/index.ts`: Main MCP server implementation
- `src/types.d.ts`: TypeScript type definitions
- `dist/`: TypeScript compilation output (generated)
- `tsconfig.json`: TypeScript configuration with ES2022 target and ESNext modules

The server runs on stdio transport and communicates via the MCP protocol standard for tool execution and response formatting.