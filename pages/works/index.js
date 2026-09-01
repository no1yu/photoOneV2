import { ensureLogin, getToken } from '../../utils/auth';
import { saveImageFromUrl } from '../../utils/download';
import { confirmModal } from '../../utils/modal';
import { request } from '../../utils/request';

const app = getApp();

Page({
  data: {
    workList: [],
    pageNum: 1,
    pageSize: 5,
    pages: 0,
    hasMore: true
  },

  onLoad() {
    if (!ensureLogin()) {
      return;
    }
    wx.showToast({
      title: '只有下载过，才会出现在这里哦~',
      icon: 'none',
      duration: 1800
    });
    this.getSizeList();
  },

  // 获取数据
  getSizeList() {
    if (!this.data.hasMore) {
      return;
    }
    request({
      url: app.url + 'item/photoList',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
      },
      header: {
        token: getToken()
      },
      method: 'GET',
      loadingText: '加载中...'
    }).then((res) => {
      if (res.code == 200) {
        const newData = res.data.records || [];
        const pages = res.data.pages;
        this.setData({
          workList: this.data.pageNum == 1 ? newData : this.data.workList.concat(newData),
          pages: pages,
          hasMore: this.data.pageNum < pages
        });
      } else if (res.code == 404) {
        this.setData({
          hasMore: false
        });
      }
    });
  },

  // 删除操作
  remove(e) {
    const itemId = e.target.dataset.id;
    
    confirmModal({
      content: '确定要删除这张吗？',
    }).then(() => {
      request({
        url: app.url + 'item/deletePhotoId',
        data: {
          id: itemId,
        },
        header: {
          token: getToken()
        },
        method: 'GET'
      }).then((res) => {
          if (res.code == 200) {
            // 本地移除页面元素
            const updatedList = this.data.workList.filter(item => item.id != itemId);
            this.setData({
              workList: updatedList
            });
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 2000
            });
   
            if (this.data.workList.length < this.data.pageSize && this.data.pageNum <= this.data.pages) {
              this.getSizeList();
            }
          }
      }).catch(() => {});
    }).catch(() => {
    });
  },

  // 页面上拉触底事件（下滑加载下一页）
  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        pageNum: this.data.pageNum + 1
      });
      this.getSizeList();
    }
  },

  // 根据图片url下载保存
  savePicUrlAndImg(e) {
    saveImageFromUrl(e.currentTarget.dataset.url).catch(() => {});
  },

  //点击图片大屏展开
  preView(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url]
    })
  }
});
