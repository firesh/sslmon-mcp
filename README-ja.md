# ドメイン / HTTPS / SSL MCP サーバー

[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-MCP-blue)](https://modelcontextprotocol.io/) [![npm version](https://img.shields.io/npm/v/sslmon-mcp.svg)](https://www.npmjs.com/package/sslmon-mcp) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)


**言語:** [English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

ドメイン登録情報とSSL証明書監視機能を提供するモデルコンテキストプロトコル（MCP）サーバーです。セキュリティ監視、ドメイン管理、証明書ライフサイクル追跡に最適です。

## 🚀 クイックスタート

### HTTP（リモート MCP サーバー）
名前: `sslmon`
URL: `https://sslmon.dev/mcp`

### NPX（ローカル MCP サーバー）
Mac/Linux:
```bash
# Claude Desktop に追加
claude mcp add sslmon -- npx -y sslmon-mcp
```
Windows:
```bash
# Claude Desktop に追加
claude mcp add sslmon -- cmd /c npx -y sslmon-mcp
```
### 設定（ローカル MCP サーバー）
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

## ✨ 機能

- 🔍 **ドメイン登録情報** - ドメイン登録・有効期限日取得
- 🔒 **SSL証明書情報** - SSL証明書の有効期間と詳細情報をチェック

## 🛠️ 利用可能なツール

### `get_domain_info`
ドメイン登録・有効期限情報を取得します。

**パラメータ:**
- `domain` (文字列、必須): チェックするトップレベルドメイン（例："example.com"）

**戻り値:** 以下を含むJSONオブジェクト：
- `domain`: 検索されたドメイン
- `registrationDate`: ドメイン登録日
- `expirationDate`: ドメイン有効期限日
- `registrar`: ドメイン登録業者名
- `registrant`: ドメイン登録者情報（取得可能な場合）
- `status`: ドメインステータス
- `daysUntilExpiry`: ドメインの有効期限までの日数

### `get_ssl_cert_info`
SSL証明書情報と有効性ステータスを取得します。

**パラメータ:**
- `domain` (文字列、必須): SSL証明書をチェックするドメイン
- `port` (数値、オプション): チェックするポート番号（デフォルト: 443）

**戻り値:** 以下を含むJSONオブジェクト：
- `domain`: 検索されたドメイン
- `validFrom`: 証明書有効開始日（ISO文字列）
- `validTo`: 証明書有効終了日（ISO文字列）
- `issuer`: 証明書発行者
- `subject`: 証明書サブジェクト
- `isValid`: 証明書が現在有効かどうかのブール値
- `daysUntilExpiry`: 証明書期限切れまでの日数
