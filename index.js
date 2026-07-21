const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const builtBotPath = path.join(__dirname, 'apps', 'bot', 'dist', 'index.js');
const builtDeployPath = path.join(__dirname, 'apps', 'bot', 'dist', 'deploy-commands.js');
const sourceBotPath = path.join(__dirname, 'apps', 'bot', 'src', 'index.ts');

const children = [];

function spawnBot() {
  if (fs.existsSync(builtBotPath)) {
    console.log('🤖 Khởi động Bot đã build (Production)...');
    return spawn('node', [builtBotPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
  } else {
    console.log('🤖 Khởi động Bot từ nguồn TypeScript (Direct)...');
    return spawn('npx', ['tsx', `"${sourceBotPath}"`], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
  }
}

function spawnDashboard() {
  console.log('📊 Khởi động Next.js Dashboard (Production)...');
  const dashboardCwd = path.join(__dirname, 'apps', 'dashboard');
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'pnpm.cmd' : 'npx';
  const port = process.env.PORT || '3000';
  const args = isWin ? ['start'] : ['next', 'start', '-p', port];

  return spawn(cmd, args, {
    stdio: 'inherit',
    shell: isWin,
    cwd: dashboardCwd
  });
}

// Tự động đăng ký slash commands trên Production nếu file đã được build
if (fs.existsSync(builtDeployPath)) {
  console.log('🚀 Đang tự động đăng ký Slash Commands lên Discord (Production)...');
  try {
    const deployResult = spawnSync('node', [builtDeployPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    if (deployResult.status === 0) {
      console.log('✅ Đăng ký Slash Commands thành công!');
    } else {
      console.warn('⚠️ Đăng ký Slash Commands kết thúc với mã lỗi:', deployResult.status);
    }
  } catch (err) {
    console.error('❌ Lỗi khi tự động đăng ký Slash Commands:', err);
  }
}

const botProcess = spawnBot();
children.push(botProcess);

const dashProcess = spawnDashboard();
children.push(dashProcess);

const cleanup = (code) => {
  console.log('🛑 Đang dừng toàn bộ dịch vụ (Bot & Dashboard)...');
  for (const child of children) {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(code || 0);
};

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));

botProcess.on('close', (code) => {
  console.log(`🤖 Bot process exited with code ${code}`);
  cleanup(code);
});

dashProcess.on('close', (code) => {
  console.log(`📊 Dashboard process exited with code ${code}`);
  cleanup(code);
});

