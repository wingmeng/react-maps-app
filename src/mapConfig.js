export default {
  center: {lat: 39.906931, lng: 116.39756},  // 初始化中心点（北京天安门国旗台）
  zoomLv: 16,  // 初始化缩放级别
  key: 'AIzaSyCU5WMfYm4M3VDqaMtCCAdhF-6me9dVS7I',
	_url: [
    {
      tag: 'GMap_i18n',
      url: 'https://maps.googleapis.com/maps/api/js?&key={{key}}'
    },
		{
      tag: 'GMap_cn',
      url: 'http://maps.google.cn/maps/api/js?&key={{key}}'
    }
  ],
  get url() {
    return this._url.map((item) => {
      item.url = item.url.replace('{{key}}', this.key);
      return item;
    })
  }
}
