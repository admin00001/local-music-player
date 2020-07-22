const { ipcRenderer } = require('electron')
const path = require('path')

let musicPathList = []

document.getElementById('selectMusic').addEventListener('click', () => {
  // 通知主进程去打开选择窗口去选择音乐
  ipcRenderer.send('open-music-file')
})

// 主进程发来的选择文件信息
ipcRenderer.on('selected-file', (event, pathList) => {
  if (Array.isArray(pathList)) {
    renderHtmlList(pathList)
    musicPathList = pathList

    document.getElementById('addMusic').classList.remove('d-none') // 让导入按钮显示出来
  }
})

//渲染列表到页面
function renderHtmlList(pathList) {
  const musicListEl = document.getElementById('musicList')

  const musicHtml = pathList.reduce((html, music) => {
    return html += `<li class="list-group-item">${path.basename(music)}</li>` // path.basename 获取后缀名
  }, '')

  musicListEl.innerHTML = `<ul class="list-group">${musicHtml}</ul>`

}

// 导入音乐
document.getElementById('addMusic').addEventListener('click', () => {
  // 通知主进程导入音乐
  ipcRenderer.send('add-tracks', musicPathList)
})

document.getElementById('close').addEventListener('click', () => {
  ipcRenderer.send('close-add-window')
})
