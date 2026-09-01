import { goLogin, hasToken, loginByCode } from '../../utils/auth'

const app = getApp()

Page({
  data: {
      autoplay: true,
      interval: 3000,
      duration: 1200,
      authorized: false,
      loginType: 0,
      swiperDatas: [
        {
          id: 1,
          imgurl: "../../images/home/1.jpg"
        }
      ]
  },


  onShow() {
    const authorized = hasToken();
    this.setData({
      authorized: authorized
    });
    if (!authorized) {
      this.getLoginType();
    }
  },


  getLoginType(){
    wx.request({
      url: app.url + 'user/getLoginType',
      method: 'POST',
      success: (res) => {
        this.setData({loginType: res.data.data});
      }
    });
  },


  login(){
    loginByCode(app, { showToast: true })
      .then(() => {
        this.setData({ authorized: true });
      })
      .catch(() => {});
  },

  getPhoneNumber(e) {
    if (e.detail.errno === 102 || e.detail.errMsg.indexOf('no permission') !== -1) {
      wx.showToast({title: '无权限，请在后台选择不获取手机号', icon: 'none', duration: 3000});
      return;
    }
    loginByCode(app, { showToast: true, phoneCode: e.detail.code }).then(() => {this.setData({ authorized: true });}).catch(() => {});
  },

  navigateTo(e) {
      const url = e.currentTarget.dataset.url;
      if (url === '/pages/home/index' || url === '/pages/explore/index' || url === '/pages/mine/index') {
          wx.switchTab({ url });
          return;
      }
      wx.navigateTo({
          url,
      })
  },

  openExploreFeature(e) {
    const appId = e.currentTarget.dataset.appId
    const title = e.currentTarget.dataset.title

    wx.navigateTo({
      url: '/pages/exploreHandle/index?appId=' + appId + '&title=' + encodeURIComponent(title)
    })
  },
  
  loginJump(e){
    if (!hasToken()) {
      goLogin();
    }else{
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      });
    }
  },
  
  //分享好友
  onShareAppMessage() {
    return {
      title: '哇塞，这个证件照小程序也太好用了吧！好清晰，还免费',
      path: 'pages/home/index',
      imageUrl: '/images/share.jpg'
    };
  },
  //分享朋友圈
  onShareTimeline() {
    return {
      title: '哇塞，这个证件照小程序也太好用了吧！好清晰，还免费',
      path: 'pages/home/index',
      imageUrl: '/images/share.jpg'
    };
  }


  
})
