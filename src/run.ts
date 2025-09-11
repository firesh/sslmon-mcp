#!/usr/bin/env node

import { SSLMonitorMCP } from './index.js';

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--protocal') {
      args.protocal = String(argv[i + 1] || '');
      i++;
      continue;
    }
    if (arg === '--port') {
      args.port = String(argv[i + 1] || '');
      i++;
      continue;
    }
  }
  return args;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const protocal = (String(args.protocal || 'stdio')).toLowerCase();

  const server = new SSLMonitorMCP();

  if (protocal === 'http') {
    const portArg = typeof args.port === 'string' && args.port ? Number(args.port) : undefined;
    const port = Number(portArg || 3000);
    await server.runHttp(port);
    return;
  }

  // default: stdio
  await server.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
