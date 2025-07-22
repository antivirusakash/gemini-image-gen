import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GoogleGenAI } from '@google/genai';
import { writeFile } from 'fs';
import { promisify } from 'util';
import { z } from 'zod';

const writeFileAsync = promisify(writeFile);

class GeminiImageGenTool {
  async generateImage(prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    try {
      const response = await ai.models.generateImages({
        model: 'imagen-3.0',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (!response?.generatedImages || response.generatedImages.length !== 1) {
        throw new Error('Failed to generate image or wrong count');
      }

      const inlineData = response.generatedImages[0]?.image?.imageBytes;
      if (!inlineData) {
        throw new Error('No image data found');
      }

      const buffer = Buffer.from(inlineData, 'base64');
      const fileName = `image_${Date.now()}.jpeg`;
      const imagePath = process.env.imagePath || './';
      await writeFileAsync(`${imagePath}/${fileName}`, buffer);

      return `Image saved to ${imagePath}/${fileName}`;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
}

// --- Start MCP server directly ---
const server = new McpServer({
  name: 'gemini-image-gen-mcp',
  version: '1.0.0',
});

const tool = new GeminiImageGenTool();

server.registerTool(
  'generateImage',
  {
    title: 'Generate Image',
    description: 'Generate images using Gemini AI',
    inputSchema: {
      prompt: z.string().describe('The prompt for image generation'),
    },
  },
  async ({ prompt }) => {
    return {
      content: [
        {
          type: 'text',
          text: await tool.generateImage(prompt),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
server.connect(transport);
