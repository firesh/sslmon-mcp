# SSL 监控 MCP 服务器

**语言:** [English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

一个提供域名注册信息和 SSL 证书监控功能的 MCP 服务器。

## 功能特性

1. **域名注册信息** - 通过 WHOIS 查询获取域名注册和到期日期
2. **SSL 证书监控** - 检查 SSL 证书有效期和详细信息

## 工具

### get_domain_info
通过 WHOIS 查询获取域名注册和到期信息。

**参数：**
- `domain` (字符串，必需): 要检查的顶级域名 (例如："example.com")

**返回值：** JSON 对象，包含：
- `domain`: 查询的域名
- `registrationDate`: 域名注册日期
- `expirationDate`: 域名到期日期
- `registrar`: 域名注册商名称
- `registrant`: 域名注册人信息（获取到时返回）
- `status`: 域名状态

### get_ssl_cert_info
SSL证书信息查询

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

## 安装

```bash
npm install
npm run build
```

## 使用

```bash
npm start
```

## 开发

```bash
npm run dev
```

## 使用示例

在 MCP 客户端中配置后：

```javascript
// 检查域名注册信息
await mcp.callTool("get_domain_info", { domain: "google.com" });

// 检查 SSL 证书
await mcp.callTool("get_ssl_cert_info", { domain: "google.com" });
```