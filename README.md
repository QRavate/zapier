# QRavate for Zapier

[![CI](https://github.com/QRavate/zapier/actions/workflows/ci.yml/badge.svg)](https://github.com/QRavate/zapier/actions/workflows/ci.yml)
[![Contract test](https://github.com/QRavate/zapier/actions/workflows/contract.yml/badge.svg)](https://github.com/QRavate/zapier/actions/workflows/contract.yml)

The [Zapier](https://zapier.com) integration of [QRavate](https://www.qravate.com), dynamic QR codes with style. Connect your QR codes to thousands of apps: create them from a form or a spreadsheet, change where they point without reprinting them, get notified when one reaches a number of scans.

Built on the [Zapier Platform CLI](https://github.com/zapier/zapier-platform) and the public [QRavate API](https://www.qravate.com/docs).

## What you can do

**Triggers**

| Trigger | When it fires |
|---|---|
| New QR Code | A QR code is created in your workspace |
| QR Code Destination Changed | The destination of a QR code is changed |
| QR Code Paused or Resumed | A QR code is paused or resumed |
| Scan Threshold Reached | A QR code reaches the number of scans you set (once per QR code) |

Triggers are instant: they use QRavate webhooks, registered when the Zap is turned on and removed when it is turned off.

**Actions**

| Action | What it does |
|---|---|
| Create QR Code | Creates a dynamic QR code with a name and a destination URL |
| Update QR Code | Changes the destination or the name. The printed QR code stays the same. |
| Pause or Resume QR Code | Scanners see a neutral page while the QR code is paused |

**Searches**

| Search | What it does |
|---|---|
| Find QR Code | Finds a QR code by text in its name or destination (with "Find or Create") |
| Get QR Code Stats | Scans over a period: total, unique visitors, per day |

## Connecting your account

1. You need a QRavate account on the **Pro** or **Max** plan (the API is included from Pro).
2. In your QRavate account, open **API et webhooks** and create a key. It starts with `sk_` and is shown only once.
3. In Zapier, connect QRavate and paste the key.

## Development

```bash
npm install
npm test                      # unit tests with mocked API responses
QRAVATE_API_KEY=sk_... QRAVATE_TEST_QR_ID=... node scripts/contract-test.mjs   # against the real API
```

Releases: bump `version` in `package.json`, add a line to `CHANGELOG.md`, then push a tag with the same version (`git tag 0.2.0 && git push --tags`). The [deploy workflow](.github/workflows/deploy.yml) runs the tests and pushes the version to Zapier.

## Support

[Open an issue](https://github.com/QRavate/zapier/issues) or write to support@qravate.com.
