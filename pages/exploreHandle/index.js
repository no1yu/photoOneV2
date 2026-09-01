import { ensureLogin, getToken, hasToken } from '../../utils/auth'
import { saveImageFromUrl } from '../../utils/download'
import { chooseAlbumImage, getFileExtension } from '../../utils/media'
import { createRewardedAd } from '../../utils/rewarded-ad'
import { request, uploadFile } from '../../utils/request'

function cleanDigitInput(value = '') {
  return String(value).replace(/\D/g, '').replace(/^0+(\d)/, '$1')
}

function getInputValue(e) {
  if (!e) return ''

  //当输入组件返回对象时，从对象中读取输入值
  if (e.detail && typeof e.detail === 'object') {
    return e.detail.value || ''
  }

  return e.detail || ''
}

Page({
  data: {
    url: '',
    appId: 0,
    dpi: '',
    kb: '',
    width: '',
    height: '',
    layoutSize: 'six_inch',
    layoutHeight: '',
    layoutWidth: '',
    //排版裁剪线：1绘制，2不绘制
    cropLine: 2,
    //当前探索功能的下载配置和照片下载状态
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
    unavailableMessage: '',
    photoId: '',
    selectedImagePath: '',
    selectedFileFormat: '',
    selectedFileSize: '',
    processing: false,
    resultUrl: '',
    title: '图片处理',
    isMatting: false,
    hasParams: false,
    needsParams: false,
    needsLayoutParams: false,
    needsAmericanParams: false,
    needsTemplateParams: false,
    needsFormatParams: false,
    needsWatermarkParams: false,
    needsCompressParams: false,
    needsCoupleParams: false,
    pick: false,
    color: '#438edb',
    colorPickerInit: 'rgb(67,142,219)',
    templateName: 'template_1',
    targetFormat: 'jpg',
    watermarkText: '',
    watermarkStyle: 'striped',
    watermarkAngle: '30',
    watermarkOpacity: '30',
    watermarkSize: '40',
    watermarkSpace: '120',
    colorOptions: ['#438edb', '#171717', '#ffffff', '#c84f4f', '#d7b56d', '#8b8b1b'],
    coupleColorOptions: [
      { name: '酒红渐变', value: '#5C1117', style: 'background: radial-gradient(circle, #6E171D 0%, #5C1117 55%, #510E15 100%)' },
      { name: '标准红', value: '#D9001B', style: 'background-color: #D9001B' },
      { name: '中国红', value: '#D12C25', style: 'background-color: #D12C25' },
      { name: '鲜红', value: '#FF2121', style: 'background-color: #FF2121' },
      { name: '纯红', value: '#FF0000', style: 'background-color: #FF0000' },
      { name: '朱红', value: '#FF4C00', style: 'background-color: #FF4C00' },
      { name: '胭脂红', value: '#9D2933', style: 'background-color: #9D2933' },
      { name: '柔和红', value: '#ED333D', style: 'background-color: #ED333D' }
    ],
    templateActions: [
      { name: '社交模板一', value: 'template_1' },
      { name: '社交模板二', value: 'template_2' }
    ],
    layoutActions: [
      { name: '六寸', value: 'six_inch' },
      { name: '五寸', value: 'five_inch' },
      { name: 'A4', value: 'a4' },
      { name: '3R', value: 'three_r' },
      { name: '4R', value: 'four_r' },
      { name: '自定义', value: 'custom' }
    ]
  },

  onLoad(options) {
    this.unloaded = false
    const appId = Number(options.appId || 0)
    const title = decodeURIComponent(options.title || '图片处理')
    let url = ''

    //当是证件照排版时，设置排版接口和页面文案
    if (appId === 4) {
      url = 'generateLayoutPhotos'
    //当是老照片上色时，设置上色接口和页面文案
    } else if (appId === 5) {
      url = 'colourize'
    //当是智能抠图时，设置抠图接口和页面文案
    } else if (appId === 6) {
      url = 'matting'
    //当是图片格式转换时，设置格式转换接口
    } else if (appId === 7) {
      url = 'convertImageFormat'
    //当是动漫风照片时，设置动漫风接口和页面文案
    } else if (appId === 8) {
      url = 'cartoon'
    //当是美式证件照时，设置美式证件照接口和页面文案
    } else if (appId === 9) {
      url = 'americanIdPhoto'
    //当是社交媒体模板照时，设置模板照接口和页面文案
    } else if (appId === 10) {
      url = 'generateTemplatePhotos'
    //当是图片加水印时，设置水印接口和页面文案
    } else if (appId === 11) {
      url = 'watermark'
    //当是图片压缩时，设置压缩接口和页面文案
    } else if (appId === 12) {
      url = 'compressImage'
    //当是模糊图片变清晰时，设置清晰修复接口
    } else if (appId === 13) {
      url = 'deblurImage'
    //当是情侣红底照时，设置情侣红底照接口
    } else if (appId === 16) {
      url = 'coupleRedPhoto'
    }

    const defaultColor = appId === 11 ? '#171717' : appId === 16 ? '#5C1117' : '#438edb'

    wx.setNavigationBarTitle({
      title
    })

    this.setData({
      appId,
      url,
      title,
      isMatting: appId === 6,
      hasParams: appId === 4 || appId === 6 || appId === 7 || appId === 9 || appId === 10 || appId === 11 || appId === 12 || appId === 16,
      needsParams: appId === 4 || appId === 6,
      needsLayoutParams: appId === 4,
      needsAmericanParams: appId === 9,
      needsTemplateParams: appId === 10,
      needsFormatParams: appId === 7,
      needsWatermarkParams: appId === 11,
      needsCompressParams: appId === 12,
      needsCoupleParams: appId === 16,
      color: defaultColor,
      colorPickerInit: appId === 11 ? 'rgb(23,23,23)' : 'rgb(67,142,219)'
    })
  },

  onShow() {
    //当页面功能信息完整时，读取当前功能的下载方式
    if (this.data.appId && hasToken()) {
      this.getDownloadSet()
    }
  },

  onUnload() {
    this.unloaded = true

    if (this.downloadDrawerTimer) {
      clearTimeout(this.downloadDrawerTimer)
    }

    //当激励视频已经创建时，销毁视频监听
    if (this.rewardedAd) {
      this.rewardedAd.destroy()
    }
  },

  onDpiInput(e) {
    this.setData({
      dpi: cleanDigitInput(getInputValue(e))
    })
  },

  onKbInput(e) {
    this.setData({
      kb: cleanDigitInput(getInputValue(e))
    })
  },

  onWidthInput(e) {
    this.setData({
      width: cleanDigitInput(getInputValue(e))
    })
  },

  onHeightInput(e) {
    this.setData({
      height: cleanDigitInput(getInputValue(e))
    })
  },

  onLayoutHeightInput(e) {
    this.setData({
      layoutHeight: cleanDigitInput(getInputValue(e))
    })
  },

  onLayoutWidthInput(e) {
    this.setData({
      layoutWidth: cleanDigitInput(getInputValue(e))
    })
  },

  onWatermarkTextInput(e) {
    this.setData({
      watermarkText: getInputValue(e).slice(0, 30)
    })
  },

  onWatermarkAngleInput(e) {
    this.setData({
      watermarkAngle: cleanDigitInput(getInputValue(e))
    })
  },

  onWatermarkOpacityInput(e) {
    this.setData({
      watermarkOpacity: cleanDigitInput(getInputValue(e))
    })
  },

  onWatermarkSizeInput(e) {
    this.setData({
      watermarkSize: cleanDigitInput(getInputValue(e))
    })
  },

  onWatermarkSpaceInput(e) {
    this.setData({
      watermarkSpace: cleanDigitInput(getInputValue(e))
    })
  },

  selectWatermarkStyle(e) {
    //当图片正在制作时，不允许修改水印样式
    if (this.data.processing) {
      return
    }

    this.setData({
      watermarkStyle: e.currentTarget.dataset.value
    })
  },

  onTemplateSelect(e) {
    const item = e.currentTarget ? e.currentTarget.dataset : {}
    this.setData({
      templateName: item.value || 'template_1'
    })
  },

  selectTargetFormat(e) {
    //当图片正在制作时，不允许修改目标格式
    if (this.data.processing) {
      return
    }

    this.setData({
      targetFormat: e.currentTarget.dataset.value
    })
  },

  selectLayoutSize(e) {
    //当图片正在制作时，不允许修改排版画布
    if (this.data.processing) {
      return
    }

    const layoutSize = e.currentTarget.dataset.value
    const layoutData = {
      layoutSize
    }

    //当用户切换到预设画布时，清空自定义画布尺寸
    if (layoutSize !== 'custom') {
      layoutData.layoutHeight = ''
      layoutData.layoutWidth = ''
    }

    this.setData(layoutData)
  },

  onCropLineChange(e) {
    this.setData({
      cropLine: e.detail.value ? 1 : 2
    })
  },

  selectColor(e) {
    //当图片正在制作时，不允许修改颜色
    if (this.data.processing) {
      return
    }

    this.setData({
      color: e.currentTarget.dataset.value,
      pick: false
    })
  },

  openColorPicker() {
    //当图片正在制作时，不允许打开颜色选择器
    if (this.data.processing) {
      return
    }

    const color = this.data.color
    const red = parseInt(color.slice(1, 3), 16)
    const green = parseInt(color.slice(3, 5), 16)
    const blue = parseInt(color.slice(5, 7), 16)

    this.setData({
      colorPickerInit: 'rgb(' + red + ',' + green + ',' + blue + ')',
      pick: true
    })
  },

  pickTemplateColor(e) {
    const rgbValues = String(e.detail.color || '').match(/\d+/g)
    const red = parseInt(rgbValues[0], 10)
    const green = parseInt(rgbValues[1], 10)
    const blue = parseInt(rgbValues[2], 10)
    const color = '#' + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)
    const colorOptions = this.data.colorOptions.slice()
    const firstColor = colorOptions[0]
    const sameColorIndex = colorOptions.indexOf(color)

    colorOptions[0] = color

    //当自定义颜色与现有预设颜色相同时，交换两个颜色的位置，避免出现两个选中项
    if (sameColorIndex > 0) {
      colorOptions[sameColorIndex] = firstColor
    }

    this.setData({
      color,
      colorOptions,
      pick: false
    })
  },

  hideTemplateColorPicker() {
    this.setData({
      pick: false
    })
  },

  chooseImage(startAfterChoose) {
    const shouldStart = startAfterChoose === true

    //当图片正在制作或结果已经生成时，不允许重新选择图片
    if (this.data.processing || this.data.resultUrl) {
      return
    }

    //当用户没有登录时，先进入登录页面
    if (!ensureLogin()) {
      return
    }

    chooseAlbumImage(15)
      .then((file) => {
        const fileExtension = getFileExtension(file.tempFilePath).toUpperCase()
        const fileSize = file.size >= 1024 * 1024
          ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
          : Math.max(1, Math.round(file.size / 1024)) + ' KB'

        this.setData({
          selectedImagePath: file.tempFilePath,
          selectedFileFormat: fileExtension === 'JPEG' ? 'JPG' : fileExtension,
          selectedFileSize: fileSize,
          photoId: '',
          resultUrl: ''
        }, () => {
          //当用户从开始制作按钮选择图片时，选图完成后直接开始制作
          if (shouldStart) {
            this.startProcess()
          }
        })
      })
      .catch(() => {})
  },

  validateParams() {
    const width = parseInt(this.data.width, 10)
    const height = parseInt(this.data.height, 10)
    const layoutHeight = parseInt(this.data.layoutHeight, 10)
    const layoutWidth = parseInt(this.data.layoutWidth, 10)
    const dpi = parseInt(this.data.dpi, 10)
    const kb = parseInt(this.data.kb, 10)
    const watermarkAngle = parseInt(this.data.watermarkAngle, 10)
    const watermarkOpacity = parseInt(this.data.watermarkOpacity, 10)
    const watermarkSize = parseInt(this.data.watermarkSize, 10)
    const watermarkSpace = parseInt(this.data.watermarkSpace, 10)

    //当当前功能支持DPI并且DPI低于72时，拒绝制作
    if ((this.data.needsParams || this.data.needsAmericanParams || this.data.needsTemplateParams || this.data.needsCompressParams) && !isNaN(dpi) && dpi < 72) {
      wx.showToast({
        title: 'DPI最低72哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是美式证件照或模板照并且宽度不正确时，拒绝制作
    if ((this.data.needsAmericanParams || this.data.needsTemplateParams) && !isNaN(width) && width <= 0) {
      wx.showToast({
        title: '宽度必须大于0哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是美式证件照或模板照并且高度不正确时，拒绝制作
    if ((this.data.needsAmericanParams || this.data.needsTemplateParams) && !isNaN(height) && height <= 0) {
      wx.showToast({
        title: '高度必须大于0哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是美式证件照或模板照并且文件大小不正确时，拒绝制作
    if ((this.data.needsAmericanParams || this.data.needsTemplateParams) && !isNaN(kb) && kb <= 0) {
      wx.showToast({
        title: 'KB最低1哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是模板照并且颜色格式不正确时，拒绝制作
    if (this.data.needsTemplateParams && !/^#[0-9a-fA-F]{6}$/.test(this.data.color || '')) {
      wx.showToast({
        title: '颜色格式不正确哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是证件照排版并且单张照片宽度不正确时，拒绝制作
    if (this.data.needsLayoutParams && !isNaN(width) && width <= 0) {
      wx.showToast({
        title: '宽度必须大于0哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是证件照排版并且单张照片高度不正确时，拒绝制作
    if (this.data.needsLayoutParams && !isNaN(height) && height <= 0) {
      wx.showToast({
        title: '高度必须大于0哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当证件照排版只填写了单张照片宽度或高度其中一个时，拒绝制作
    if (this.data.needsLayoutParams && ((!isNaN(width) && isNaN(height)) || (isNaN(width) && !isNaN(height)))) {
      wx.showToast({
        title: '宽度和高度必须同时填写哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是证件照排版并且文件大小不正确时，拒绝制作
    if (this.data.needsLayoutParams && !isNaN(kb) && kb <= 0) {
      wx.showToast({
        title: 'KB最低1哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当用户选择自定义画布并且画布宽度不正确时，拒绝制作
    if (this.data.needsLayoutParams && this.data.layoutSize === 'custom' && (isNaN(layoutWidth) || layoutWidth <= 0)) {
      wx.showToast({
        title: '画布宽度必须大于0哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当用户选择自定义画布并且画布高度不正确时，拒绝制作
    if (this.data.needsLayoutParams && this.data.layoutSize === 'custom' && (isNaN(layoutHeight) || layoutHeight <= 0)) {
      wx.showToast({
        title: '画布高度必须大于0哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是图片压缩并且没有填写正确的目标KB时，拒绝制作
    if (this.data.needsCompressParams && (isNaN(kb) || kb < 1)) {
      wx.showToast({
        title: '请输入目标KB',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是图片加水印并且没有填写水印文字时，拒绝制作
    if (this.data.needsWatermarkParams && !(this.data.watermarkText || '').trim()) {
      wx.showToast({
        title: '请输入水印文字',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是图片加水印并且颜色格式不正确时，拒绝制作
    if (this.data.needsWatermarkParams && !/^#[0-9a-fA-F]{6}$/.test(this.data.color || '')) {
      wx.showToast({
        title: '颜色格式不正确哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是图片加水印并且透明度不正确时，拒绝制作
    if (this.data.needsWatermarkParams && (isNaN(watermarkOpacity) || watermarkOpacity < 1 || watermarkOpacity > 80)) {
      wx.showToast({
        title: '透明度范围是1-80',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是图片加水印并且字体大小不正确时，拒绝制作
    if (this.data.needsWatermarkParams && (isNaN(watermarkSize) || watermarkSize < 10 || watermarkSize > 100)) {
      wx.showToast({
        title: '字体大小范围是10-100',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是图片加水印并且旋转角度不正确时，拒绝制作
    if (this.data.needsWatermarkParams && (isNaN(watermarkAngle) || watermarkAngle < 0 || watermarkAngle > 360)) {
      wx.showToast({
        title: '角度范围是0-360',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    //当是斜纹水印并且水印间距不正确时，拒绝制作
    if (this.data.needsWatermarkParams && this.data.watermarkStyle === 'striped' && (isNaN(watermarkSpace) || watermarkSpace < 10 || watermarkSpace > 200)) {
      wx.showToast({
        title: '间距范围是10-200',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      return false
    }

    return true
  },

  startProcess() {
    //当图片正在制作时，拦截重复点击
    if (this.data.processing) {
      return
    }

    //当用户没有登录时，先进入登录页面
    if (!ensureLogin()) {
      return
    }

    //进入页面时配置读取失败，点击制作会再读取一次
    if (this.data.downloadMode === null) {
      this.getDownloadSet().then(() => {
        if (this.data.downloadMode === null) {
          wx.showToast({
            title: '功能配置读取失败，请重试',
            icon: 'none'
          })
          return
        }
        this.startProcess()
      })
      return
    }

    //后台关闭当前功能时不允许继续上传和制作
    if (this.data.unavailableMessage) {
      wx.showToast({
        title: this.data.unavailableMessage,
        icon: 'none'
      })
      return
    }

    //当用户还没有选择图片时，直接打开相册
    if (!this.data.selectedImagePath) {
      this.chooseImage(true)
      return
    }

    //当参数校验没有通过时，停止制作
    if (!this.validateParams()) {
      return
    }

    this.imgUpload()
  },

  imgUpload() {
    //当没有本地图片或图片正在上传时，不重复发起上传
    if (!this.data.selectedImagePath || this.data.processing) {
      return
    }

    this.setData({
      processing: true,
      photoId: '',
      resultUrl: '',
      pick: false
    })

    uploadFile({
      url: getApp().url + 'upload',
      filePath: this.data.selectedImagePath,
      auth: true
    }).then((data) => {
      //当页面已经退出时，不再更新页面状态
      if (this.unloaded) {
        return
      }

      //当图片上传成功时，使用photoId开始制作
      if (data.code == 200) {
        this.setData({
          photoId: data.data
        })
        this.imageDivision(data.data)
        return
      }

      this.setData({
        processing: false,
        photoId: ''
      })

      //当后端返回业务错误时，显示具体原因
      if (data.code == 404) {
        wx.showToast({
          title: data.data,
          icon: 'none'
        })
      }
    }).catch(() => {
      //当页面仍然存在时，结束制作动画
      if (!this.unloaded) {
        this.setData({
          processing: false,
          photoId: ''
        })
      }
    })
  },

  imageDivision(photoId) {
    //当上传接口没有返回photoId时，停止制作
    if (!photoId) {
      this.setData({
        processing: false,
        photoId: ''
      })
      wx.showToast({
        title: '图片处理失败，请重试',
        icon: 'none'
      })
      return
    }

    const requestData = {
      photoId
    }

    //当是图片格式转换时，传递用户选择的目标格式
    if (this.data.needsFormatParams) {
      requestData.targetFormat = this.data.targetFormat
    }

    //当当前功能支持DPI并且用户填写了DPI时，传递DPI
    if (this.data.needsParams && this.data.dpi !== '') {
      requestData.dpi = this.data.dpi
    }

    //当是证件照排版时，传递用户填写的排版参数
    if (this.data.needsLayoutParams) {
      if (this.data.kb !== '') {
        requestData.kb = this.data.kb
      }
      if (this.data.width !== '') {
        requestData.width = this.data.width
      }
      if (this.data.height !== '') {
        requestData.height = this.data.height
      }

      //当用户选择自定义画布时，传递自定义画布尺寸
      if (this.data.layoutSize === 'custom') {
        requestData.layoutHeight = this.data.layoutHeight
        requestData.layoutWidth = this.data.layoutWidth
      //当用户选择预设画布时，传递画布预设名称
      } else {
        requestData.layoutSize = this.data.layoutSize
      }
      requestData.cropLine = this.data.cropLine
    }

    //当是美式证件照时，传递用户填写的照片参数
    if (this.data.needsAmericanParams) {
      requestData.width = this.data.width || '295'
      requestData.height = this.data.height || '413'
      if (this.data.kb !== '') {
        requestData.kb = this.data.kb
      }
      if (this.data.dpi !== '') {
        requestData.dpi = this.data.dpi
      }
    }

    //当是模板照时，传递模板、颜色和照片参数
    if (this.data.needsTemplateParams) {
      requestData.templateName = this.data.templateName
      requestData.width = this.data.width || '295'
      requestData.height = this.data.height || '413'
      requestData.color = this.data.color || '#438edb'
      if (this.data.kb !== '') {
        requestData.kb = this.data.kb
      }
      if (this.data.dpi !== '') {
        requestData.dpi = this.data.dpi
      }
    }

    //当是图片加水印时，传递水印文字和样式参数
    if (this.data.needsWatermarkParams) {
      requestData.watermarkText = this.data.watermarkText.trim()
      requestData.watermarkStyle = this.data.watermarkStyle
      requestData.watermarkAngle = this.data.watermarkAngle
      requestData.watermarkOpacity = this.data.watermarkOpacity
      requestData.watermarkSize = this.data.watermarkSize
      requestData.watermarkSpace = this.data.watermarkSpace
      requestData.color = this.data.color
    }

    //当是图片压缩时，传递目标大小和DPI
    if (this.data.needsCompressParams) {
      requestData.kb = this.data.kb
      if (this.data.dpi !== '') {
        requestData.dpi = this.data.dpi
      }
    }

    //当是情侣红底照时，传递背景颜色
    if (this.data.needsCoupleParams) {
      requestData.color = this.data.color
    }

    request({
      url: getApp().url + 'otherApi/' + this.data.url,
      data: requestData,
      header: {
        token: getToken()
      },
      method: 'POST'
    }).then((res) => {
      //当页面已经退出时，不再读取成片
      if (this.unloaded) {
        return
      }

      //当图片制作成功时，继续读取成片地址
      if (res.code == 200) {
        this.getPhoto(res.data)
        return
      }

      this.setData({
        processing: false,
        photoId: ''
      })

      //当后端返回业务错误时，显示具体原因
      if (res.code == 404) {
        wx.showToast({
          title: res.data,
          icon: 'none',
          duration: 2000
        })
      }
    }).catch(() => {
      //当页面仍然存在时，结束制作动画
      if (!this.unloaded) {
        this.setData({
          processing: false,
          photoId: ''
        })
      }
    })
  },

  getPhoto(photoId) {
    request({
      url: getApp().url + 'otherApi/getExplorePhoto?photoId=' + photoId,
      method: 'POST',
      auth: true
    }).then((res) => {
      //当页面已经退出时，不再显示成片
      if (this.unloaded) {
        return
      }

      //当后端成功返回成片地址时，切换到结果状态
      if (res.code == 200) {
        this.setData({
          photoId: res.data.photoId,
          resultUrl: res.data.picUrl,
          processing: false
        })
        return
      }

      this.setData({
        processing: false,
        photoId: ''
      })

      //当成片不存在时，显示后端返回的原因
      if (res.code == 404) {
        wx.showToast({
          title: res.data,
          icon: 'none'
        })
      }
    }).catch(() => {
      //当页面仍然存在时，结束制作动画
      if (!this.unloaded) {
        this.setData({
          processing: false,
          photoId: ''
        })
      }
    })
  },

  resetPage() {
    const defaultColor = this.data.appId === 11 ? '#171717' : this.data.appId === 16 ? '#5C1117' : '#438edb'

    //返回后清除上一张照片的下载状态，下一张照片重新按下载模式处理
    this.setData({
      dpi: '',
      kb: '',
      width: '',
      height: '',
      layoutSize: 'six_inch',
      layoutHeight: '',
      layoutWidth: '',
      cropLine: 2,
      photoId: '',
      selectedImagePath: '',
      selectedFileFormat: '',
      selectedFileSize: '',
      processing: false,
      resultUrl: '',
      downloadState: 1,
      pick: false,
      color: defaultColor,
      colorPickerInit: this.data.appId === 11 ? 'rgb(23,23,23)' : 'rgb(67,142,219)',
      colorOptions: ['#438edb', '#171717', '#ffffff', '#c84f4f', '#d7b56d', '#8b8b1b'],
      templateName: 'template_1',
      targetFormat: 'jpg',
      watermarkText: '',
      watermarkStyle: 'striped',
      watermarkAngle: '30',
      watermarkOpacity: '30',
      watermarkSize: '40',
      watermarkSpace: '120'
    })

  },

  downloadPic() {
    //微信支付返回成功，等待后端支付回调成功时，根据照片ID继续复查支付结果
    if (this.data.downloadState === 2) {
      this.downloadPhoto()
      return
    }

    //当前照片已经永久解锁时直接保存原图
    if (this.data.downloadState === 3) {
      saveImageFromUrl(this.data.resultUrl).catch(() => {})
      return
    }

    //配置还没有读取完成时不猜测下载方式，提示用户重试
    if (this.data.downloadMode === null) {
      this.getDownloadSet()
      wx.showToast({
        title: '正在读取下载配置，请重试',
        icon: 'none'
      })
      return
    }

    const downloadMode = this.data.downloadMode
    if (downloadMode === 0) {
      wx.showToast({
        title: '当前功能维护中，请稍后再试',
        icon: 'none'
      })
      return
    }

    this.openDownloadDrawer()
  },

  getDownloadOptions() {
    const downloadMode = this.data.downloadMode
    if (downloadMode === 1) {
      return [{method: 1, name: '免费下载', price: ''}]
    }
    if (downloadMode === 2) {
      return [{method: 2, name: '看广告下载', price: ''}]
    }
    const paidOption = {method: 3, name: '付费下载', price: '¥' + this.data.downloadPrice.toFixed(2)}
    if (downloadMode === 3) {
      return [paidOption]
    }
    if (downloadMode === 4) {
      return [{method: 2, name: '看广告下载', price: ''}, paidOption]
    }
    return []
  },

  openDownloadDrawer() {
    const downloadOptions = this.getDownloadOptions()
    this.setData({
      downloadDrawerVisible: true,
      downloadDrawerClosing: false,
      downloadOptions,
      downloadPhotoMeta: this.getDownloadPhotoMeta(),
      selectedDownloadMethod: downloadOptions[0].method
    })
  },

  getDownloadPhotoMeta() {
    const details = []
    const width = this.data.width || '295'
    const height = this.data.height || '413'

    if (this.data.needsLayoutParams) {
      const layout = this.data.layoutActions.find((item) => item.value === this.data.layoutSize)
      details.push(this.data.layoutSize === 'custom' ? this.data.layoutWidth + ' × ' + this.data.layoutHeight + ' px画布' : layout.name + '画布')
      if (this.data.width !== '' && this.data.height !== '') {
        details.push(this.data.width + ' × ' + this.data.height + ' px单张')
      }
      details.push(this.data.cropLine === 1 ? '含裁剪线' : '无裁剪线')
    } else if (this.data.needsFormatParams) {
      details.push('转换为' + this.data.targetFormat.toUpperCase())
    } else if (this.data.needsAmericanParams) {
      details.push(width + ' × ' + height + ' px')
    } else if (this.data.needsTemplateParams) {
      details.push(this.data.templateName === 'template_2' ? '社交模板二' : '社交模板一')
      details.push(width + ' × ' + height + ' px')
    } else if (this.data.needsWatermarkParams) {
      details.push(this.data.watermarkStyle === 'striped' ? '斜纹铺满水印' : '居中水印')
    } else if (this.data.needsCoupleParams) {
      const color = this.data.coupleColorOptions.find((item) => item.value === this.data.color)
      details.push((color ? color.name : '自定义颜色') + '背景')
    }

    return details.join(' · ')
  },

  closeDownloadDrawer(afterClose) {
    if (!this.data.downloadDrawerVisible || this.data.downloadDrawerClosing) {
      return
    }

    this.setData({
      downloadDrawerClosing: true
    })

    this.downloadDrawerTimer = setTimeout(() => {
      if (this.unloaded) {
        return
      }

      this.setData({
        downloadDrawerVisible: false,
        downloadDrawerClosing: false
      })
      if (typeof afterClose === 'function') {
        afterClose()
      }
    }, 240)
  },

  selectDownloadMethod(e) {
    this.setData({
      selectedDownloadMethod: Number(e.currentTarget.dataset.method)
    })
  },

  confirmDownloadMethod() {
    const downloadMethod = this.data.selectedDownloadMethod
    this.closeDownloadDrawer(() => {
      this.executeDownloadMethod(downloadMethod)
    })
  },

  executeDownloadMethod(downloadMethod) {
    if (downloadMethod === 1) {
      this.downloadPhoto()
      return
    }
    if (downloadMethod === 2) {
      this.watchAdDownload()
      return
    }
    if (downloadMethod === 3) {
      this.createOrder()
    }
  },

  noop() {},

  getDownloadSet() {
    //按照当前探索功能ID读取下载模式、金额和激励视频广告位
    return request({
      url: getApp().url + 'order/getDownloadSet?appId=' + this.data.appId,
      header: {
        token: getToken()
      },
      method: 'POST'
    }).then((res) => {
      if (this.unloaded || res.code !== 200) {
        return
      }

      const downloadMode = res.data.status
      this.setData({
        downloadMode,
        downloadPrice: res.data.downloadPrice,
        videoUnitId: res.data.videoUnitId,
        unavailableMessage: downloadMode === 0 ? '当前功能维护中，请稍后再试' : ''
      })

      //重新读取配置后先销毁旧的激励视频监听
      if (this.rewardedAd) {
        this.rewardedAd.destroy()
      }
      this.rewardedAd = null

      //只有看广告下载和广告、付费任选时才需要创建激励视频
      if (downloadMode !== 2 && downloadMode !== 4) {
        return
      }

      this.rewardedAd = createRewardedAd({
        adUnitId: res.data.videoUnitId,
        onReward: () => {
          if (!this.unloaded) {
            this.downloadPhoto(1)
          }
        },
        onErrorReward: true
      })
    }).catch(() => {})
  },

  watchAdDownload() {
    //广告加载或播放失败时由激励视频工具直接放行，主动提前关闭不会放行
    if (this.rewardedAd) {
      this.rewardedAd.show()
    } else {
      this.downloadPhoto(1)
    }
  },

  createOrder() {
    //每次新的付款操作都创建新订单，取消或失败的旧订单继续保留待支付状态
    request({
      url: getApp().url + 'order/createOrder?photoId=' + this.data.photoId,
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
          })
        }
        return
      }

      const order = res.data
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
            })
            this.downloadPhoto()
          }
        },
        fail: (err) => {
          this.setData({
            downloadState: 1
          })
          wx.showToast({
            title: err.errMsg.indexOf('cancel') !== -1 ? '已取消支付' : '支付失败，请重试',
            icon: 'none'
          })
        }
      })
    }).catch(() => {})
  },

  downloadPhoto(rewarded = 0) {
    //所有下载都明确传入广告完成状态，0未看广告，1已看完广告
    const url = getApp().url + 'order/downloadPhoto?photoId=' + this.data.photoId + '&rewarded=' + rewarded

    request({
      url,
      header: {
        token: getToken()
      },
      method: 'POST',
      loadingText: '下载中...'
    }).then((res) => {
      if (res.code == 200) {
        //后端发放原图后标记当前照片已永久解锁，作品页以后也可以直接保存
        this.setData({
          photoId: res.data.photoId,
          resultUrl: res.data.picUrl,
          downloadState: 3
        })
        saveImageFromUrl(res.data.picUrl).catch(() => {})
      } else if (res.code == 404) {
        //支付回调延迟时保留确认状态，下次点击继续根据照片ID复查
        wx.showToast({
          title: this.data.downloadState === 2 ? '支付结果确认中，请稍后重试' : res.data,
          icon: 'none'
        })
      }
    }).catch(() => {})
  }
})
