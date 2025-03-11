import Parser from 'rss-parser';
import { RSS_FEEDS } from './constants.js';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import log from '@apify/log';
import OpenAI from "openai";

const fetchNewsTool = tool(
    async (input) => {
      const parser = new Parser();
      log.info('in fetch_news_tool');
      log.info(JSON.stringify(input));
      
      const searchTerm = typeof input === 'string' ? input : input.topic;
      
      let results = [];
      for (const feedUrl of RSS_FEEDS) {
        try {
          const url = `${feedUrl}${encodeURIComponent(searchTerm)}`
          const response = await fetch(url);
          const text = await response.text();
          const feed = await parser.parseString(text);
          results.push(...feed.items.map(item => ({
            title: item.title,
            link: item.link,
            summary: (item.content || item.description || item['content:encoded']).replace(/<[^>]*>/g, ''),
            source: feed.title
          })));
        } catch (error) {
          console.error(`Failed to fetch from ${feedUrl} for topic ${searchTerm}:`, error);
        }
      }
      return JSON.stringify(results.slice(0,7));
    }, 
    {
      name: 'fetch_news_tool',
      description: 'Get news stories to build a newsletter about a topic',
      schema: z.object({
        topic: z.string().describe("The topic to search for news about")
      })
    }
);

const webSearchTool = tool(
  async (input) => {
    log.info('in search_query_tool');
    log.info(JSON.stringify(input));
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini-search-preview",
      messages: [{
          "role": "user",
          "content": input.topic,
      }],
    });
    return JSON.stringify(completion.choices[0].message.content);
  }, {
    name: 'search_query_tool',
    description: 'Search the web for news about a topic.',
    schema: z.object({
      topic: z.string().describe("The topic to search for news about")
    })
  }
);

export const agentTools = [
  fetchNewsTool,
  webSearchTool
];