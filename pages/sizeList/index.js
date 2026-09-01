import { goLogin, getToken, hasToken } from '../../utils/auth';
import { request } from '../../utils/request';

const app = getApp();

Page({
  data: {
    active: '1',
    category: "1",
    photoSizeList: [],
    pageNum: 1,
    pageSize: 10,
    hasMoreData: true,
    scrollTop: 0,
    pages: 0,
    showBackTop: false,
    loadingMore: false
  },

  beforeTabChange(e) {
    const detail = e.detail || {};
    if (detail.name == 5) {
      detail.callback(false);
      wx.navigateTo({
        url: '/pages/searchs/index',
      });
      return;
    }
    detail.callback(true);
  },

  clickTab(e) {
    if (e.detail.name == 5) {
      this.setData({
        active: this.data.category
      });
      wx.navigateTo({
        url: '/pages/searchs/index',
      });
      return;
    }

    this.setData({
      photoSizeList: [],
      active: e.detail.name,
      category: e.detail.name,
      pageNum: 1,
      hasMoreData: true,
      pages: 0,
      loadingMore: false
    });
    if (this.data.category == 4 && !hasToken()) {
      goLogin();
    } else {
      this.getSizeList();
    }
  },

  getSizeList() {
    if (!this.data.hasMoreData || this.data.loadingMore) return;
    this.setData({
      loadingMore: true
    });
    request({
      url: app.url + 'item/itemList',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        type: this.data.category,
      },
      header: { token: getToken() },
      method: 'GET'
    }).then((res) => {
      if (res.code == 200) {
        const { records = [], pages = 0 } = res.data;
        this.setData({
          photoSizeList: this.data.photoSizeList.concat(records),
          pageNum: this.data.pageNum + 1,
          hasMoreData: this.data.pageNum < pages,
          pages,
          loadingMore: false
        });
      } else {
        this.setData({
          loadingMore: false
        });
        wx.showToast({
          title: '加载失败~',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(() => {
      this.setData({
        loadingMore: false
      });
    }).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  moredata() {
    if (this.data.hasMoreData) {
      this.getSizeList();
    } else if (this.data.category == 4 && this.data.photoSizeList.length == 0) {
      return;
    } else {
      wx.showToast({
        title: '没有更多尺寸啦~',
        icon: 'none',
        duration: 2000
      });
    }
  },

  goNextPage(e) {
    wx.navigateTo({
      url: '/pages/preEdit/index?category=' + this.data.category + '&data=' + encodeURIComponent(JSON.stringify(this.data.photoSizeList[e.currentTarget.dataset.index])),
    });
  },

  scrollToTop() {
    this.setData({
      scrollTop: 0
    });
  },

  onPageScroll(e) {
    const scrollTop = e && e.detail ? e.detail.scrollTop : (e && e.scrollTop) || 0;

    if (scrollTop > 100 && !this.data.showBackTop) {
      this.setData({
        showBackTop: true
      });
    } else if (scrollTop <= 100 && this.data.showBackTop) {
      this.setData({
        showBackTop: false
      });
    }
  },




  onLoad() {
    this.getSizeList();
  },

  onShow() {
    if (this.data.category == 4 && hasToken() && this.data.photoSizeList.length == 0) {
      this.setData({
        pageNum: 1,
        hasMoreData: true,
        pages: 0,
        loadingMore: false
      });
      this.getSizeList();
    }
  },

  onPullDownRefresh() {
    this.setData({
      photoSizeList: [],
      pageNum: 1,
      hasMoreData: true,
      pages: 0,
      loadingMore: false
    });
    this.getSizeList();
  },

  onReachBottom() {
    this.moredata();
  },
});
