#!/usr/bin/env node

import { SSLMonitorMCP } from './index.js';

// Start the MCP server
const server = new SSLMonitorMCP();
server.run().catch(console.error);