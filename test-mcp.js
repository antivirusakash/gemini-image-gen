#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = path.join(__dirname, 'dist', 'index.js');

console.log('Testing MCP Server...');

// --- Initialization Test ---
const initializeRequest = {
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  },
  id: "test_init"
};

function runServerWithRequest(request) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe'
    });
    let output = '';
    let error = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
    });
    server.stderr.on('data', (data) => {
      error += data.toString();
    });
    server.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error('Server exited with error code: ' + code + '\n' + error));
      }
    });
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

(async () => {
  // Initialization test
  try {
    const output = await runServerWithRequest(initializeRequest);
    const response = JSON.parse(output);
    if (response.result?.protocolVersion && response.result?.capabilities) {
      console.log('✅ Initialization test passed!');
    } else {
      console.error('❌ Invalid initialization response');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Initialization test failed:', e.message);
    process.exit(1);
  }

  // Tool call test (update tool name and arguments as needed)
  const toolRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "generateImage", // Change if your tool is named differently
      arguments: {
        prompt: "A red circle on a white background"
      }
    },
    id: "test_tool"
  };
  try {
    const output = await runServerWithRequest(toolRequest);
    const response = JSON.parse(output);
    if (response.result && response.result.content && response.result.content.length > 0) {
      console.log('✅ Tool call test passed!');
      console.log('All validation tests passed!');
    } else {
      console.error('❌ Tool call did not return expected content');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Tool call test failed:', e.message);
    process.exit(1);
  }
})();
