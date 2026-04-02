import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { searchFace } from "./facecheck.js";
import { getOpenApiSpec } from "./openapi.js";

config();

const FACECHECK_API_TOKEN = process.env.FACECHECK_API_TOKEN;
if (!FACECHECK_API_TOKEN) {
  console.error("FACECHECK_API_TOKEN is required");
  process.exit(1);
}

const PAY_TO = process.env.EVM_ADDRESS as `0x${string}`;
if (!PAY_TO) {
  console.error("EVM_ADDRESS is required");
  process.exit(1);
}

const facilitatorUrl =
  process.env.FACILITATOR_URL || "https://x402.org/facilitator";
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

const PORT = parseInt(process.env.PORT || "4021", 10);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const BASE_NETWORK = "eip155:8453"; // Base mainnet
const TEMPO_NETWORK = "eip155:4217"; // Tempo mainnet

// Tempo USDC.e (bridged via Stargate)
const TEMPO_USDC = "0x20C000000000000000000000b9537d11c60E8b50";
const TEMPO_USDC_DECIMALS = 6;

const app = express();
app.use(express.json({ limit: "20mb" }));

// MPP discovery endpoint
app.get("/openapi.json", (_req, res) => {
  res.json(getOpenApiSpec(BASE_URL));
});

// Custom EVM scheme for Tempo with its USDC address
const tempoScheme = new ExactEvmScheme().registerMoneyParser(
  async (amount, network) => {
    if (network !== TEMPO_NETWORK) return null;
    const units = BigInt(
      Math.round(amount * 10 ** TEMPO_USDC_DECIMALS),
    ).toString();
    return { amount: units, asset: TEMPO_USDC };
  },
);

// x402 payment middleware
app.use(
  paymentMiddleware(
    {
      "POST /api/face-search": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.40",
            network: BASE_NETWORK,
            payTo: PAY_TO,
          },
          {
            scheme: "exact",
            price: "$0.40",
            network: TEMPO_NETWORK,
            payTo: PAY_TO,
          },
        ],
        description:
          "Search for a person by face photo and return the most probable identity",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient)
      .register(BASE_NETWORK, new ExactEvmScheme())
      .register(TEMPO_NETWORK, tempoScheme),
  ),
);

// Face search endpoint
app.post("/api/face-search", async (req, res) => {
  const { image, filename } = req.body as {
    image?: string;
    filename?: string;
  };

  if (!image) {
    res.status(400).json({ error: "Missing required field: image (base64)" });
    return;
  }

  try {
    const imageBuffer = Buffer.from(image, "base64");
    const result = await searchFace(
      imageBuffer,
      filename || "face.jpg",
      FACECHECK_API_TOKEN,
    );
    res.json(result);
  } catch (err) {
    console.error("Face search failed:", err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Search failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Face Search MPP server running at ${BASE_URL}`);
  console.log(`OpenAPI spec: ${BASE_URL}/openapi.json`);
  console.log(`Payment: $0.40/call via x402`);
  console.log(`  - Base USDC (${BASE_NETWORK})`);
  console.log(`  - Tempo USDC (${TEMPO_NETWORK})`);
  console.log(`  - Pay to: ${PAY_TO}`);
});
