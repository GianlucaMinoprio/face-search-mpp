export function getOpenApiSpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Face Search",
      description:
        "Pay-per-call face search API. Upload a photo and get the highest-probability identity matches from across the internet.",
      version: "1.0.0",
      "x-guidance": [
        "## Face Search API",
        "",
        "This service accepts a face photo and returns identity matches found across the internet.",
        "",
        "### Usage",
        "- Send a POST to `/api/face-search` with a JSON body containing `image` (base64-encoded image data) and optional `filename`.",
        "- The service searches the internet for matching faces and returns the highest-confidence match plus all other matches sorted by score.",
        "",
        "### Response",
        "The response includes:",
        "- `match`: the single best match (highest confidence score), or null if no match found",
        "- `allMatches`: all matches sorted by descending score",
        "",
        "Each match contains:",
        "- `score`: confidence 0-100",
        "- `url`: the webpage where the face was found",
        "- `thumbnail`: base64-encoded WebP thumbnail of the matched face",
        "- `guid`: unique identifier for the result",
      ].join("\n"),
      contact: {
        name: "GianlucaMinoprio",
        url: "https://github.com/GianlucaMinoprio",
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
            protocols: [{ x402: {} }, { mpp: {} }],
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
                    properties: {
                      match: {
                        anyOf: [
                          {
                            type: "object",
                            properties: {
                              score: {
                                type: "number",
                                description: "Confidence score 0-100",
                              },
                              url: {
                                type: "string",
                                description:
                                  "Webpage URL where the matching face was found",
                              },
                              thumbnail: {
                                type: "string",
                                description:
                                  "Base64-encoded WebP thumbnail of the matched face",
                              },
                              guid: {
                                type: "string",
                                description: "Unique result identifier",
                              },
                            },
                          },
                          { type: "null" },
                        ],
                        description:
                          "The highest-confidence match, or null if no match found",
                      },
                      allMatches: {
                        type: "array",
                        description: "All matches sorted by descending score",
                        items: {
                          type: "object",
                          properties: {
                            score: { type: "number" },
                            url: { type: "string" },
                            thumbnail: { type: "string" },
                            guid: { type: "string" },
                          },
                        },
                      },
                    },
                    required: ["match", "allMatches"],
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
