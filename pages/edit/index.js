import { getToken } from '../../utils/auth'
import { saveImageFromUrl } from '../../utils/download'
import { createRewardedAd } from '../../utils/rewarded-ad'
import { request } from '../../utils/request'

const app = getApp()

Page({
  data: {
    imageData: {},
    photoName: '',
    showScale: 480 / 295,
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    scale: 1,
    rotate: 0,
    bgc: '#ffffff',
    maskLeft: 0,
    maskTop: 0,
    maskScale: 1,
    maskRotate: 0,
    pick: false,
    color: '#ffffff',
    //1未选择背景颜色，2已选择背景颜色
    colorType: 1,
    picUrl: '',
    //高清照下载配置和当前照片的下载状态
    downloadMode: null,
    downloadPrice: 0,
    videoUnitId: '',
    //1未解锁，2微信支付返回成功，等待后端支付回调成功，3已解锁
    downloadState: 1,
    downloadDrawerVisible: false,
    downloadDrawerClosing: false,
    downloadOptions: [],
    downloadPhotoMeta: '',
    selectedDownloadMethod: 0,
    kb: 0,
    dpi: 0,
    render: 0,
    active: '1',
    clothesCategory: 0,
    clothesBrowseCategory: 1,
    clothesId: 0,
    clothesEnabled: false,
    clothesList: [],
    imageReady: false,
    updating: false
  },

  onLoad() {
    this.unloaded = false;
    this.getOpenerEventChannel().on('photoEditData', (data) => {
      this.setData({
        imageData: data,
        photoName: data.name,
        dpi: data.dpi,
        imageReady: !!data.previewUrl
      });
      if (data.category == 1 && data.itemId == 759) {
        this.setData({
          kb: 30
        });
      }
      wx.setNavigationBarTitle({
        title: data.name
      });
    });

    //进入编辑页时先读取智能证件照的高清下载方式
    this.getDownloadSet();
    this.getClothesList(1);
  },

  onUnload() {
    this.unloaded = true;

    if (this.downloadDrawerTimer) {
      clearTimeout(this.downloadDrawerTimer);
    }

    //退出页面时销毁激励视频监听
    if (this.rewardedAd) {
      this.rewardedAd.destroy();
    }
  },

  getDownloadSet() {
    //智能证件照固定使用应用ID 3读取下载配置
    return request({
      url: app.url + 'order/getDownloadSet?appId=3',
      header: {
        token: getToken()
      },
      method: 'POST'
    }).then((res) => {
      if (res.code !== 200) {
        return;
      }

      const downloadMode = res.data.status;
      this.setData({
        downloadMode,
        downloadPrice: res.data.downloadPrice,
        videoUnitId: res.data.videoUnitId
      });

      if (this.rewardedAd) {
        this.rewardedAd.destroy();
      }
      this.rewardedAd = null;

      //只有看广告下载和广告、付费任选时才需要创建激励视频
      if (downloadMode !== 2 && downloadMode !== 4) {
        return;
      }

      this.rewardedAd = createRewardedAd({
        adUnitId: res.data.videoUnitId,
        onReward: () => {
          if (!this.unloaded) {
            this.downloadHDPhoto(1);
          }
        },
        onErrorReward: true
      });
    }).catch(() => {});
  },

  getClothesList(category) {
    return request({
      url: app.url + 'api/getClothesList?category=' + category,
      method: 'POST'
    }).then((res) => {
      if (res.code !== 200) {
        this.setData({
          clothesEnabled: false,
          clothesList: []
        });
        return;
      }

      this.setData({
        clothesEnabled: true,
        clothesList: res.data
      });
    }).catch(() => {});
  },

  toggleBg(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      color,
      colorType: 2
    });

    //微信支付成功或已经解锁时使用高清编辑源，否则只修改免费预览照
    this.updateColor(color, this.data.downloadState > 1 ? 2 : 1).catch(() => {});
  },

  toPick() {
    this.setData({
      pick: true
    });
  },

  pickColor(e) {
    const color = this.rgbStringToHex(e.detail.color);
    this.setData({
      color,
      colorType: 2,
      pick: false
    });

    //微信支付成功或已经解锁时使用高清编辑源，否则只修改免费预览照
    this.updateColor(color, this.data.downloadState > 1 ? 2 : 1).catch(() => {});
  },

  updateColor(color, type) {
    //当上一次换背景还没有结束时，不重复发起请求
    if (this.data.updating) {
      wx.showToast({
        title: '正在制作，请稍候',
        icon: 'none'
      });
      return Promise.reject(new Error('背景制作中'));
    }
    const requestData = {
      photoId: this.data.imageData.photoId,
      colors: color,
      kb: this.data.kb,
      render: this.data.render,
      dpi: this.data.dpi,
      //未解锁时使用预览图，解锁或支付确认期间使用高清图
      hd: type == 2 ? 1 : 0
    };

    wx.showLoading({
      title: '制作中...'
    });
    this.setData({
      updating: true
    });

    return request({
      url: app.url + 'api/updateIdPhoto',
      data: requestData,
      header: {
        token: getToken()
      },
      method: 'POST'
    }).then((res) => {
      if (res.code == 200) {
        if (this.unloaded) {
          return res.data;
        }

        this.setData({
          imageData: res.data
        });
        return res.data;
      }

      if (res.code == 404) {
        wx.showToast({
          title: res.data,
          icon: 'none'
        });
      }

      throw new Error(res.data || '制作失败');
    }).finally(() => {
      if (!this.unloaded) {
        this.setData({
          updating: false
        });
      }
      wx.hideLoading();
    });
  },

  selectClothesCategory(e) {
    const category = Number(e.currentTarget.dataset.category);
    this.setData({
      clothesBrowseCategory: category,
      clothesList: []
    });
    this.getClothesList(category);
  },

  selectClothes(e) {
    const category = Number(e.currentTarget.dataset.category);
    const clothesId = Number(e.currentTarget.dataset.id);
    this.updateClothes(category, clothesId).catch(() => {});
  },

  cancelClothes() {
    //当前没有服装时，不重复请求取消换装
    if (this.data.clothesCategory === 0) {
      return;
    }
    this.updateClothes(0, 0).catch(() => {});
  },

  updateClothes(category, clothesId) {
    const cancelClothes = category === 0 && clothesId === 0;
    const selectClothes = this.data.clothesList.some((item) => item.category === category && item.clothesId === clothesId);
    if (!cancelClothes && !selectClothes) {
      wx.showToast({
        title: '服装参数无效',
        icon: 'none'
      });
      return Promise.reject(new Error('服装参数无效'));
    }

    //上一次背景或服装制作尚未完成时，不重复发起请求
    if (this.data.updating) {
      wx.showToast({
        title: '正在制作，请稍候',
        icon: 'none'
      });
      return Promise.reject(new Error('换装制作中'));
    }

    wx.showLoading({
      title: '制作中...'
    });
    this.setData({
      updating: true
    });

    return request({
      url: app.url + 'api/changeClothes',
      data: {
        photoId: this.data.imageData.photoId,
        clothesCategory: category,
        clothesId,
        kb: this.data.kb,
        dpi: this.data.dpi,
        hd: this.data.downloadState > 1 ? 1 : 0
      },
      header: {
        token: getToken()
      },
      method: 'POST'
    }).then((res) => {
      //换装成功后，刷新当前照片和服装选择状态
      if (res.code == 200) {
        //页面已经退出时，只返回结果，不再更新页面数据
        if (this.unloaded) {
          return res.data;
        }

        const nextData = {
          imageData: res.data,
          clothesId,
          clothesCategory: category
        };
        //未选择背景就换装时，后端会把白色背景作为当前正式选择保存
        if (category !== 0 && this.data.colorType === 1) {
          nextData.color = '#ffffff';
          nextData.bgc = '#ffffff';
          nextData.colorType = 2;
        }
        this.setData(nextData);
        return res.data;
      }

      //后端返回业务错误时，在页面上显示具体原因
      if (res.code == 404) {
        wx.showToast({
          title: res.data,
          icon: 'none'
        });
      }
      throw new Error(res.data || '换装失败');
    }).finally(() => {
      //页面仍然存在时，恢复背景和服装操作按钮
      if (!this.unloaded) {
        this.setData({
          updating: false
        });
      }
      wx.hideLoading();
    });
  },

  async openSavePhoto(e) {
    const type = Number(e.currentTarget.dataset.type);
    if (this.data.colorType == 1) {
      wx.showToast({
        title: '您还没有选择背景颜色哦~',
        icon: 'none',
        duration: 3000
      });
      return;
    }

    //预览照始终免费保存，不受高清照下载模式影响
    if (type == 1) {
      this.saveNormalPhoto();
      return;
    }

    //微信支付返回成功，等待后端支付回调成功时，根据照片ID继续复查支付结果
    if (this.data.downloadState === 2) {
      this.downloadHDPhoto();
      return;
    }

    //首次读取失败时，用户点击保存会再读取一次下载配置
    if (this.data.downloadMode === null) {
      await this.getDownloadSet();
    }

    if (this.data.downloadMode === null) {
      wx.showToast({
        title: '下载配置读取失败，请重试',
        icon: 'none'
      });
      return;
    }

    const downloadMode = this.data.downloadMode;
    //已经永久解锁的照片不受后台后来关闭功能影响
    if (downloadMode === 0 && this.data.downloadState !== 3) {
      wx.showToast({
        title: '当前功能维护中，请稍后再试',
        icon: 'none'
      });
      return;
    }

    if (this.data.downloadState === 3) {
      try {
        await this.prepareHDPhoto();
      } catch (err) {
        return;
      }
      this.downloadHDPhoto();
      return;
    }

    this.openDownloadDrawer();
  },

  getDownloadOptions() {
    const downloadMode = this.data.downloadMode;
    if (downloadMode === 1) {
      return [{method: 1, name: '免费下载', price: ''}];
    }
    if (downloadMode === 2) {
      return [{method: 2, name: '看广告下载', price: ''}];
    }
    const paidOption = {method: 3, name: '付费下载', price: '¥' + this.data.downloadPrice.toFixed(2)};
    if (downloadMode === 3) {
      return [paidOption];
    }
    if (downloadMode === 4) {
      return [{method: 2, name: '看广告下载', price: ''}, paidOption];
    }
    return [];
  },

  openDownloadDrawer() {
    const downloadOptions = this.getDownloadOptions();
    const backgroundNames = {
      '#FFFFFF': '白色背景',
      '#438EDB': '蓝色背景',
      '#FF0000': '红色背景',
      '#66B5F2': '浅蓝背景',
      '#07C160': '绿色背景',
      '#FFC300': '黄色背景'
    };
    const renderNames = ['纯色效果', '上下渐变', '中心渐变'];
    const clothesNames = ['原服装', '男装', '女装'];
    const backgroundName = backgroundNames[this.data.color.toUpperCase()] || '自定义背景';
    this.setData({
      downloadDrawerVisible: true,
      downloadDrawerClosing: false,
      downloadOptions,
      downloadPhotoMeta: backgroundName + ' · ' + renderNames[this.data.render] + ' · ' + clothesNames[this.data.clothesCategory],
      selectedDownloadMethod: downloadOptions[0].method
    });
  },

  closeDownloadDrawer(afterClose) {
    if (!this.data.downloadDrawerVisible || this.data.downloadDrawerClosing) {
      return;
    }

    this.setData({
      downloadDrawerClosing: true
    });

    this.downloadDrawerTimer = setTimeout(() => {
      if (this.unloaded) {
        return;
      }

      this.setData({
        downloadDrawerVisible: false,
        downloadDrawerClosing: false
      });
      if (typeof afterClose === 'function') {
        afterClose();
      }
    }, 240);
  },

  selectDownloadMethod(e) {
    this.setData({
      selectedDownloadMethod: Number(e.currentTarget.dataset.method)
    });
  },

  confirmDownloadMethod() {
    const downloadMethod = this.data.selectedDownloadMethod;
    this.closeDownloadDrawer(() => {
      this.executeDownloadMethod(downloadMethod);
    });
  },

  async executeDownloadMethod(downloadMethod) {
    //ID3确定下载方式后再生成高清编辑源
    try {
      await this.prepareHDPhoto();
    } catch (err) {
      return;
    }

    if (downloadMethod === 1) {
      this.downloadHDPhoto();
      return;
    }
    if (downloadMethod === 2) {
      this.watchAdDownload();
      return;
    }
    if (downloadMethod === 3) {
      this.createOrder();
    }
  },

  noop() {},

  async saveParams() {
    let kb = parseInt(this.data.kb, 10);
    let dpi = parseInt(this.data.dpi, 10);

    if (isNaN(kb) || kb < 0) {
      kb = 0;
    }
    if (isNaN(dpi) || dpi < 72) {
      dpi = 72;
    }

    this.setData({
      kb,
      dpi,
      colorType: 2
    });

    try {
      await this.updateColor(this.data.color, this.data.downloadState > 1 ? 2 : 1);
      wx.showToast({
        title: '修改成功',
        icon: 'none',
        duration: 1500
      });
    } catch (err) {}
  },

  async saveNormalPhoto() {
    //支付结果确认期间不切回预览编辑源，避免覆盖等待解锁的高清成片
    if (this.data.downloadState === 2) {
      wx.showToast({
        title: '支付结果确认中，请稍后重试',
        icon: 'none'
      });
      return;
    }

    try {
      await this.updateColor(this.data.color, 1);
    } catch (err) {
      return;
    }

    //普通预览保存只记录预览照作品，不会解锁高清下载权
    request({
      url: app.url + 'api/updateUserPhonto?photoId=' + this.data.imageData.photoId,
      header: {
        token: getToken()
      },
      method: 'POST',
      loadingText: '下载中...'
    }).then((res) => {
      if (res.code == 200) {
        this.setData({
          picUrl: res.data.picUrl
        });
        saveImageFromUrl(res.data.picUrl)
          .then(() => {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            });
          })
          .catch(() => {});
      } else if (res.code == 404) {
        wx.showToast({
          title: res.data,
          icon: 'none'
        });
      }
    }).catch(() => {});
  },

  async prepareHDPhoto() {
    //先创建高清照片，再按当前背景颜色和用户填写的DPI生成高清成片
    const res = await request({
      url: app.url + 'api/createIdHdPhoto?photoId=' + this.data.imageData.photoId,
      header: {
        token: getToken()
      },
      method: 'POST',
      loadingText: '制作中...'
    });

    if (res.code == 200) {
      if (this.unloaded) {
        return;
      }

      this.setData({
        'imageData.photoId': res.data
      });
      await this.updateColor(this.data.color, 2);
      return;
    }

    if (res.code == 404) {
      wx.showToast({
        title: res.data,
        icon: 'none'
      });
    }
    throw new Error(res.data || '高清照制作失败');
  },

  watchAdDownload() {
    //广告加载或播放失败时由激励视频工具直接放行，主动提前关闭不会放行
    if (this.rewardedAd) {
      this.rewardedAd.show();
    } else {
      this.downloadHDPhoto(1);
    }
  },

  createOrder() {
    //每次新的付款操作都创建新订单，取消或失败的旧订单继续保留待支付状态
    request({
      url: app.url + 'order/createOrder?photoId=' + this.data.imageData.photoId,
      header: {
        token: getToken()
      },
      method: 'POST',
      loadingText: '创建订单中...'
    }).then((res) => {
      if (res.code != 200) {
        if (res.code == 404) {
          wx.showToast({
            title: res.data,
            icon: 'none'
          });
        }
        return;
      }

      const order = res.data;
      wx.requestPayment({
        timeStamp: order.timeStamp,
        nonceStr: order.nonceStr,
        package: order.packageVal,
        signType: order.signType,
        paySign: order.paySign,
        success: (payRes) => {
          //微信支付返回成功后等待后端支付回调成功，再由下载接口解锁照片
          if (payRes.errMsg === 'requestPayment:ok') {
            this.setData({
              downloadState: 2
            });
            this.downloadHDPhoto();
          }
        },
        fail: (err) => {
          this.setData({
            downloadState: 1
          });
          wx.showToast({
            title: err.errMsg.indexOf('cancel') !== -1 ? '已取消支付' : '支付失败，请重试',
            icon: 'none'
          });
        }
      });
    }).catch(() => {});
  },

  downloadHDPhoto(rewarded = 0) {
    //所有下载都明确传入广告完成状态，0未看广告，1已看完广告
    const url = app.url + 'order/downloadPhoto?photoId=' + this.data.imageData.photoId + '&rewarded=' + rewarded;

    request({
      url,
      header: {
        token: getToken()
      },
      method: 'POST',
      loadingText: '下载中...'
    }).then((res) => {
      if (res.code == 200) {
        //后端发放原图后标记当前照片已永久解锁，后续换背景和保存不再收费
        this.setData({
          picUrl: res.data.picUrl,
          downloadState: 3
        });
        saveImageFromUrl(res.data.picUrl).catch(() => {});
      } else if (res.code == 404) {
        //支付回调延迟时保留确认状态，下次点击继续根据照片ID复查
        wx.showToast({
          title: this.data.downloadState === 2 ? '支付结果确认中，请稍后重试' : res.data,
          icon: 'none'
        });
      }
    }).catch(() => {});
  },

  rgbStringToHex(rgbString) {
    const rgbValues = rgbString.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) {
      return this.data.color;
    }

    const r = parseInt(rgbValues[0], 10);
    const g = parseInt(rgbValues[1], 10);
    const b = parseInt(rgbValues[2], 10);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  },

  onKbInput(event) {
    let value = parseInt(event.detail.value, 10);
    if (isNaN(value) || value < 0) {
      wx.showToast({
        title: '最小只能0哦~',
        icon: 'none',
        duration: 1500
      });
      value = 0;
    } else if (value > 1000) {
      wx.showToast({
        title: '最大只能1000哦~',
        icon: 'none',
        duration: 1500
      });
      value = 1000;
    }

    this.setData({
      kb: value
    });
  },

  onDpiInput(event) {
    let value = parseInt(event.detail.value, 10);
    if (isNaN(value) || value < 72) {
      wx.showToast({
        title: '最小只能72哦~',
        icon: 'none',
        duration: 1500
      });
      value = 72;
    } else if (value > 1000) {
      wx.showToast({
        title: '最大只能1000哦~',
        icon: 'none',
        duration: 1500
      });
      value = 1000;
    }

    this.setData({
      dpi: value
    });
  },

  onRenderChange(event) {
    const value = parseInt(event.detail.value, 10);
    this.setData({
      render: value
    });
  },

  clickTab(event) {
    const { name } = event.detail;
    this.setData({
      active: name
    });
  }
});
