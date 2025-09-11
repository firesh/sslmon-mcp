#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from 'zod';
import * as tls from 'tls';
import * as https from 'https';
import * as http from 'http';
import * as net from 'net';
import { URL } from 'url';
import express, { Request, Response } from 'express';

interface DomainInfo {
  domain: string;
  registrationDate?: string;
  expirationDate?: string;
  registrar?: string;
  registrant?: string;
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

export class SSLMonitorMCP {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "sslmon-mcp",
      version: "1.0.1",
    });

    this.setupTools(this.server);
  }

  private newServer(): McpServer {
    const server = new McpServer({
      name: "sslmon-mcp",
      version: "1.0.1",
    });
    this.setupTools(server);
    return server;
  }

  private setupTools(server: McpServer) {
    server.registerTool(
      "get_domain_info",
      {
        title: "Get domain info",
        description: "Get domain registration and expiration information using WHOIS and RDAP.",
        inputSchema: {
          domain: z.string().describe("The top-level domain to check (e.g., sslmon.dev)"),
        },
      },
      async ({ domain }) => {
        try {
          return await this.getDomainInfo(domain);
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      "get_ssl_cert_info",
      {
        title: "Get SSL cert info",
        description: "Get SSL certificate information for a host and port.",
        inputSchema: {
          domain: z.string().describe("The domain to check SSL certificate for (e.g., www.sslmon.dev)"),
          port: z.number().int().positive().default(443).describe("Port number to check (default: 443)"),
        },
      },
      async ({ domain, port = 443 }) => {
        try {
          return await this.checkSSLCertificate(domain, port);
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
          };
        }
      }
    );
  }

  private async getDomainInfo(domain: string): Promise<any> {
    try {
      // First try RDAP protocol
      const rdapInfo = await this.queryRDAP(domain);
      if (rdapInfo) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rdapInfo, null, 2),
            },
          ],
        };
      }
    } catch (rdapError) {
      console.error(`RDAP query failed for ${domain}:`, rdapError);
    }

    try {
      // Fallback to whois protocol
      const whoisInfo = await this.queryWhois(domain);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(whoisInfo, null, 2),
          },
        ],
      };
    } catch (whoisError) {
      return {
        content: [
          {
            type: "text",
            text: `Domain info lookup failed for ${domain}: ${whoisError instanceof Error ? whoisError.message : String(whoisError)}`,
          },
        ],
      };
    }
  }

  async queryRDAP(domain: string): Promise<DomainInfo | null> {
    const tld = domain.split('.').pop()?.toLowerCase();
    if (!tld) {
      throw new Error('Invalid domain format');
    }

    // Get RDAP bootstrap data to find the right RDAP server
    let rdapServer = await this.getRDAPServer(tld);
    if (!rdapServer) {
      return null;
    }
    if (!rdapServer.endsWith('/')) {
      rdapServer = rdapServer+'/';
    }

    const url = `${rdapServer}domain/${domain}`;
    console.log(`Querying RDAP server: ${url}`);
    const response = await this.httpRequest(url);
    const data = JSON.parse(response);

    return this.parseRDAPData(data, domain);
  }

  async getRDAPServer(tld: string): Promise<string | null> {
    try {
      const bootstrapUrl = 'https://data.iana.org/rdap/dns.json';
      const response = await this.httpRequest(bootstrapUrl);
      const bootstrap = JSON.parse(response);
      
      for (const service of bootstrap.services) {
        const [tlds, servers] = service;
        if (tlds.includes(tld) && servers.length > 0) {
          return servers[0];
        }
      }
    } catch (error) {
      console.error('Failed to get RDAP bootstrap data:', error);
    }
    return null;
  }

  parseRDAPData(data: any, domain: string): DomainInfo {
    const info: DomainInfo = { domain };

    if (data.events) {
      for (const event of data.events) {
        if (event.eventAction === 'registration' && event.eventDate) {
          info.registrationDate = event.eventDate;
        }
        if (event.eventAction === 'expiration' && event.eventDate) {
          info.expirationDate = event.eventDate;
        }
      }
    }

    if (data.entities) {
      for (const entity of data.entities) {
        if (entity.roles && entity.vcardArray) {
          const vcard = entity.vcardArray[1];
          let entityName = '';
          
          for (const field of vcard) {
            if (field[0] === 'fn' && field[3]) {
              entityName = field[3];
              break;
            }
          }
          
          if (entity.roles.includes('registrar') && entityName) {
            info.registrar = entityName;
          }
          if (entity.roles.includes('registrant') && entityName) {
            info.registrant = entityName;
          }
        }
      }
    }

    if (data.status && data.status.length > 0) {
      info.status = data.status.join(', ');
    }

    return info;
  }

  async queryWhois(domain: string): Promise<DomainInfo> {
    const tld = domain.split('.').pop()?.toLowerCase();
    if (!tld) {
      throw new Error('Invalid domain format');
    }

    // Get whois server for the TLD
    const whoisServer = await this.getWhoisServer(tld);
    if (!whoisServer) {
      throw new Error(`No whois server found for TLD: ${tld}`);
    }

    const whoisData = await this.performWhoisQuery(domain, whoisServer);
    return this.parseWhoisData(whoisData, domain);
  }

  async getWhoisServer(tld: string): Promise<string | null> {
    try {
      const ianaWhoisData = await this.performWhoisQuery(tld, 'whois.iana.org');
      const lines = ianaWhoisData.split('\n');
      for (const line of lines) {
        const lower = line.toLowerCase().trim();
        if (lower.startsWith('whois:')) {
          return line.split(':')[1]?.trim() || null;
        }
      }
    } catch (error) {
      console.error('Failed to get whois server from IANA:', error);
    }
    return null;
  }

  async performWhoisQuery(query: string, server: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = net.connect(43, server);
      let data = '';

      socket.on('connect', () => {
        socket.write(query + '\r\n');
      });

      socket.on('data', (chunk) => {
        data += chunk.toString();
      });

      socket.on('end', () => {
        resolve(data);
      });

      socket.on('error', (error) => {
        reject(error);
      });

      socket.setTimeout(10000, () => {
        socket.destroy();
        reject(new Error('Whois query timeout'));
      });
    });
  }

  parseWhoisData(data: string, domain: string): DomainInfo {
    const lines = data.split('\n');
    const info: DomainInfo = { domain };

    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      
      // Registration date patterns (English and Chinese)
      if (lower.includes('creation date') || lower.includes('created') || lower.includes('registered') || 
          lower.includes('registration time') || line.includes('Registration Time:')) {
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\w{3}-\d{4}|\d{4}-\d{2}-\d{2}T[\d:]+Z?)/i);
        if (dateMatch && !info.registrationDate) {
          info.registrationDate = this.normalizeToISO8601(dateMatch[1]);
        }
      }
      
      // Expiration date patterns (English and Chinese)
      if (lower.includes('expiry date') || lower.includes('expiration') || lower.includes('expires') ||
          lower.includes('expiration time') || line.includes('Expiration Time:')) {
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\w{3}-\d{4}|\d{4}-\d{2}-\d{2}T[\d:]+Z?)/i);
        if (dateMatch && !info.expirationDate) {
          info.expirationDate = this.normalizeToISO8601(dateMatch[1]);
        }
      }
      
      // Registrar (English and Chinese)
      if ((lower.includes('registrar:') || lower.includes('sponsoring registrar:') || 
           line.includes('Sponsoring Registrar:')) && !info.registrar) {
        info.registrar = line.split(':')[1]?.trim();
      }
      
      // Registrant patterns (English and Chinese)
      if ((lower.includes('registrant:') || lower.includes('registrant name:') || 
           lower.includes('registrant organization:') || lower.includes('registrant contact:') ||
           line.includes('Registrant:')) && !info.registrant) {
        info.registrant = line.split(':')[1]?.trim();
      }
      
      // Status
      if (lower.includes('status:') && !info.status) {
        info.status = line.split(':')[1]?.trim();
      }
    }

    return info;
  }

  async httpRequest(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'sslmon-mcp/1.0.0'
        }
      };

      const request = (urlObj.protocol === 'https:' ? https : http).request(options, (response: any) => {
        let data = '';
        
        response.on('data', (chunk: any) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          }
        });
      });

      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('HTTP request timeout'));
      });
      
      request.end();
    });
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

  normalizeToISO8601(dateString: string): string {
    // Clean up the date string
    const cleanDate = dateString.trim();
    
    // If already in ISO format, return as-is
    if (cleanDate.includes('T') || cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(cleanDate);
      return date.toISOString();
    }
    
    // Handle YYYY-MM-DD HH:mm:ss format (common in Chinese whois)
    if (cleanDate.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/)) {
      const date = new Date(cleanDate.replace(' ', 'T') + 'Z');
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Handle DD/MM/YYYY format
    if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY or DD/MM/YYYY - try both
        let date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        if (isNaN(date.getTime())) {
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    // Handle DD-MMM-YYYY format (e.g., 15-Sep-1997)
    if (cleanDate.includes('-') && cleanDate.match(/\d{2}-\w{3}-\d{4}/)) {
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Default: try to parse as-is
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // If all else fails, return original string
    return cleanDate;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SSL Monitor MCP server running on stdio");
  }

  async runHttp(port: number) {
    const app = express();
    app.use(express.json());

    app.post('/mcp', async (req: Request, res: Response) => {
      try {
        const server = this.newServer();
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          // enableDnsRebindingProtection: true,
          // allowedHosts: ['127.0.0.1'],
        });
        res.on('close', () => {
          transport.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: 'Internal server error' },
            id: null,
          });
        }
      }
    });

    app.get('/mcp', async (_req: Request, res: Response) => {
      res
        .status(405)
        .json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Method not allowed.' },
          id: null,
        });
    });

    app.delete('/mcp', async (_req: Request, res: Response) => {
      res
        .status(405)
        .json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Method not allowed.' },
          id: null,
        });
    });

    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, (err?: any) => {
        if (err) return reject(err);
        resolve();
      });
      server.on('error', reject);
    });
    console.log(`MCP Stateless Streamable HTTP Server listening on port ${port}`);
  }
}
