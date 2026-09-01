import { getToken, goLogin } from './auth';

export function request(options) {
  const {
    url,
    data = {},
    method = 'GET',
    header = {},
    auth = false,
    loadingText = '',
    loginOnInvalid = true
  } = options;

  if (loadingText) {
    wx.showLoading({
      title: loadingText
    });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      data,
      method,
      header: {
        ...(auth ? { token: getToken() } : {}),
        ...header
      },
      success: (res) => {
        if (loginOnInvalid && res.data && res.data.code !== 200 && res.data.code !== 404) {
          goLogin();
        }
        resolve(res.data);
      },
      fail: (err) => {
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        });
        reject(err);
      },
      complete: () => {
        if (loadingText) {
          wx.hideLoading();
        }
      }
    });
  });
}

export function uploadFile(options) {
  const {
    url,
    filePath,
    name = 'file',
    formData = {},
    header = {},
    auth = true,
    loadingText = '',
    loginOnInvalid = true
  } = options;

  if (loadingText) {
    wx.showLoading({
      title: loadingText
    });
  }

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url,
      filePath,
      name,
      formData,
      header: {
        'content-type': 'multipart/form-data',
        ...(auth ? { token: getToken() } : {}),
        ...header
      },
      useHighPerformanceMode: true,
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (loginOnInvalid && data && data.code !== 200 && data.code !== 404) {
            goLogin();
          }
          resolve(data);
        } catch (err) {
          reject(err);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
        reject(err);
      },
      complete: () => {
        if (loadingText) {
          wx.hideLoading();
        }
      }
    });
  });
}
