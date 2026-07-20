const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const builtBotPath = path.join(__dirname, 'apps', 'bot', 'dist', 'index.js');
const sourceBotPath = path.join(__dirname, 'apps', 'bot', 'src', 'index.ts');

if (fs.existsSync(builtBotPath)) {
  console.log('🤖 Khởi động Bot đã build (Production)...');
  // Không dùng shell: true để tránh lỗi dấu cách (spaces) trong đường dẫn trên Windows
  const child = spawn('node', [builtBotPath], {
    stdio: 'inherit',
    cwd: __dirname
  });
  child.on('close', (code) => process.exit(code));
} else {
  console.log('🤖 Khởi động Bot từ nguồn TypeScript (Direct)...');
  // Dùng shell: true cho npx (là file script .cmd trên Windows) và bao quanh đường dẫn bằng dấu nháy kép
  const child = spawn('npx', ['tsx', `"${sourceBotPath}"`], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  child.on('close', (code) => process.exit(code));
}
