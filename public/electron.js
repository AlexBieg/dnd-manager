const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;

const userDataFilePath = path.join((electron.app || electron.remote.app).getPath('userData'), 'user-data.json');


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
  });
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.on('closed', () => mainWindow = null);
  mainWindow.webContents.openDevTools();

  electron.ipcMain.on('save-user-data', function(event, data) {
    fs.writeFileSync(userDataFilePath, data, () => {});
  });

  electron.ipcMain.on('load-user-data', function(event, data) {
    let userData;

    try {
      userData = fs.readFileSync(userDataFilePath, {encoding:'utf8', flag:'r'});
    } catch (e) {
      userData = '{}'; // Empty json object
    }

    mainWindow.webContents.send('user-data', userData);
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});