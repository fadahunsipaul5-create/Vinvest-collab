#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Checking frontend URL...\n');

// Check if we're in the right directory
const currentDir = process.cwd();
const frontendDir = path.join(currentDir, 'sec_frontend');

console.log(`Current directory: ${currentDir}`);
console.log(`Frontend directory: ${frontendDir}\n`);

// Check if package.json exists
const fs = require('fs');
if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.log('❌ Frontend directory not found. Please run this script from the project root.');
  process.exit(1);
}

console.log('✅ Frontend directory found\n');

// Check what port Vite will use
console.log('📋 Vite typically uses these ports:');
console.log('   - Port 5173 (default)');
console.log('   - Port 3000 (if 5173 is busy)');
console.log('   - Port 4173 (preview mode)\n');

console.log('🌐 Your frontend URLs should be:');
console.log('   - http://localhost:5173');
console.log('   - http://127.0.0.1:5173');
console.log('   - http://localhost:3000 (if 5173 is busy)');
console.log('   - http://127.0.0.1:3000 (if 5173 is busy)\n');

console.log('🔧 To start your frontend and see the exact URL:');
console.log('   cd sec_frontend');
console.log('   npm run dev\n');

console.log('📝 Add these URLs to Google OAuth Console:');
console.log('   - Go to: https://console.cloud.google.com/');
console.log('   - APIs & Services → Credentials');
console.log('   - Edit your OAuth 2.0 Client ID');
console.log('   - Add to "Authorized JavaScript origins":');
console.log('     * http://localhost:5173');
console.log('     * http://127.0.0.1:5173');
console.log('     * http://localhost:3000');
console.log('     * http://127.0.0.1:3000\n');

console.log('⏰ After adding URLs, wait 5-10 minutes for changes to propagate.');
console.log('🔄 Clear browser cache or use incognito mode to test.'); 