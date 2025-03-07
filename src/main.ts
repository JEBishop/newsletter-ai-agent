import { Actor } from 'apify';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, MessageContentComplex } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { Input, Output } from './types.js'
import { agentTools } from './tools.js'

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
  tools: agentTools
});

try {
  const finalState = await agent.invoke(
    {
      messages: [
        new HumanMessage(`
          You are an expert news aggregator. Your task is to turn structured news data into a human-readable output.

          STEP 1: Based on the user's request: ${newsRequest}, identify a 1-2 word search query that best represents what news they want.

          STEP 2: Use fetch_news_tool ONCE with the search query to retrieve news stories. 
          Example: fetch_news_tool("technology")

          STEP 3: From the returned news stories:
          - If no stories are found, respond with: "Sorry, I couldn't find any news stories about [search query]."
          - If stories are found, select up to 5 unique and important stories based on titles.

          STEP 4: Format the selected stories into a newsletter with both markdown and HTML versions.

          Return the final output as this JSON structure:
          {
            "markdown": "Markdown formatted newsletter here",
            "html": "HTML formatted newsletter here"
          }

          Note: If fetch_news_tool fails or is unavailable, respond with: "I'm unable to fetch news at the moment. Please try again later or check if fetch_news_tool is properly configured."
        `)
      ]
    }, {
      recursionLimit: 10
    }
  );

  var content = finalState.messages[finalState.messages.length - 1].content;
  /**
   * Some GPT models will wrap the output array in an object, despite response formatting and strict prompting.
   * Ex: { "results": [<< our data array >>] }
   * Need to handle these edge cases gracefully in order to guarantee consistent output for users.
   */
  var output: Output = { markdown: '', html: '' };
  if (typeof content === 'string') {
    try {
      var parsed = JSON.parse(content) as MessageContentComplex[];
      if (parsed && typeof parsed === 'object') {
        output = {
          markdown: (parsed as any).markdown ?? '',
          html: (parsed as any).html ?? ''
        } as Output;
      }
    } catch (err: any) {
      console.error("Failed to parse JSON:", err);
      output = { error: err.message, markdown: '', html: '' };
    }
  }

  console.log('output')
  console.log(output)

  await Actor.charge({ eventName: 'news-output', count: (JSON.stringify(output).length/10) });

  await Actor.pushData(output);
} catch (e: any) {
  console.log(e);
  await Actor.pushData({ error: e.message });
}
await Actor.exit();