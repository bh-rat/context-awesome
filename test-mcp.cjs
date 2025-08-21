#!/usr/bin/env node

/**
 * Test script for Context Awesome MCP Server
 * Tests the integration with the backend API
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Start the MCP server
const mcp = spawn('node', ['build/index.js', '--transport', 'stdio'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

const rl = readline.createInterface({
  input: mcp.stdout,
  output: process.stdout,
  terminal: false
});

// Listen for MCP server output
rl.on('line', (line) => {
  console.log('MCP:', line);
  
  // If server is ready, send a test request
  if (line.includes('running on stdio')) {
    console.log('\n✅ MCP Server started successfully');
    console.log('📝 Sending test request...\n');
    
    // Send a JSON-RPC request to find sections
    const request = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'find_sections',
        arguments: {
          query: 'machine learning frameworks',
          limit: 3
        }
      },
      id: 1
    };
    
    mcp.stdin.write(JSON.stringify(request) + '\n');
  }
  
  // Check for response
  try {
    const json = JSON.parse(line);
    if (json.id === 1 && json.result) {
      console.log('\n✅ Response received from MCP server:');
      console.log(JSON.stringify(json.result, null, 2));
      
      // Exit after successful test
      setTimeout(() => {
        console.log('\n✨ Test completed successfully!');
        process.exit(0);
      }, 1000);
    }
  } catch (e) {
    // Not JSON, ignore
  }
});

// Handle errors
mcp.stderr.on('data', (data) => {
  console.error('MCP Error:', data.toString());
});

mcp.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

mcp.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  process.exit(code);
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  mcp.kill();
  process.exit(0);
});

console.log('🚀 Starting Context Awesome MCP Server test...');
console.log('📡 Backend API should be running on http://localhost:3000\n');