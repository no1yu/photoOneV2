import { request } from '../../utils/request'

const app = getApp()
Page({
  scene: 0,
  data: {
    isAuthorized: false,
    submitting: false
  },


  onLoad(options) {
    this.scene = options.scene ? decodeURIComponent(options.scene) : 0;
  },
  
  login() {
    this.setData({submitting: true});
    wx.login({
        success: (loginRes) => {
            request({
                url: app.url + 'admin/okLogin',
                data: { "code1": loginRes.code,"code2":this.scene},
                method: "GET",
                loginOnInvalid: false
            }).then((res) => {
                  if (res.code == 200) {
                    this.setData({
                      isAuthorized: true 
                    });
                  }else{
                    wx.showToast({
                      title: res.data || res.msg || '授权失败',
                      icon: 'none'
                    });
                  }
            }).catch(() => {}).finally(() => this.setData({submitting: false}))
        },
        fail: () => {
          this.setData({submitting: false});
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
    })
  },

  closeLogin(){
    wx.reLaunch({
      url: '/pages/home/index'
  });


  }




})
