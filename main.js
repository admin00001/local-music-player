const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const AppWindow = require('./AppWindow')
const DataStore = require('./MusicDataStore')
const MusicData = new DataStore({ name: 'Music Data' })
let mainWindow = null // 主页面
let addWindow = null // 添加页面

function createWindow() {
  mainWindow = new AppWindow({}, './renderer/index.html')
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.send('getTracks', MusicData.getTracks()) // 发送完成渲染事件
  })

  createMenu()

  // mainWindow.loadURL('https://www.huobi.me/zh-cn/')
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// 关闭添加歌曲窗口
function closeAddWindow() {
  if (addWindow) {
    addWindow.close()
    addWindow = null
  }
}

function createMenu() {
  let template = [
    // {
    //   label:'菜单1'
    // },
    // {
    //   label:'菜单2',
    //   submenu: [{
    //     label: '最小化',
    //     accelerator: 'CmdOrCtrl+M',
    //     role: 'minimize'
    //   }, {
    //     label: '关闭',
    //     accelerator: 'CmdOrCtrl+W',
    //     role: 'close'
    //   }, {
    //     type: 'separator'
    //   }, {
    //     label: '重新打开窗口',
    //     accelerator: 'CmdOrCtrl+Shift+T',
    //     enabled: false,
    //     key: 'reopenMenuItem',
    //     click: function () {
    //       app.emit('activate')
    //     }
    //   }]
    // },
    // {
    //   label:'菜单3'
    // }
  ]

  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()

  // 添加歌曲到曲库，创建一个添加窗口
  ipcMain.on('add-music-window', (event, arg) => {
    if (addWindow) return
    addWindow = new AppWindow({
      width: 500,
      height: 500,
      frame: false, // 无边框
      parent: mainWindow
    }, './renderer/add.html')

  })

  // 添加窗口发来的信息：打开文件夹去选择音乐
  ipcMain.on('open-music-file', (event) => {
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Music', extensions: ['mp3', 'flac'] }]
    }).then((res) => {
      // 拿到结果
      const { canceled, filePaths } = res
      if (!canceled && filePaths.length) {
        event.sender.send('selected-file', filePaths)
      }
    }).catch(err => {
      // 错误
    })
  })

  // 添加窗口发来的信息： 导入音乐
  ipcMain.on('add-tracks', (event, tracks) => {
    // 数据持久化
    const updateTracks = MusicData.addTracks(tracks).getTracks() // 先保存再拿最新的出来
    mainWindow.send('getTracks', updateTracks) // 通知index.html渲染
    closeAddWindow() // 关闭add页面
  })

  // 关闭add窗口
  ipcMain.on('close-add-window', (event, tracks) => {
    closeAddWindow() // 关闭add页面
  })

  // 删除歌曲
  ipcMain.on('remove-track', (event, id) => {
    const updateTracks = MusicData.removeTrack(id).getTracks()
    mainWindow.send('getTracks', updateTracks) // 通知index.html渲染
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!BrowserWindow.getAllWindows().length) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
