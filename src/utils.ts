import { Story } from "./types.js";

export const formatMarkdown = (newsRequest: string, stories: Story[]) => {
  const template = `# Newsletter - *${newsRequest}*\n\n
${stories.map(story => `
<h2><a href='${story.link}'>${story.title}</a> | ${story.source}</h2>\n\n
${story.summary}\n\n
`).join('')}
`;

  return template.trim();
};



export const formatHtml = (newsRequest: string, stories: Story[]) => {
  const template = `
<!DOCTYPE html>
<html>
<head>
  <title>Newsletter - ${newsRequest}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { margin-top: 20px; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .source { color: #666; font-size: 0.9em; }
    .summary { margin-top: 5px; }
  </style>
</head>
<body>
  <h1>Newsletter - <em>${newsRequest}</em></h1>
  ${stories.map(story => `
    <div class='story'>
      <h2><a href='${story.link}'>${story.title}</a><span class='source'> | ${story.source}</span></h2>
      <div class='summary'>${story.summary}</div>
    </div>
  `).join('')}
</body>
</html>
  `;
  
  // Remove excess whitespace and newlines
  return template.replace(/\s+/g, ' ').trim();
};