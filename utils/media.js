const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

export function getFileExtension(filePath = '') {
  const ext = filePath.split('?')[0].split('.').pop();
  return ext ? ext.toLowerCase() : '';
}

export function validateImageFile(file, maxSizeMB) {
  const ext = getFileExtension(file.tempFilePath);
  const fileSizeMB = file.size / (1024 * 1024);

  if (!IMAGE_EXTENSIONS.includes(ext)) {
    wx.showToast({
      title: '图片格式仅支持png、jpg、jpeg',
      icon: 'none',
      duration: 2000
    });
    return false;
  }

  if (fileSizeMB > maxSizeMB) {
    wx.showToast({
      title: `图片大小不能超过${maxSizeMB}MB`,
      icon: 'none',
      duration: 2000
    });
    return false;
  }

  return true;
}

export function chooseAlbumImage(maxSizeMB = 15) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['original'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file || !validateImageFile(file, maxSizeMB)) {
          reject(new Error('invalid image'));
          return;
        }
        resolve(file);
      },
      fail: reject
    });
  });
}

export function getLocalFileSize(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileInfo({
      filePath,
      success: (res) => resolve(res.size),
      fail: reject
    });
  });
}
