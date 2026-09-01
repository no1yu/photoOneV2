import { goLogin, hasToken } from '../../utils/auth';
import { request, uploadFile } from '../../utils/request';

const app = getApp();

Page({
  data: {
    modalType: null, // 用于控制显示哪个模态框
    authorized: false,
    days: 0,
    avatarUrl: '../../images/tx.jpg', // 默认头像
    nickname: '陌生人', // 默认昵称
    avatarFile: '../../images/tx.jpg', // 修改头像
    nicknameFile: '',
    officialSwitch: 2,
    officialQrCode: '',
    helpList: [],
    helpLoading: false,
    title:app.appName
  },

  onLoad() {
  },

  // 读取个人中心公众号配置
  getMineSet() {
    request({
      url: app.url + 'user/getMineSet',
      method: 'POST',
      loginOnInvalid: false
    }).then((res) => {
      const mineSet = res.data;
      this.setData({
        officialSwitch: mineSet.officialSwitch,
        officialQrCode: mineSet.officialQrCodeImageUrl
      });
    }).catch(() => {});
  },

  // 读取常见问题
  getHelpList() {
    request({
      url: app.url + 'user/getHelpList',
      method: 'POST',
      loginOnInvalid: false
    }).then((res) => {
      this.setData({
        helpList: res.data,
        helpLoading: false
      });
    }).catch(() => {
      this.setData({
        helpLoading: false
      });
    });
  },

  // 获取用户信息，同时解决跳转登录后页面还是旧数据问题
  onShow() {
    this.getMineSet();
    if (!hasToken()) {
      this.setData({
        authorized: false
      });
      return;
    }

    request({
      url: app.url + 'user/userInfo',
      method: 'GET',
      auth: true,
      loginOnInvalid: false
    }).then((res) => {
      if (res.code !== 200) {
        this.setData({
          authorized: false
        });
        return;
      }

      const userInfo = res.data || {};
      this.calculateDays(userInfo.createTime);
      this.setData({
        authorized: true,
        avatarUrl: userInfo.avatarUrl || this.data.avatarUrl,
        avatarFile: userInfo.avatarUrl || this.data.avatarUrl,
        nickname: userInfo.nickname || this.data.nickname,
        nicknameFile: userInfo.nickname || this.data.nickname
      });
    }).catch(() => {});
  },

  // 修改用户信息
  async updateUserInfo() {
    const avatarChanged = this.data.avatarFile != this.data.avatarUrl;
    const nicknameChanged = this.data.nicknameFile != this.data.nickname;
    const nextNickname = this.data.nicknameFile.trim();

    if (!avatarChanged && !nicknameChanged) {
      this.closeModal();
      return;
    }

    if (nicknameChanged && !nextNickname && !avatarChanged) {
      this.closeModal();
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    try {
      if (avatarChanged) {
        const data = await uploadFile({
        url: app.url + 'user/updateUserInfo',
        filePath: this.data.avatarFile,
        auth: true
      });

        if (data.code === 200) {
          this.setData({
            avatarUrl: this.data.avatarFile
          });
        } else {
          throw new Error(data.data || '头像保存失败');
        }
      }

      if (nicknameChanged && nextNickname) {
        const res = await request({
        url: app.url + 'user/updateUserInfo',
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        auth: true,
        data: {
          nickname: nextNickname
        }
      });

        if (res.code === 200) {
          this.setData({
            nickname: nextNickname,
            nicknameFile: nextNickname
          });
        } else {
          throw new Error(res.data || '昵称保存失败');
        }
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      this.closeModal();
    } catch (err) {
      wx.showToast({
        title: err.message || '保存失败，请重试',
        duration: 2000,
        icon: 'none',
        mask: true
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 计算陪伴天数，注册当天为第1天
  calculateDays(time) {
    const startDate = time.substring(0,10).split('-');
    const currentDate = new Date();
    const startDay = Date.UTC(Number(startDate[0]),Number(startDate[1])-1,Number(startDate[2]));
    const currentDay = Date.UTC(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate());
    const diffDays = Math.floor((currentDay-startDay)/(24*60*60*1000));
    this.setData({
      days: diffDays+1
    });
  },

  goLogin() {
    goLogin();
  },

  // 打开编辑个人资料的模态框
  openEditProfileModal() {
    this.setData({
      modalType: 'editProfile'
    });
  },

  // 获取用户头像临时地址
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      avatarFile: avatarUrl
    });
  },

  // 监听昵称输入
  onNicknameInput(e) {
    this.setData({
      nicknameFile: e.detail.value,
    });
  },

  // 关闭模态框
  closeModal() {
    this.setData({
      modalType: null
    });
  },

  noop() {},

  openOfficialModal() {
    this.setData({
      modalType: 'official'
    });
  },

  saveOfficialQrCode() {
    wx.getImageInfo({
      src: this.data.officialQrCode,
      success: (info) => {
        wx.saveImageToPhotosAlbum({
          filePath: info.path,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          },
          fail: () => {
            wx.showToast({
              title: '请开启相册权限后重试',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '二维码读取失败',
          icon: 'none'
        });
      }
    });
  },

  // 我的作品
  mywork() {
    if (!hasToken()) {
      goLogin();
    } else {
      wx.navigateTo({
        url: "/pages/works/index",
      });
    }
  },

  // 意见反馈
  goFeedback() {
    if (!hasToken()) {
      goLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/feedback/index'
    });
  },

  // 我的权益弹框
  navigateToEdit() {
    this.setData({
      modalType: 'rights'
    });
  },

  // 常见问题弹框
  openHelpList() {
    this.setData({
      modalType: 'questions',
      helpLoading: true
    });
    this.getHelpList();
  }, 

  // 分享设置
  onShareAppMessage() {
    return {
      title: '哇塞，这个证件照小程序也太好用了吧！好清晰，还免费',
      path: 'pages/home/index',
      imageUrl: '/images/share.jpg'
    };
  },
  onShareTimeline() {
    return {
      title: '哇塞，这个证件照小程序也太好用了吧！好清晰，还免费',
      path: 'pages/home/index',
      imageUrl: '/images/share.jpg'
    };
  }
});
