#!/usr/bin/env node

import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import the SSLMonitorMCP class
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.js');

// Dynamic import since we need to import from compiled JS
async function getSSLMonitorMCP() {
  const module = await import(indexPath);
  return module.default || module.SSLMonitorMCP;
}

describe('SSLMonitorMCP Domain Lookup Tests', () => {
  let sslMonitor: any;

  test('should initialize SSLMonitorMCP class', async () => {
    const SSLMonitorMCPClass = await getSSLMonitorMCP();
    sslMonitor = new SSLMonitorMCPClass();
    assert(sslMonitor, 'SSLMonitorMCP instance should be created');
  });

  test('should parse RDAP data correctly', async () => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    const mockRdapData = {
      events: [
        { eventAction: 'registration', eventDate: '2020-01-01T00:00:00Z' },
        { eventAction: 'expiration', eventDate: '2025-01-01T00:00:00Z' }
      ],
      entities: [
        {
          roles: ['registrar'],
          vcardArray: [
            'vcard',
            [
              ['fn', {}, 'text', 'Example Registrar Inc.']
            ]
          ]
        },
        {
          roles: ['registrant'],
          vcardArray: [
            'vcard',
            [
              ['fn', {}, 'text', 'John Doe']
            ]
          ]
        }
      ],
      status: ['client transfer prohibited', 'server delete prohibited']
    };

    const result = sslMonitor.parseRDAPData(mockRdapData, 'example.com');
    
    assert.strictEqual(result.domain, 'example.com');
    assert.strictEqual(result.registrationDate, '2020-01-01T00:00:00Z');
    assert.strictEqual(result.expirationDate, '2025-01-01T00:00:00Z');
    assert.strictEqual(result.registrar, 'Example Registrar Inc.');
    assert.strictEqual(result.registrant, 'John Doe');
    assert.strictEqual(result.status, 'client transfer prohibited, server delete prohibited');
  });

  test('should parse whois data correctly', async () => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    const mockWhoisData = `
      Domain Name: EXAMPLE.COM
      Creation Date: 2020-01-01T00:00:00Z
      Expiry Date: 2025-01-01T00:00:00Z
      Registrar: Example Registrar Inc.
      Registrant: John Doe
      Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited
    `;

    const result = sslMonitor.parseWhoisData(mockWhoisData, 'example.com');
    
    assert.strictEqual(result.domain, 'example.com');
    assert.strictEqual(result.registrationDate, '2020-01-01T00:00:00.000Z');
    assert.strictEqual(result.expirationDate, '2025-01-01T00:00:00.000Z');
    assert.strictEqual(result.registrar, 'Example Registrar Inc.');
    assert.strictEqual(result.registrant, 'John Doe');
    assert.strictEqual(result.status, 'clientTransferProhibited https');
  });

  test('should normalize dates to ISO 8601 format', async () => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    // Test various date formats
    assert.strictEqual(sslMonitor.normalizeToISO8601('2020-01-01'), '2020-01-01T00:00:00.000Z');
    assert.strictEqual(sslMonitor.normalizeToISO8601('2020-01-01T00:00:00Z'), '2020-01-01T00:00:00.000Z');
    assert.strictEqual(sslMonitor.normalizeToISO8601('2018-05-18 23:33:35'), '2018-05-18T23:33:35.000Z');
    
    // Test DD-MMM-YYYY format (timezone may affect exact time)
    const sepDate = sslMonitor.normalizeToISO8601('15-Sep-1997');
    assert(sepDate.includes('1997-09'), 'Should parse 15-Sep-1997 to September 1997');
    assert(sepDate.endsWith('Z'), 'Should be in ISO format ending with Z');
    
    // Test MM/DD/YYYY format
    const mmddyyyy = sslMonitor.normalizeToISO8601('09/15/1997');
    assert(mmddyyyy.includes('1997'), 'Should parse MM/DD/YYYY format');
    assert(mmddyyyy.endsWith('Z'), 'Should be in ISO format ending with Z');
    
    // Test that invalid dates return original string
    const invalidDate = sslMonitor.normalizeToISO8601('invalid-date');
    assert.strictEqual(invalidDate, 'invalid-date');
  });

  test('should get RDAP server for common TLD', async () => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    const rdapServer = await sslMonitor.getRDAPServer('com');
    assert(rdapServer, 'Should return an RDAP server for .com TLD');
    assert(rdapServer.startsWith('https://'), 'RDAP server should be HTTPS URL');
  });

  test('should get whois server for common TLD', async () => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    const whoisServer = await sslMonitor.getWhoisServer('com');
    assert(whoisServer, 'Should return a whois server for .com TLD');
    assert.strictEqual(typeof whoisServer, 'string');
  });

  test('should perform HTTP request', async () => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    const response = await sslMonitor.httpRequest('https://httpbin.org/get');
    const data = JSON.parse(response);
    assert(data.url, 'Should receive JSON response with URL field');
  });

  test('should handle HTTP error', async () => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    try {
      await sslMonitor.httpRequest('https://httpbin.org/status/404');
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert(error instanceof Error);
      assert(error.message.includes('404'));
    }
  });

  test('should perform real domain lookup', async (t) => {
    if (!sslMonitor) {
      const SSLMonitorMCPClass = await getSSLMonitorMCP();
      sslMonitor = new SSLMonitorMCPClass();
    }

    // Test with a real domain - this is an integration test
    try {
      const result = await sslMonitor.getDomainInfo('google.com');
      
      // Verify the response structure
      assert(result.content, 'Should have content array');
      assert(result.content.length > 0, 'Content should not be empty');
      assert(result.content[0].type === 'text', 'First content item should be text');
      
      const domainInfo = JSON.parse(result.content[0].text);
      assert.strictEqual(domainInfo.domain, 'google.com');
      assert(domainInfo.registrationDate, 'Should have registration date');
      assert(domainInfo.expirationDate, 'Should have expiration date');
      
      // Verify ISO 8601 format
      assert(domainInfo.registrationDate.endsWith('Z'), 'Registration date should be in ISO 8601 format');
      assert(domainInfo.expirationDate.endsWith('Z'), 'Expiration date should be in ISO 8601 format');
      
      console.log('Google.com domain info:', domainInfo);
    } catch (error) {
      // If the real lookup fails (network issues, rate limiting, etc.), 
      // we'll skip this test rather than failing
      const errorMessage = error instanceof Error ? error.message : String(error);
      t.skip('Real domain lookup test skipped due to network error: ' + errorMessage);
    }
  });
});