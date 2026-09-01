export function confirmModal(options = {}) {
  const {
    title = '提示',
    content = '',
    confirmText = '确定',
    cancelText = '取消'
  } = options;

  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        if (res.confirm) {
          resolve(res);
          return;
        }
        reject(res);
      },
      fail: reject
    });
  });
}
