const { ipcRenderer } = require('electron')

let audio = new Audio()
let currentTrack // 当前的音乐的数据
let tracksList = [] // 歌曲数据列表
let actionState = 'play' // 当前播放的音乐的按钮状态 play | pause

// 渲染到页面
function renderMusicList(tracks) {
  const listEl = document.getElementById('list')
  const htmlString = tracks.reduce((html, track) => {
    let start = `<li class="list-group-item">`
    let action = `<i class="fa fa-play  mr-2" data-id="${track.id}"></i>`
    if (track.id === (currentTrack && currentTrack.id)) {
      start = `<li class="list-group-item active">`
      action = `<i class="fa fa-${actionState}  mr-2" data-id="${track.id}"></i>`
    }
    return html += `${start}
      <div class="row">
        <div class="col-10">
          <div class="row">
            <div class="col-1 pr-0">
              <i class="fa fa-music"></i>
            </div>
            <div class="col-11">
              <b class="text-over-hide">${track.fileName}</b>
            </div>
          </div>
        </div>

        <div class="col-2 text-right action-container">
          ${action}
          <i class="fa fa-trash" data-id="${track.id}"></i>
        </div>
      </div>
    </li>`
  }, '')

  const emptyHtml = `
  <li class="list-group-item empty">
    <div class=" text-secondary text-center"> 暂无歌曲 </div>
  </li>`
  listEl.innerHTML = tracks.length ? htmlString : emptyHtml
}

// 获取音乐列表信息
ipcRenderer.on('getTracks', (event, tracks) => {
  renderMusicList(tracks)
  tracksList = tracks
})

const progressEl = document.getElementById('progress') // 进度条element
const musicNameEl = document.getElementById('musicName') // 当前播放的歌曲名的element
const currentTimeEl = document.getElementById('currentTime') // 当前播放的歌曲的进度时间
const totalTimeEl = document.getElementById('totalTime') // 当前播放的歌曲的总时间
const progressStatusEl = document.getElementById('progressStatus') // 当前播放的歌曲的百分比进度element
const playPauseBtnEl = document.getElementById('playPauseBtn') // 底部播放或者暂停的按钮


// 监听音乐开始播放
audio.addEventListener('loadedmetadata', function () {
  musicNameEl.innerHTML = currentTrack.fileName
  currentTimeEl.innerHTML = '00:00'
  totalTimeEl.innerHTML = formatTime(this.duration)
  progressStatusEl.innerHTML = '0%'
})

// 格式化秒数时间
function formatTime(time) {
  time = Number(Math.ceil(time))

  const f = t => t < 10 ? '0' + t : t

  if (time <= 60) return '00:' + f(time)

  const m = Math.floor(time / 60)
  const s = time - 60 * m
  return `${f(m)}:${f(s)}`
}

// 监听音乐播放结束
audio.addEventListener('ended', () => {
  const el = document.querySelector('.list-group-item.active')
  if (el) {
    let pauseEl = el.querySelector('.fa-pause')
    pauseEl && pauseEl.classList.replace('fa-pause', 'fa-play') // 改变播放按钮状态
    actionState = 'play'
    playPauseBtnClassToggle()
    // 自动下一首
    if (el.nextSibling) {
      let playEl = el.nextSibling.querySelector('.fa-play')
      playEl && playEl.click()
    }
  }
})

// 监听音乐播放进度
audio.addEventListener('timeupdate', function () {
  let total = this.duration
  let current = this.currentTime
  let s = Math.ceil(current / total * 100) + '%'
  progressEl.style.width = s
  progressStatusEl.innerHTML = s
  currentTimeEl.innerHTML = formatTime(current)
})

// 添加歌曲
document.getElementById('addMusicButton').addEventListener('click', function () {
  ipcRenderer.send('add-music-window')
})


// 点击歌曲列表事件代理
document.getElementById('list').addEventListener('click', event => {
  event.preventDefault()

  const { dataset, classList } = event.target
  const id = dataset && dataset.id

  if (!id) return

  if (classList.contains('fa-play')) {
    // 点击播放
    let track = tracksList.find(track => track.id === id)
    if (currentTrack && currentTrack.id === track.id) {
      // 还是这一首歌
      audio.play()
      classList.replace('fa-play', 'fa-pause')
      actionState = 'pause'
      playPauseBtnClassToggle() // 底部的播放暂停按钮状态跟着变
      return
    }

    // 先还原上一首歌的状态
    const el = document.querySelector('.list-group-item.active')
    if (el) {
      let pauseEl = el.querySelector('.fa-pause')
      pauseEl && pauseEl.classList.replace('fa-pause', 'fa-play')
      el.classList.remove('active')
    }

    // 新歌
    currentTrack = track
    audio.src = currentTrack.path
    audio.play()
    event.target.parentNode.parentNode.parentNode.classList.add('active') // 设置当前歌曲的状态
    classList.replace('fa-play', 'fa-pause')
    actionState = 'pause'
    playPauseBtnClassToggle() // 底部的播放暂停按钮状态跟着变

  } else if (classList.contains('fa-pause')) {
    // 点击暂停播放
    audio.pause()
    classList.replace('fa-pause', 'fa-play')
    actionState = 'play'
    playPauseBtnClassToggle() // 底部的播放暂停按钮状态跟着变
  } else if (classList.contains('fa-trash')) {
    // 点击删除
    let res = window.confirm('您确定要删除这首歌曲吗？', '本地播放器')
    if (res) {
      // 确定删除,通知主进程去删除列表
      if (currentTrack && currentTrack.id === id) {
        audio.pause() // 不管是否在播放 都暂停正在播放的音乐
        setTimeout(() => {
          progressEl.style.width = '0'
          musicNameEl.innerHTML = '正在播放：'
          currentTimeEl.innerHTML = '00:00'
          totalTimeEl.innerHTML = '00:00'
          progressStatusEl.innerHTML = '0%'

          currentTrack = null // 清空当前的歌
          actionState = 'play' // 当前播放的音乐的按钮状态 play | pause
          playPauseBtnClassToggle() // 底部的播放暂停按钮状态跟着变
        }, 20)
      }
      ipcRenderer.send('remove-track', id)
    }
  }
})


// 上一首
document.getElementById('prev').addEventListener('click', event => {
  event.preventDefault()
  const el = document.querySelector('.list-group-item.active')
  if (el) {
    if (el.previousSibling) {
      let playEl = el.previousSibling.querySelector('.fa-play')
      playEl && playEl.click()
    }
  }
})

// 下一首
document.getElementById('next').addEventListener('click', event => {
  event.preventDefault()
  const el = document.querySelector('.list-group-item.active')
  if (el) {
    if (el.nextSibling) {
      let playEl = el.nextSibling.querySelector('.fa-play')
      playEl && playEl.click()
    }
  }
})


// 当前播放暂停按钮
playPauseBtnEl.addEventListener('click', event => {
  event.preventDefault()
  let el = document.querySelector('.list-group-item.active')
  if (el) {
    //有播放、暂停的歌
    el.querySelector('.action-container').querySelectorAll('i')[0].click() // 点击第一个图标，可能是暂停可能是播放
  } else {
    // 播放第一首
    tracksList.length && document.querySelector('.list-group-item').querySelector('.fa-play').click()
  }
})

// 按钮状态变化
function playPauseBtnClassToggle() {
  setTimeout(() => {
    let classList = playPauseBtnEl.querySelector('i').classList
    actionState === 'pause' ?  classList.replace('fa-play', 'fa-pause') : classList.replace('fa-pause', 'fa-play')
  }, 20)
}


