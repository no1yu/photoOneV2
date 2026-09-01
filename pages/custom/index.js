import { ensureLogin, getToken } from '../../utils/auth';
import { confirmModal } from '../../utils/modal';
import { request } from '../../utils/request';

const app = getApp();

function getInputValue(e) {
  if (!e) return '';
  if (e.detail && typeof e.detail === 'object') {
    return e.detail.value || '';
  }
  return e.detail || '';
}

Page({
  data: {
    width: '',
    height: '',
    dpi:'',
    name: '',
    px: '0*0 px',
    size: '0*0 mm',
    widthMm:'',
    heightMm:''
  },

  onLoad() {
    ensureLogin();
  },

  changeName(e) {
    const value = getInputValue(e);
    this.setData({
      name: value
    });
  },
  
  // DPI输入框
  changeDpi(e) {
    let value = getInputValue(e);
    // 移除非数字字符和移除前导0
    value = value.replace(/\D/g, '');
    value = value.replace(/^0+(\d)/, '$1');
    this.setData({
      dpi: value
    }, () => {
      this.updateSize();
    });
  },

  // 宽度输入框
  changeWidth(e) {
    let value = getInputValue(e);
    // 移除非数字字符和移除前导0
    value = value.replace(/\D/g, '');
    value = value.replace(/^0+(\d)/, '$1');
    this.setData({
      width: value
    }, () => {
      this.updateSize();
    });
  },

  // 高度输入框
  changeHeight(e) {
    let value = getInputValue(e);
    // 移除非数字字符和移除前导0
    value = value.replace(/\D/g, '');
    value = value.replace(/^0+(\d)/, '$1');
    this.setData({
      height: value
    }, () => {
      this.updateSize();
    });
  },

  updateSize() {
    const width = parseInt(this.data.width, 10);
    const height = parseInt(this.data.height, 10);
    const dpi = parseInt(this.data.dpi, 10);
    const width_px = isNaN(width) ? 0 : width;
    const height_px = isNaN(height) ? 0 : height;
    const validDpi = !isNaN(dpi) && dpi >= 72 && dpi <= 1000;
    const width_mm = validDpi ? Math.round(width_px / dpi * 25.4) : 0;
    const height_mm = validDpi ? Math.round(height_px / dpi * 25.4) : 0;
    this.setData({
      px: `${width_px}*${height_px} px`,
      size: `${width_mm}*${height_mm} mm`,
      widthMm: width_mm,
      heightMm: height_mm
    });
  },

  addSize() {
    const name = this.data.name.trim();
    const width = parseInt(this.data.width, 10);
    const height = parseInt(this.data.height, 10);
    const dpi = parseInt(this.data.dpi, 10);
    
    if (!name) {
      wx.showToast({
        title: '名称为必填',
        icon: 'none',
        duration: 2000,
        mask: true
      });
      return;
    }

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      wx.showToast({
        title: '宽或高必须大于0',
        icon: 'none',
        duration: 2000,
        mask: true
      });
      return;
    }

    if (isNaN(dpi) || dpi < 72) {
      wx.showToast({
        title: '分辨率最低72',
        icon: 'none',
        duration: 2000,
        mask: true
      });
      return;
    }

    if (dpi > 1000) {
      wx.showToast({
        title: '分辨率最高只能1000',
        icon: 'none',
        duration: 2000,
        mask: true
      });
      return;
    }

    if (!this.isValidName(name)) {
      wx.showToast({
        title: '名称不能包含特殊符号',
        icon: 'none',
        duration: 2000,
        mask: true
      });
      return;
    }

    const custom = {
      name: name,
      widthPx: width,
      heightPx: height,
      widthMm: this.data.widthMm,
      heightMm: this.data.heightMm,
      dpi: dpi
    };

    request({
      url: app.url + 'item/saveCustom',
      method: 'POST',
      data: custom,
      header: {
        token: getToken()
      },
    }).then((res) => {
        if (res.code == 200) {
        
          this.setData({
            name: '',
            width: '',
            height: '',
            dpi:'',
            px: '0*0 px',
            size: '0*0 mm',
            widthMm: '',
            heightMm: ''
          });

          confirmModal({
            title: '定制成功',
            content: '尺寸定制成功，是否立即去制作？',
          })
            .then(() => {
              wx.navigateTo({
                url: '/pages/preEdit/index?category=4&data=' + encodeURIComponent(JSON.stringify({ ...custom, id: res.data })),
              });
            })
            .catch(() => {
              wx.showToast({
                title: '后续可在快速制作里面的我的定制进行查看',
                icon: 'none'
              });
            });
            
        } else if(res.code == 404){
          wx.showToast({
            title: res.data,
            duration: 2000,
            icon: 'none',
            mask: true
          });
        }
      });
  },

  isValidName(name) {
    const reg = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;
    return reg.test(name);
  }
});
