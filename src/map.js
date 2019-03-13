import React, { Component } from 'react'
import $script from 'scriptjs'
import axios from 'axios'
import mapAPI from './mapConfig'

class Map extends Component {
  state = {
    isLoaded: false,  // 地图是否加载成功
    map: null  // 初始化后的地图实例
  }

  // 地图初始化
  initMap() {
    if (window.google && window.google.maps) {
      this.setState(() => {
        return {
          isLoaded: true,
          map: new window.google.maps.Map(document.getElementById(this.props.id), {
            center: mapAPI.center,
            zoom: mapAPI.zoomLv,

            scaleControl: true,  // 比例尺
            clickableIcons: false,  // 禁用 POI 点击

          // greedy     : 当用户在屏幕上滑动（拖动）时，地图一律平移。
          //              换言之，单指滑动和双指滑动都会使地图平移。
          // cooperative: 用户必须单指滑动来滚动页面，双指滑动来平移地图。
          //              如果用户单指滑动地图，地图上会出现一个叠加项，提示用户使用双指来移动地图。
          // none       : 无法对地图执行平移或双指张合操作。
          // auto       : 默认值。根据页面是否可以滚动采用 cooperative 或 greedy 行为。
            gestureHandling: 'greedy'
          })
        }
      });

      this.props.mapCallback(this.state.map);
    }
  }

  // 加载地图
  loadMap(mapUrls) {
    const urls = {};

    for (let {tag, url} of mapUrls) {
      urls[tag] = url;
    }

    return new Promise((resolve, reject) => {
      // 先尝试加载谷歌国际版地图
      axios.get(urls.GMap_i18n, {timeout: 5000})
        .then(() => {
          $script(urls.GMap_i18n, () => {
            this.initMap();
            resolve();
          });
        })

        // 加载超时，尝试加载中国大陆版谷歌地图
        .catch(() => {
          // 中国大陆版的地图不支持跨域请求脚本，故使用 script 引入方式
          // 使用定时器来检测加载超时
          let timer = setTimeout(reject, 5000);

          $script(urls.GMap_cn, () => {
            clearTimeout(timer);
            this.initMap();
            resolve();
          });
        });
    })
  }

  componentWillMount() {
    if (!this.state.isLoaded) {
      this.loadMap(mapAPI.url)
        .catch(() => {
          console.error('地图加载失败')
        });
    }
  }

  render() {
    return (
      <div className={this.props.className}>
        {!this.state.isLoaded && (
          <p className="loading-tip">map is loading...</p>
        )}
        <div id={this.props.id} style={
          {height: this.props.height || '100%'}
        }/>
      </div>
    )
  }
}

/**
 * TODO: 后期实现根据访问IP的归属地自动切换地图
 * 查询 IP，确定归属地
 * url: http://pv.sohu.com/cityjson?ie=utf-8
 * return:
    var returnCitySN = {"cip": "173.244.44.77", "cid": "US", "cname": "UNITED STATES"};
    var returnCitySN = {"cip": "218.16.97.162", "cid": "441900", "cname": "广东省东莞市"};
 *
*/

export default Map;
