# face-search-mpp

Pay-per-call face search API. Upload a photo and get the highest-probability identity matches from across the internet.

**$0.40 per call** via [x402](https://x402.org) micropayments (Base USDC + Tempo USDC).

Powered by [FaceCheck.id](https://facecheck.id/en/Face-Search/API).

## Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?repo=GianlucaMinoprio/face-search-mpp)

Set these environment variables in Railway:

| Variable | Description |
|---|---|
| `FACECHECK_API_TOKEN` | Your [FaceCheck.id API token](https://facecheck.id/en/Face-Search/API) |
| `EVM_ADDRESS` | Your wallet address to receive USDC payments |
| `BASE_URL` | Your Railway public URL (e.g. `https://face-search-mpp-production.up.railway.app`) |

`PORT` is auto-set by Railway. `FACILITATOR_URL` defaults to `https://x402.org/facilitator`.

## Local development

```bash
npm install
cp .env.example .env
# Fill in FACECHECK_API_TOKEN and EVM_ADDRESS
npm run dev
```

## API

### `POST /api/face-search`

Send a base64-encoded face image, receive identity matches.

**Request:**
```json
{
  "image": "<base64-encoded image>",
  "filename": "photo.jpg"
}
```

**Response:**
```json
{
  "match": {
    "score": 95,
    "url": "https://example.com/profile",
    "thumbnail": "data:image/webp;base64,...",
    "guid": "abc123"
  },
  "allMatches": [...]
}
```

### `GET /openapi.json`

MPP discovery endpoint — returns the OpenAPI 3.1.0 spec with `x-payment-info`.

## Discovery

Verify with:
```bash
npx @agentcash/discovery@latest discover <your-deployed-url>
```
