function compareVersion(v1, v2) {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  const length = Math.max(a.length, b.length);

  for (let i = 0; i < length; i += 1) {
    const n1 = a[i] || 0;
    const n2 = b[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }

  return 0;
}

function canUseDisableFallbackSharePage() {
  const info = wx.getAppBaseInfo();
  return compareVersion(info.SDKVersion || '0.0.0', '3.7.7') >= 0;
}

export function createRewardedAd(options) {
  const { adUnitId, onReward, onErrorReward = true } = options;
  let pendingReward = false;
  let rewardedVideoAd;

  if (!adUnitId || !wx.createRewardedVideoAd) {
    return null;
  }

  try {
    rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId,
      multiton: true,
      ...(canUseDisableFallbackSharePage() ? { disableFallbackSharePage: true } : {})
    });
  } catch (err) {
    console.error('激励视频广告创建失败', err);
    return null;
  }

  function grantReward() {
    if (!pendingReward) {
      return;
    }
    pendingReward = false;
    onReward && onReward();
  }

  rewardedVideoAd.offLoad && rewardedVideoAd.offLoad();
  rewardedVideoAd.offError && rewardedVideoAd.offError();
  rewardedVideoAd.offClose && rewardedVideoAd.offClose();

  rewardedVideoAd.onError((err) => {
    console.error('激励视频广告加载失败', err);
    if (!pendingReward) {
      return;
    }
    if (onErrorReward) {
      grantReward();
      return;
    }
    pendingReward = false;
    wx.showToast({
      title: '广告加载失败，请稍后重试',
      icon: 'none'
    });
  });

  rewardedVideoAd.onClose((res) => {
    if (!pendingReward) {
      return;
    }
    if (res && res.isEnded) {
      grantReward();
      return;
    }

    pendingReward = false;
    wx.showToast({
      title: '需要看完广告才能继续哦~',
      icon: 'none',
      duration: 1500
    });
  });

  return {
    show() {
      pendingReward = true;
      return Promise.resolve()
        .then(() => rewardedVideoAd.show())
        .catch(() => {
          if (!pendingReward) {
            return;
          }
          return Promise.resolve()
            .then(() => rewardedVideoAd.load())
            .then(() => {
              if (!pendingReward) {
                return;
              }
              return rewardedVideoAd.show();
            })
            .catch((err) => {
              if (!pendingReward) {
                return;
              }
              console.error('激励视频广告播放失败', err);
              if (onErrorReward) {
                grantReward();
                return;
              }
              pendingReward = false;
              wx.showToast({
                title: '广告暂不可用，请稍后重试',
                icon: 'none'
              });
            });
          });
    },
    destroy() {
      rewardedVideoAd.offLoad && rewardedVideoAd.offLoad();
      rewardedVideoAd.offError && rewardedVideoAd.offError();
      rewardedVideoAd.offClose && rewardedVideoAd.offClose();
    }
  };
}
