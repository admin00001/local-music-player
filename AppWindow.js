const { BrowserWindow } = require('electron')

class AppWindow extends BrowserWindow {
  constructor(config, fileUrl) {
    const baseConfig = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true, // 可以在render process中使用nodejs的api
      }
    }

    const finalConfig = {...baseConfig, ...config}

    super(finalConfig)
    this.loadFile(fileUrl) // 加载页面

    // 渲染进程准备好了再显示，不然页面容易闪烁
    this.once('ready-to-show', () => {
      this.show()
    })
  }
}

module.exports = AppWindow
