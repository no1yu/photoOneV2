import { request } from '../../utils/request'

Page({
  data: {
    applications: []
  },

  onLoad() {
    this.unloaded = false
  },

  onShow() {
    this.pageShowing = true
    this.getExploreData()
  },

  onHide() {
    this.pageShowing = false
  },

  onUnload() {
    this.unloaded = true
    this.pageShowing = false
  },

  getExploreData() {
    request({
      url: getApp().url + 'otherApi/exploreIndex',
      method: 'GET',
      loginOnInvalid: false
    }).then((res) => {
      if (this.unloaded || !this.pageShowing) {
        return
      }

      //当后端成功返回应用列表时，直接保存后台已经排好顺序的应用
      if (res.code === 200) {
        this.setData({
          applications: Array.isArray(res.data) ? res.data : []
        })
      }
    }).catch(() => {})
  },

  navigateTo(e) {
    const appId = Number(e.currentTarget.dataset.appId || 0)
    const title = e.currentTarget.dataset.title || '图片处理'

    //当点击智能证件照时，进入证件照规格页面
    if (appId === 3) {
      wx.navigateTo({
        url: '/pages/sizeList/index'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/exploreHandle/index?appId=' + appId + '&title=' + encodeURIComponent(title)
    })
  }
})
