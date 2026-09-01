import { ensureLogin } from '../../utils/auth';
import { request, uploadFile } from '../../utils/request';

const app = getApp();

Page({
  data: {
    typeList: [
      {value: 1, name: '功能建议'},
      {value: 2, name: '使用体验'},
      {value: 3, name: '投诉'},
      {value: 4, name: '其它'}
    ],
    type: 1,
    content: '',
    image: '',
    contact: '',
    submitting: false
  },

  onLoad() {
    ensureLogin();
  },

  selectType(e) {
    this.setData({
      type: e.currentTarget.dataset.value
    });
  },

  changeContent(e) {
    this.setData({
      content: e.detail.value
    });
  },

  changeContact(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          image: res.tempFiles[0].tempFilePath
        });
      }
    });
  },

  previewImage() {
    wx.previewImage({
      current: this.data.image,
      urls: [this.data.image]
    });
  },

  deleteImage() {
    this.setData({image: ''});
  },

  async submitFeedback() {
    const content = this.data.content.trim();
    if (content.length < 10) {
      wx.showToast({
        title: '请至少填写10个字',
        icon: 'none'
      });
      return;
    }

    this.setData({submitting: true});
    wx.showLoading({
      title: '提交中'
    });
    try {
      const data = {
        type: String(this.data.type),
        content,
        contact: this.data.contact.trim()
      };
      let res;
      if (this.data.image) {
        res = await uploadFile({
          url: app.url + 'user/submitFeedback',
          filePath: this.data.image,
          formData: data,
          auth: true
        });
      } else {
        res = await request({
          url: app.url + 'user/submitFeedback',
          method: 'POST',
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          auth: true,
          data
        });
      }
      if (res.code !== 200) {
        wx.showToast({
          title: res.data,
          icon: 'none'
        });
        return;
      }

      wx.showToast({
        title: '反馈提交成功',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    } finally {
      wx.hideLoading();
      this.setData({submitting: false});
    }
  }
});
