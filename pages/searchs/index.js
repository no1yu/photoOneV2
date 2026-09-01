import { debounce } from '../../utils/timing';
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
    value: '', 
    photoSizeList: [],
    current: 1,
    size: 10,
    pages: 0,
    scrollTop: 0,
    loading: false,
    hasMore: true,
    showBackTop: false
  },

  onChange(e) {
    const keyword = getInputValue(e);
    this.setData({
      value: keyword
    });
    this.searchByKeyword(keyword);
  },

  searchByKeyword: debounce(function (keyword) {
    if (keyword) {
      this.setData({
        current: 1,
        photoSizeList: [],
        pages: 0,
        hasMore: true,
        loading: false
      });
      this.searchData();
    } else {
      this.setData({
        photoSizeList: [],
        pages: 0,
        hasMore: true,
        loading: false
      });
    }
  }, 500),

  searchData() {
    if (!this.data.value) {
      wx.stopPullDownRefresh();
      return;
    }
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    request({
      url: app.url + 'item/itemList',
      data: {
        pageNum: this.data.current,
        pageSize: this.data.size,
        type: 0,
        name: this.data.value || '', 
      },
      method: 'GET'
    }).then((res) => {
      if (res.code == 200) {
        const { records = [], pages = 0 } = res.data;
        const current = this.data.current;
          
        const newList = [...this.data.photoSizeList, ...records];
        const hasMore = current < pages;
          
        this.setData({
          photoSizeList: newList,
          pages,
          current: current + 1,
          hasMore
        });

        if (records.length == 0 && current == 1) {
          wx.showToast({
            title: '没有找到相关尺寸~',
            icon: 'none'
          });
        }
      }
    }).finally(() => {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    });
  },

  moredata() {
    if (this.data.hasMore) {
      this.searchData();
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
      url: '/pages/preEdit/index?category=1&data=' + encodeURIComponent(JSON.stringify(this.data.photoSizeList[e.currentTarget.dataset.index])),
    });
  },

  scrollToTop() {
    this.setData({
      scrollTop: 0,
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



  onPullDownRefresh() {
    this.setData({
      photoSizeList: [],
      current: 1,
      pages: 0,
      scrollTop: 0,
      hasMore: true,
      loading: false
    });
    this.searchData();
  },

  onReachBottom() {
    this.moredata();
  }

});
