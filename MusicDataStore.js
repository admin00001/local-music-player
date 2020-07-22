const Store = require('electron-store')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

// 实现一个本地存储类
class DataStore extends Store {
  constructor(settings) {
    super(settings)
    this._tracks = this.getTracks() // 保存的列表
  }

  // 保存
  saveTracks() {
    this.set('tracks', this._tracks)
    return this
  }

  // 获取
  getTracks() {
    return this.get('tracks') || []
  }

  // 添加
  addTracks(tracks) {
    const tracksWithProps = tracks.map(track => {
      return {
        id: uuidv4(),
        path: track,
        fileName: path.basename(track)
      }
    }).filter(track => {
      // 去重
      const currentTracksPath = this.getTracks().map(track => track.path) // 拿到已经存在的path列表
      return currentTracksPath.indexOf(track.path) < 0
    })

    this._tracks = [...this._tracks, ...tracksWithProps]

    return this.saveTracks()
  }

  // 删除某条
 removeTrack(id) {
  this._tracks = this._tracks.filter(track => track.id !== id)
  return this.saveTracks()
 }
}

module.exports = DataStore
