const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const builtBotPath = path.join(__dirname, 'apps', 'bot', 'dist', 'index.js');
const sourceBotPath = path.join(__dirname, 'apps', 'bot', 'src', 'index.ts');

const children = [];

function spawnBot() {
  const botEnv = {
    ...process.env,
    API_PORT: process.env.BOT_API_PORT || process.env.API_PORT || '4000',
  };

  if (fs.existsSync(builtBotPath)) {
    console.log('🤖 Khởi động Bot đã build (Production)...');
    return spawn('node', [builtBotPath], {
      stdio: 'inherit',
      cwd: __dirname,
      env: botEnv,
    });
  } else {
    console.log('🤖 Khởi động Bot từ nguồn TypeScript (Direct)...');
    return spawn('npx', ['tsx', sourceBotPath], {
      stdio: 'inherit',
      cwd: __dirname,
      env: botEnv,
    });
  }
}

function spawnDashboard() {
  console.log('📊 Khởi động Next.js Dashboard (Production)...');
  const dashboardCwd = path.join(__dirname, 'apps', 'dashboard');
  const isWin = process.platform === 'win32';
  const port = process.env.PORT || '3000';

  if (isWin) {
    return spawn('pnpm.cmd', ['start'], {
      stdio: 'inherit',
      shell: true,
      cwd: dashboardCwd,
      env: { ...process.env, PORT: port },
    });
  }

  // Trên Linux / Docker: Ưu tiên pnpm start hoặc npx next start
  return spawn('pnpm', ['run', 'start'], {
    stdio: 'inherit',
    cwd: dashboardCwd,
    env: { ...process.env, PORT: port },
  });
}

const botProcess = spawnBot();
children.push(botProcess);

let dashProcess = null;
try {
  dashProcess = spawnDashboard();
  if (dashProcess) children.push(dashProcess);
} catch (err) {
  console.error('⚠️ Lỗi khi khởi chạy Dashboard (Bot vẫn tiếp tục hoạt động):', err);
}

const cleanup = (code) => {
  console.log('🛑 Đang dừng dịch vụ...');
  for (const child of children) {
    if (child && !child.killed) {
      try {
        child.kill('SIGTERM');
      } catch {
        // Ignore
      }
    }
  }
  process.exit(code || 0);
};

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));

botProcess.on('close', (code) => {
  console.log(`🤖 Bot process exited with code ${code}`);
  if (code !== 0) {
    console.error('❌ Bot process crashed. Restarting process...');
  }
});

if (dashProcess) {
  dashProcess.on('close', (code) => {
    console.log(`📊 Dashboard process exited with code ${code}`);
    // Giữ cho Bot tiếp tục chạy ngay cả khi Dashboard bị tắt hoặc dừng
  });
}
