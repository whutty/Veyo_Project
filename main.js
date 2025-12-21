const { app, BrowserWindow, Menu } = require('electron');

function createWindow() {
  Menu.setApplicationMenu(null); 

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#f9f9fb', // Cor de fundo do Firefox
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});