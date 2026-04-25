# 域名 / HTTPS / SSL MCP 服务器

[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-MCP-blue)](https://modelcontextprotocol.io/) [![npm version](https://img.shields.io/npm/v/sslmon-mcp.svg)](https://www.npmjs.com/package/sslmon-mcp) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)


**语言:** [English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

一个模型上下文协议 (MCP) 服务器，提供域名注册信息和 SSL 证书监控功能。非常适合安全监控、域名管理和证书生命周期追踪。

## 🚀 快速开始

### HTTP（远程 MCP 服务器）
- **名称:** `sslmon`
- **URL:** `https://sslmon.dev/mcp`

```bash
# Claude Code
claude mcp add -t http sslmon https://sslmon.dev/mcp
# Gemini CLI
gemini mcp add -t http sslmon https://sslmon.dev/mcp
# Qwen Code
qwen mcp add -t http sslmon https://sslmon.dev/mcp
# Codex
codex mcp add sslmon --url https://sslmon.dev/mcp
```

### NPX（本地 MCP 服务器）
Mac/Linux:
```bash
# 添加到 Claude Desktop
claude mcp add sslmon -- npx -y sslmon-mcp
```
Windows:
```bash
# 添加到 Claude Desktop
claude mcp add sslmon -- cmd /c npx -y sslmon-mcp
```
### 配置（本地 MCP 服务器）
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

## ✨ 功能特性

- 🔍 **域名注册信息** - 获取域名注册和到期日期
- 🔒 **SSL证书信息** - 检查 SSL 证书有效期和详细信息

## 🛠️ 可用工具

### `get_domain_info`
获取域名注册和到期信息。

**参数：**
- `domain` (字符串，必需): 要检查的顶级域名 (例如："example.com")

**返回值：** JSON 对象，包含：
- `domain`: 查询的域名
- `registrationDate`: 域名注册日期
- `expirationDate`: 域名到期日期
- `registrar`: 域名注册商名称
- `registrant`: 域名注册人信息（获取到时返回）
- `status`: 域名状态
- `daysUntilExpiry`: 域名到期剩余天数

### `get_ssl_cert_info`
获取 SSL 证书信息和有效状态。

**参数：**
- `domain` (字符串，必需): 要检查 SSL 证书的域名
- `port` (数字，可选): 要检查的端口号 (默认: 443)

**返回值：** JSON 对象，包含：
- `domain`: 查询的域名
- `validFrom`: 证书生效日期 (ISO 字符串格式)
- `validTo`: 证书到期日期 (ISO 字符串格式)
- `issuer`: 证书颁发机构
- `subject`: 证书主题
- `isValid`: 布尔值，表示证书当前是否有效
- `daysUntilExpiry`: 证书到期剩余天数

## 相关项目

- [sslmon-cli](https://github.com/firesh/sslmon-cli) — 独立的命令行工具（Go），适用于 Shell 脚本和 CI/CD 流水线中的域名 WHOIS 和 SSL 证书查询。
