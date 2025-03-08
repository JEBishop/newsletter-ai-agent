import Parser from 'rss-parser';
import { RSS_FEEDS } from './constants.js';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const FetchNewsTool = tool(
    async (input) => {
      const parser = new Parser();
      let results = [];
      console.log(input)
      
      const searchTerm = typeof input === 'string' ? input : input.topic;
      
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

export const agentTools = [
  FetchNewsTool
];