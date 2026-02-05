const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

const logFile = path.join(app.getPath('userData'), 'app.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  console.log(logMsg);
  fs.appendFileSync(logFile, logMsg);
}

function createWindow() {
  log('Creating window...');
  Menu.setApplicationMenu(null); 

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#f9f9fb',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  win.loadFile('index.html');
  win.webContents.openDevTools();
  
  win.webContents.on('crashed', () => {
    log('Main window crashed');
  });

  log('Window created successfully');
}

app.whenReady().then(() => {
  log('App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', (err) => {
  log('Uncaught exception: ' + err.message);
  log(err.stack);
});