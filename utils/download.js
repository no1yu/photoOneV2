let savingImage = false;

export function saveImageFromUrl(url) {
  if (!url) {
    wx.showToast({
      title: '图片地址无效',
      icon: 'none'
    });
    return Promise.reject(new Error('empty image url'));
  }

  if (savingImage) {
    return Promise.reject(new Error('image saving'));
  }

  savingImage = true;
  wx.showLoading({
    title: '下载中...'
  });

  return downloadImage(url)
    .then((filePath) => {
      wx.hideLoading();
      return saveTempImage(filePath);
    })
    .finally(() => {
      savingImage = false;
      wx.hideLoading();
    });
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error('download failed'));
          return;
        }
        resolve(res.tempFilePath);
      },
      fail: reject
    });
  }).catch((err) => {
    wx.showToast({
      title: '下载图片失败，请重试',
      icon: 'none',
      duration: 2000
    });
    throw err;
  });
}

function saveTempImage(filePath) {
  return saveToAlbum(filePath)
    .catch((err) => {
      if (!isPermissionError(err) || isCancelError(err)) {
        throw err;
      }

      return requestAlbumPermission()
        .then(() => saveToAlbum(filePath))
        .catch((permissionErr) => {
          throw permissionErr;
        });
    });
}

function saveToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        });
        resolve(filePath);
      },
      fail: reject
    });
  });
}

function requestAlbumPermission() {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success: (settingRes) => {
        const albumAuth = settingRes.authSetting['scope.writePhotosAlbum'];

        if (albumAuth === true) {
          reject(new Error('album save failed'));
          return;
        }

        if (albumAuth === undefined) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: resolve,
            fail: () => openAlbumSetting(resolve, reject)
          });
          return;
        }

        openAlbumSetting(resolve, reject);
      },
      fail: reject
    });
  });
}

function openAlbumSetting(resolve, reject) {
  wx.showModal({
    title: '提示',
    content: '保存图片需要相册权限',
    confirmText: '去设置',
    success: (modalRes) => {
      if (!modalRes.confirm) {
        reject(new Error('album permission canceled'));
        return;
      }

      wx.openSetting({
        success: (settingRes) => {
          if (settingRes.authSetting['scope.writePhotosAlbum']) {
            resolve();
            return;
          }
          reject(new Error('album permission denied'));
        },
        fail: reject
      });
    },
    fail: reject
  });
}

function isPermissionError(err = {}) {
  const message = err.errMsg || err.message || '';
  return /auth|authorize|permission|denied|scope\.writePhotosAlbum/i.test(message);
}

function isCancelError(err = {}) {
  const message = err.errMsg || err.message || '';
  return /cancel|canceled/i.test(message);
}
