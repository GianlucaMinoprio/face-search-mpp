export function getOpenApiSpec(baseUrl: string) {
  const matchSchema = {
    type: "object",
    properties: {
      score: { type: "number", description: "Confidence score 0-100" },
      confidence: {
        type: "string",
        enum: ["high", "possible", "unlikely"],
        description: "Confidence label: high (70+), possible (60-69), unlikely (<60)",
      },
      url: { type: "string", description: "Webpage URL where the face was found" },
      source: { type: "string", description: "Domain name (e.g. linkedin.com)" },
      isProfile: {
        type: "boolean",
        description: "True if the URL is a social/professional profile (LinkedIn, GitHub, etc.)",
      },
      thumbnail: {
        type: "string",
        description: "Base64-encoded WebP thumbnail (included for top 5 matches only)",
      },
      guid: { type: "string", description: "Unique result identifier" },
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "Face Search",
      description:
        "Pay-per-call face search API. Upload a photo and get the highest-probability identity matches from across the internet.",
      version: "2.0.0",
      "x-guidance": [
        "## Face Search API",
        "",
        "This service accepts a face photo and returns identity matches found across the internet.",
        "",
        "### Usage",
        "- Send a POST to `/api/face-search` with a JSON body containing `image` (base64-encoded image data) and optional `filename`.",
        "- The service searches the internet for matching faces and returns ranked matches.",
        "",
        "### Response",
        "The response includes:",
        "- `bestProfile`: the highest-scoring match from a social/professional profile (LinkedIn, GitHub, etc.), or null",
        "- `bestMatch`: the single highest-scoring match overall, or null",
        "- `matches`: top 20 matches (score >= 55), sorted with profiles first, then by score",
        "- `totalRawMatches`: total number of raw matches before filtering",
        "",
        "Each match contains:",
        "- `score`: confidence 0-100",
        "- `confidence`: 'high' (70+), 'possible' (60-69), or 'unlikely' (<60)",
        "- `url`: the webpage where the face was found",
        "- `source`: the domain name",
        "- `isProfile`: true if from a known social/professional platform",
        "- `thumbnail`: base64-encoded WebP thumbnail (top 5 matches only, empty string otherwise)",
        "- `guid`: unique identifier for the result",
      ].join("\n"),
      contact: {
        name: "GianlucaMinoprio",
        url: "https://github.com/GianlucaMinoprio",
      },
      "x-logo": {
        url: `${baseUrl}/logo.png`,
        altText: "Face Search MPP",
      },
    },
    servers: [{ url: baseUrl }],
    "x-discovery": {
      ownershipProofs: [],
    },
    paths: {
      "/api/face-search": {
        post: {
          operationId: "face_search",
          summary:
            "Search for a person by face photo and return the most probable identity",
          tags: ["Face Search"],
          "x-payment-info": {
            price: {
              mode: "fixed",
              currency: "USD",
              amount: "0.400000",
            },
            protocols: [
              { x402: {} },
              { mpp: { method: "", intent: "", currency: "" } },
            ],
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: {
                      type: "string",
                      description:
                        "Base64-encoded image data (JPEG, PNG, or WebP)",
                    },
                    filename: {
                      type: "string",
                      description:
                        'Optional filename for the image (default: "face.jpg")',
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful face search response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["bestProfile", "bestMatch", "matches", "totalRawMatches"],
                    properties: {
                      bestProfile: {
                        anyOf: [matchSchema, { type: "null" }],
                        description:
                          "Highest-scoring match from a social/professional profile, or null",
                      },
                      bestMatch: {
                        anyOf: [matchSchema, { type: "null" }],
                        description:
                          "Highest-scoring match overall, or null",
                      },
                      matches: {
                        type: "array",
                        description:
                          "Top 20 matches (score >= 55), profiles first then by score",
                        items: matchSchema,
                      },
                      totalRawMatches: {
                        type: "integer",
                        description: "Total raw matches before filtering",
                      },
                    },
                  },
                },
              },
            },
            "402": {
              description: "Payment Required",
            },
            "400": {
              description: "Bad request — missing or invalid image data",
            },
            "500": {
              description: "Internal server error during face search",
            },
          },
        },
      },
    },
  };
}
