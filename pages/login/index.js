import { loginByCode } from '../../utils/auth'

const app = getApp()

Page({
  data: {
    title:app.appName,
    loginType: 0
  },
  


  
  onLoad() {
    this.getLoginType();
  },

  getLoginType() {
    wx.request({
      url: app.url + 'user/getLoginType',
      method: 'POST',
      success: (res) => {
        this.setData({loginType: res.data.data});
      }
    });
  },
  
  login(){
    loginByCode(app, { backOnSuccess: true }).catch(() => {});
  },

  getPhoneNumber(e) {
    if (e.detail.errno === 102 || e.detail.errMsg.indexOf('no permission') !== -1) {
      wx.showToast({title: '无权限，请在后台选择不获取手机号', icon: 'none', duration: 3000});
      return;
    }

    loginByCode(app, { backOnSuccess: true, phoneCode: e.detail.code }).catch(() => {});

  },

  cancelLogin() {
      const pages = getCurrentPages();
      if (pages && pages.length > 1) {
          wx.navigateBack({ delta: 1 });
      } else {
          wx.switchTab({ url: '/pages/home/index' });
      }
      
  }





});
