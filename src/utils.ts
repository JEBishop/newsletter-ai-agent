import { Output } from "./types.js";

export const formatMarkdown = (newsRequest: string, output: Output) => {
    const formattedContent = `
  # Newsletter - *${newsRequest}*
  ${output.json.map(story => `
  ## [${story.title}](${story.link}) | ${story.source}
  ${story.summary}

  `).join('')}
  `;
  
    console.log(formattedContent);
    return formattedContent;
  }