export interface Input {
  newsRequest: string;
  OPENAI_API_KEY: string;
}

export interface Story {
  title: string,
  source: string,
  link: string,
  summary: string
}

export interface Output {
  html: string;
  markdown: string;
  json: Story[];
  error?: string;
};

export const responseSchema = {
  type: "object",
  properties: {
    stories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          source: { type: "string" },
          link: { type: "string" },
          summary: { type: "string" }
        },
        required: ["title", "source", "link", "summary"]
      }
    }
  },
  required: ["stories"]
};