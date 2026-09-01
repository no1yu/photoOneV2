import { getToken } from '../../utils/auth'
import { getLocalFileSize } from '../../utils/media'
import { request, uploadFile } from '../../utils/request'

const app = getApp()

Page({

  data: {
    cameraPosition: 'back',
    cameraVisible: true,
    cameraImg: false,
    photoSrc: '',
    detail: {}
  },


  onLoad() {
    this.getEmitData()
  },

  // 相机组件启动失败
  error() {
    this.setData({
      cameraVisible: false
    })
    wx.showModal({
      title: '相机无法使用',
      content: '相机启动失败，请检查摄像头权限或设备状态。您可以返回上一页改用相册上传。',
      confirmText: '返回选择',
      cancelText: '重新尝试',
      success: (res) => {
        if (res.confirm) {
          this.goPreEdit()
          return
        }
        this.setData({
          cameraVisible: true
        })
      },
      fail: () => {
        this.goPreEdit()
      }
    })
  },

  // 接受参数
  getEmitData() {
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
    eventChannel && eventChannel.on('chooseCamera', (data) => {
      this.setData({
        detail: data
      })
    })
  },


  // 反转相机
  reverseCamera() {
    if (this.data.cameraImg) {
      return
    }

    const cameraPosition = this.data.cameraPosition === 'back' ? 'front' : 'back'
    this.setData({
      cameraVisible: false
    }, () => {
      this.setData({
        cameraPosition,
        cameraVisible: true
      })
    })
  },

  // 拍照
  photo() {
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          photoSrc: res.tempImagePath,
          cameraImg: true,
        })
      }
    })
  },

  // 去上传抠图编辑
  goEditPhoto() {
    if (this.data.photoSrc) {
      this.Uploadimg(this.data.photoSrc)
    }
  },

  // 返回拍照
  goBackPhoto() {
    this.setData({
      cameraImg: false,
      photoSrc: ''
    })

  },
  //返回前一页
  goPreEdit() {
    this.setData({
      cameraImg: false,
      photoSrc: ''
    })
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/home/index'
        })
      }
    })
  },

  // 上传原图
  async Uploadimg(filePath) {
    const fileSize = await getLocalFileSize(filePath).catch(() => 0);
    const fileSizeMB = fileSize / (1024 * 1024);
    if (fileSizeMB > 15) {
      wx.showToast({
        title: '图片太大啦，不能超15M哦',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.imgUpload(filePath)
  },

  // 上传原图
  imgUpload(filePath) {
    uploadFile({
      url: app.url+'upload',
      filePath: filePath, 
      auth: true,
      loadingText: '图片检测中'
    }).then((data) => {
        if (data.code == 200) {
          this.imageDivision(data.data);
        } else if (data.code == 404) {
          wx.showToast({
            title: data.data,
            icon: "none",
          });
        }
    }).catch(() => {});
   
  },

  imageDivision(photoId) {
    let type = this.data.detail.category == 4 ? 2 : 1;
    request({
      url: app.url + 'api/createIdPhoto',
      data: {
        "photoId": photoId,
        "type": type,
        "itemId": this.data.detail.id,
        "isBeautyOn": this.data.detail.isBeautyOn
      },
      header: {
        "token": getToken()
      },
      method: "POST",
      loadingText: '制作中...'
    }).then((res) => {
        if (res.code == 200) {
          wx.navigateTo({
            url: '/pages/edit/index',
            success(navigateRes) {
              navigateRes.eventChannel.emit('photoEditData', res.data);
            }
          });
        } else if (res.code == 404) {
          wx.showToast({
            title: res.data,
            icon: 'none'
          });
        }
    }).catch(() => {});
  },  
})
