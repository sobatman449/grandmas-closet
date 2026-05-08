const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');

let serverProcess = null;

function startBackend() {
  const serverPath = isDev 
    ? path.join(__dirname, '../server/index.ts') 
    : path.join(__dirname, '../dist/index.cjs');

  const args = isDev 
    ? ['server/index.ts'] 
    : [serverPath];

  // Use 'tsx' for dev, 'node' for prod
  const cmd = isDev ? 'npx tsx' : 'node';

  serverProcess = spawn(cmd, args, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
    shell: true
  });

  serverProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
  serverProcess.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Grandma's Closet",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const url = isDev 
    ? 'http://localhost:5001' 
    : `file://${path.join(__dirname, '../dist/client/index.html')}`;

  win.loadURL(url);

  win.on('closed', () => {
    if (serverProcess) serverProcess.kill();
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
