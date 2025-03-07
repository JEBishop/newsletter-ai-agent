export interface Input {
  newsRequest: string;
  OPENAI_API_KEY: string;
}

export interface Output {
  html: string;
  markdown: string;
  error?: string;
}