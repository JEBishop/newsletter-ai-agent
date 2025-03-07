import Parser from 'rss-parser';
import { RSS_FEEDS } from './constants.js';
import { Tool } from '@langchain/core/tools';

class FetchNewsTool extends Tool {
    name = "fetch_news_tool";
    description = "Get news stories to build a newsletter about a topic";
    async _call(arg: string) {
        const parser = new Parser();
        
        let results = [];
        for (const feedUrl of RSS_FEEDS) {
            try {
                const url = `${feedUrl}${encodeURIComponent(arg)}`
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
                console.error(`Failed to fetch from ${feedUrl} for topic ${arg}:`, error);
            }
        }
        console.log(results.slice(0,7).length)
        return JSON.stringify(results.slice(0,7));
    }
}

export const agentTools = [
  new FetchNewsTool()
];