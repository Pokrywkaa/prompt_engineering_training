#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🧪 Public Transport API Test Runner${colors.reset}`);
console.log(`${colors.blue}📂 Running Jasmine tests for PublicTransportAPI...${colors.reset}`);
console.log('');

// Check if we're in the right directory
const specRunnerPath = path.join(__dirname, 'SpecRunner.html');
const frontendRoot = path.join(__dirname, '..');

if (!fs.existsSync(specRunnerPath)) {
    console.error(`${colors.red}❌ SpecRunner.html not found at: ${specRunnerPath}${colors.reset}`);
    process.exit(1);
}

// Function to open browser
async function openBrowser() {
    const open = await import('open').catch(() => null);

    if (open) {
        console.log(`${colors.green}🌐 Opening test runner in browser...${colors.reset}`);
        await open.default(`file://${specRunnerPath}`);
        console.log(`${colors.green}✅ Test runner opened successfully${colors.reset}`);
    } else {
        // Fallback to system commands
        const platform = process.platform;
        let command;

        switch (platform) {
            case 'darwin':
                command = 'open';
                break;
            case 'win32':
                command = 'start';
                break;
            default:
                command = 'xdg-open';
        }

        console.log(`${colors.yellow}📱 Attempting to open with system command: ${command}${colors.reset}`);

        const child = spawn(command, [`file://${specRunnerPath}`], {
            detached: true,
            stdio: 'ignore'
        });

        child.unref();

        child.on('error', (err) => {
            console.error(`${colors.red}❌ Failed to open browser automatically${colors.reset}`);
            console.log(`${colors.yellow}📍 Please manually open: file://${specRunnerPath}${colors.reset}`);
        });

        console.log(`${colors.green}✅ Test runner command executed${colors.reset}`);
    }
}

// Function to serve with http-server
function serveTests() {
    console.log(`${colors.blue}🚀 Starting HTTP server for tests...${colors.reset}`);

    const server = spawn('npx', ['http-server', frontendRoot, '-p', '3001', '-o', '/test/SpecRunner.html'], {
        stdio: 'inherit',
        cwd: frontendRoot
    });

    server.on('error', (err) => {
        console.error(`${colors.red}❌ Failed to start HTTP server:${colors.reset}`, err.message);
        console.log(`${colors.yellow}💡 Try running: npm install${colors.reset}`);
        console.log(`${colors.yellow}💡 Or open file directly: file://${specRunnerPath}${colors.reset}`);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        console.log(`\n${colors.yellow}🛑 Stopping test server...${colors.reset}`);
        server.kill();
        process.exit(0);
    });
}

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'open';

switch (mode) {
    case 'serve':
    case 'server':
        serveTests();
        break;
    case 'open':
    case 'browser':
    default:
        openBrowser();
        break;
}

console.log('');
console.log(`${colors.cyan}📋 Available commands:${colors.reset}`);
console.log(`${colors.green}  npm test${colors.reset}          - Open tests in browser (default)`);
console.log(`${colors.green}  npm run test:serve${colors.reset} - Start HTTP server with tests`);
console.log(`${colors.green}  node test/run-tests.js serve${colors.reset} - Start server mode`);
console.log('');
console.log(`${colors.blue}🔍 Test file location: test/SpecRunner.html${colors.reset}`);
