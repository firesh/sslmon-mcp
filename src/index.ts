#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import whois from 'whois';
import * as tls from 'tls';
import * as https from 'https';
import { URL } from 'url';

interface DomainInfo {
  domain: string;
  registrationDate?: string;
  expirationDate?: string;
  registrar?: string;
  status?: string;
}

interface SSLInfo {
  domain: string;
  validFrom: string;
  validTo: string;
  issuer: string;
  subject: string;
  isValid: boolean;
  daysUntilExpiry: number;
}

class SSLMonitorMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "sslmon-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_domain_info",
            description: "Get domain registration and expiration information using WHOIS lookup",
            inputSchema: {
              type: "object",
              properties: {
                domain: {
                  type: "string",
                  description: "The top-level domain to check (e.g., example.com)",
                },
              },
              required: ["domain"],
            },
          },
          {
            name: "check_ssl_certificate",
            description: "Check SSL certificate validity period for a domain",
            inputSchema: {
              type: "object",
              properties: {
                domain: {
                  type: "string", 
                  description: "The domain to check SSL certificate for (e.g., example.com)",
                },
                port: {
                  type: "number",
                  description: "Port number to check (default: 443)",
                  default: 443,
                },
              },
              required: ["domain"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_domain_info":
            return await this.getDomainInfo(args.domain as string);
          case "check_ssl_certificate":
            return await this.checkSSLCertificate(
              args.domain as string,
              (args.port as number) || 443
            );
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async getDomainInfo(domain: string): Promise<any> {
    return new Promise((resolve) => {
      whois.lookup(domain, (err: Error | null, data: string) => {
        if (err) {
          resolve({
            content: [
              {
                type: "text",
                text: `WHOIS lookup failed for ${domain}: ${err.message}`,
              },
            ],
          });
          return;
        }

        const domainInfo = this.parseWhoisData(data, domain);
        
        resolve({
          content: [
            {
              type: "text",
              text: JSON.stringify(domainInfo, null, 2),
            },
          ],
        });
      });
    });
  }

  private parseWhoisData(data: string, domain: string): DomainInfo {
    const lines = data.split('\n');
    const info: DomainInfo = { domain };

    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      
      // Registration date patterns
      if (lower.includes('creation date') || lower.includes('created') || lower.includes('registered')) {
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\w{3}-\d{4})/i);
        if (dateMatch && !info.registrationDate) {
          info.registrationDate = dateMatch[1];
        }
      }
      
      // Expiration date patterns
      if (lower.includes('expiry date') || lower.includes('expiration') || lower.includes('expires')) {
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\w{3}-\d{4})/i);
        if (dateMatch && !info.expirationDate) {
          info.expirationDate = dateMatch[1];
        }
      }
      
      // Registrar
      if (lower.includes('registrar:') && !info.registrar) {
        info.registrar = line.split(':')[1]?.trim();
      }
      
      // Status
      if (lower.includes('status:') && !info.status) {
        info.status = line.split(':')[1]?.trim();
      }
    }

    return info;
  }

  private async checkSSLCertificate(domain: string, port: number = 443): Promise<any> {
    return new Promise((resolve) => {
      const options = {
        host: domain,
        port: port,
        servername: domain,
      };

      const socket = tls.connect(options, () => {
        const cert = socket.getPeerCertificate();
        
        if (!cert || Object.keys(cert).length === 0) {
          resolve({
            content: [
              {
                type: "text",
                text: `No SSL certificate found for ${domain}:${port}`,
              },
            ],
          });
          socket.end();
          return;
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const isValid = now >= validFrom && now <= validTo;
        const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const sslInfo: SSLInfo = {
          domain,
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          issuer: cert.issuer?.CN || 'Unknown',
          subject: cert.subject?.CN || domain,
          isValid,
          daysUntilExpiry,
        };

        resolve({
          content: [
            {
              type: "text",
              text: JSON.stringify(sslInfo, null, 2),
            },
          ],
        });

        socket.end();
      });

      socket.on('error', (error) => {
        resolve({
          content: [
            {
              type: "text",
              text: `SSL connection failed for ${domain}:${port}: ${error.message}`,
            },
          ],
        });
      });

      socket.setTimeout(10000, () => {
        socket.destroy();
        resolve({
          content: [
            {
              type: "text",
              text: `SSL connection timeout for ${domain}:${port}`,
            },
          ],
        });
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SSL Monitor MCP server running on stdio");
  }
}

const server = new SSLMonitorMCP();
server.run().catch(console.error);