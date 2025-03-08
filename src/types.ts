export interface Input {
  newsRequest: string;
  OPENAI_API_KEY: string;
}

export const responseSchema = {
  type: "object",
  properties: {
    html: { type: "string" },
    markdown: { type: "string" },
    error: { type: "string", description: "Error message is something went wrong (optional)" }
  },
  required: ["html", "markdown"]
}