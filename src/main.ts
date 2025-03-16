import { Actor } from 'apify';
import log from '@apify/log';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { Input, Output, Story } from './types.js'
import { responseSchema } from './types.js';
import { agentTools } from './tools.js';
import { setContextVariable } from "@langchain/core/context";
import { RunnableLambda } from "@langchain/core/runnables";
import { formatHtml, formatMarkdown } from './utils.js';

await Actor.init();

const input = await Actor.getInput<Input>();
if (!input) throw new Error('No input provided.');

await Actor.charge({ eventName: 'init' });

const { OPENAI_API_KEY, newsRequest } = input;

let llmAPIKey;
if(!OPENAI_API_KEY || OPENAI_API_KEY.length == 0) {
  llmAPIKey = process.env.OPENAI_API_KEY;
  await Actor.charge({ eventName: 'llm-input', count: newsRequest.length });
} else {
  llmAPIKey = OPENAI_API_KEY;
}

const agentModel = new ChatOpenAI({ 
  apiKey: llmAPIKey,
  modelName: "gpt-4o-mini",  
}).bind({
  response_format: { type: "json_object" },
  tools: agentTools
});

const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
  responseFormat: responseSchema
});

try {
  const handleRunTimeRequestRunnable = RunnableLambda.from(
    async ({ newsRequest: newsRequest }) => {
      setContextVariable("newsRequest", newsRequest);
      const modelResponse = await agent.invoke({
        messages: [new HumanMessage(`
          You are an expert news aggregator. Your task is to turn structured news data into a human-readable output.

          STEP 1: Based on the user's news request: "${newsRequest}", identify a 1-2 word search query that best represents what news they want.

          STEP 2: Search the web for relevant news. You also have fetch_news_tool which will pull RSS feed data.

          STEP 3: From the returned news stories:
          - If no stories are found, respond with: "Sorry, I couldn't find any news stories about [search query]."
          - If stories are found, select atleast 5 unique and important stories based on titles.
          - Return the selected stories as JSON object and stop any further processing.
        `)]
      }, {
        recursionLimit: 10
      });
      return modelResponse.structuredResponse.stories as Story[];
    }
  );
  const output: Story[] = await handleRunTimeRequestRunnable.invoke({ newsRequest: newsRequest });

  const formattedOutput = {
    html: formatHtml(newsRequest, output),
    markdown: formatMarkdown(newsRequest, output),
    json: output
  }

  await Actor.charge({ eventName: 'news-output', count: output.length });

  await Actor.pushData(formattedOutput);
} catch (err: any) {
  log.error(err.message);
  await Actor.pushData({ error: err.message });
}
await Actor.exit();