export function getToken() {
  return wx.getStorageSync('token') || '';
}

export function hasToken() {
  return getToken() !== '';
}

export function setToken(token) {
  wx.setStorageSync('token', token);
}

export function goLogin() {
  wx.navigateTo({
    url: '/pages/login/index'
  });
}

export function ensureLogin() {
  if (hasToken()) {
    return true;
  }
  goLogin();
  return false;
}

export function loginByCode(app, options) {
  const { showToast = false, backOnSuccess = false, phoneCode } = options;
  wx.showLoading({
    title: '登录中...'
  });

  return new Promise((resolve, reject) => {
    wx.login({
      success: (loginRes) => {
        const loginData = {
          code: loginRes.code
        };
        if (phoneCode) {
          loginData.phoneCode = phoneCode;
        }
        wx.request({
          url: app.url + 'user/login',
          data: loginData,
          method: 'GET',
          success: (res) => {
            if (res.data.code === 200) {
              setToken(res.data.data);
              if (showToast) {
                wx.showToast({
                  title: '登录成功',
                  duration: 1000
                });
              }
              if (backOnSuccess) {
                const pages = getCurrentPages();
                if (pages && pages.length > 1) {
                  wx.navigateBack({
                    delta: 1
                  });
                } else {
                  wx.switchTab({
                    url: '/pages/home/index'
                  });
                }
              }
              resolve(res.data.data);
              return;
            }

            wx.showToast({
              title: res.data.data,
              duration: 3000,
              icon: 'none'
            });
            reject(res.data);
          },
          fail: (err) => {
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
            reject(err);
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}
