const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const { fork } = require('child_process');

const isDev = !app.isPackaged;
const PORT = 5001;
const APP_URL = `http://127.0.0.1:${PORT}`;

let serverProcess = null;
let mainWindow = null;

// Keep grandma's data in a writable location (Roaming\Grandma's Closet on Windows)
const userDataDir = app.getPath('userData');
process.env.PORT = String(PORT);
process.env.GRANDMAS_CLOSET_DATA_DIR = userDataDir;

function startBackend() {
  if (isDev) {
    // In dev, run the TS source via tsx
    serverProcess = fork(
      require.resolve('tsx/cli'),
      ['server/index.ts'],
      {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, NODE_ENV: 'development' },
        stdio: 'inherit',
      }
    );
  } else {
    // In packaged app, run the bundled CJS server using Electron's own Node
    const serverPath = path.join(__dirname, '..', 'dist', 'index.cjs');
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, NODE_ENV: 'production', ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit',
    });
  }

  serverProcess.on('exit', (code) => {
    console.error(`Backend exited with code ${code}`);
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Backend did not start in time'));
        } else {
          setTimeout(tryOnce, 250);
        }
      });
    };
    tryOnce();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Grandma's Closet",
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadURL(APP_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startBackend();
  try {
    await waitForServer(APP_URL);
  } catch (err) {
    console.error(err);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch {}
    serverProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch {}
    serverProcess = null;
  }
});
