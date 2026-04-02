# face-search-mpp

Pay-per-call face search API. Upload a photo and get the highest-probability identity matches from across the internet.

**$0.40 per call** via [x402](https://x402.org) micropayments on Base.

Powered by [FaceCheck.id](https://facecheck.id/en/Face-Search/API).

## Setup

```bash
npm install
cp .env.example .env
# Fill in your FACECHECK_API_TOKEN and EVM_ADDRESS
```

## Run

```bash
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
