"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSchema = void 0;
exports.default = default_1;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = require("zod");
const generative_ai_1 = require("@google/generative-ai");
const fs = __importStar(require("fs"));
exports.configSchema = zod_1.z.object({
    apiKey: zod_1.z.string().describe('Google Generative AI API Key'),
    imagePath: zod_1.z.string().describe('Path to save the generated image'),
});
function default_1({ config }) {
    const server = new mcp_js_1.McpServer({
        name: 'GeminiImageGen',
        version: '1.0.0',
    });
    server.tool('generateImage', 'Generate an image using Gemini Pro Vision', {
        prompt: zod_1.z.string().describe('The prompt for the image generation'),
    }, async ({ prompt }) => {
        const genAI = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
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
    });
    return server.server;
}
