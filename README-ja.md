# SSL モニター MCP サーバー

**言語:** [English](README.md) | [中文](README-zh.md) | [日本語](README-ja.md)

ドメイン登録情報とSSL証明書監視機能を提供するMCPサーバーです。

## 機能

1. **ドメイン登録情報** - WHOIS検索によるドメイン登録・有効期限日取得
2. **SSL証明書監視** - SSL証明書の有効期間と詳細情報をチェック

## ツール

### get_domain_info
WHOIS検索によりドメイン登録・有効期限情報を取得します。

**パラメータ:**
- `domain` (文字列、必須): チェックするトップレベルドメイン（例："example.com"）

**戻り値:** 以下を含むJSONオブジェクト：
- `domain`: 検索されたドメイン
- `registrationDate`: ドメイン登録日
- `expirationDate`: ドメイン有効期限日
- `registrar`: ドメイン登録業者名
- `status`: ドメインステータス

### check_ssl_certificate
ドメインのSSL証明書有効期間をチェックします。

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

## インストール

```bash
npm install
npm run build
```

## 使用方法

```bash
npm start
```

## 開発

```bash
npm run dev
```

## 使用例

MCPクライアントで設定後：

```javascript
// ドメイン登録情報をチェック
await mcp.callTool("get_domain_info", { domain: "google.com" });

// SSL証明書をチェック
await mcp.callTool("check_ssl_certificate", { domain: "google.com" });
```