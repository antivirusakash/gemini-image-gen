import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

export const configSchema = z.object({
  apiKey: z.string().describe('Google Generative AI API Key'),
  imagePath: z.string().describe('Path to save the generated image'),
});

export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  const server = new McpServer({
    name: 'GeminiImageGen',
    version: '1.0.0',
  });

  server.tool(
    'generateImage',
    'Generate an image using Gemini Pro Vision',
    { 
      prompt: z.string().describe('The prompt for the image generation'),
    },
    async ({ prompt }) => {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // For now, we'll assume the model returns a URL to the image.
      // We'll fetch the image and save it to the specified path.
      const imageUrl = text; // Replace with actual image URL from response
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(config.imagePath, Buffer.from(imageBuffer));

      return { content: [{ type: 'text', text: `Image saved to ${config.imagePath}` }] };
    }
  );

  return server.server;
}