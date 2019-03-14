import React, { Component } from 'react'
import $script from 'scriptjs'
import axios from 'axios'
import mapAPI from './mapConfig'
import Notify from './notify'
import markerIcon from './icon/marker.png';

class Map extends Component {
  state = {
    isLoaded: false,  // 地图是否加载完成
    map: null,  // 初始化后的地图实例
    markers: []
  }

  // 地图初始化
  initMap() {
    if (window.google && window.google.maps) {
      this.setState(() => ({
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
      }));

      this.props.mapCallback(this.state.map, (points) => {
        this.removeMarkers()
        this.addMarkers(points)
      })
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
      axios.get(urls.GMap_i18n, {timeout: 1000})  // @临时
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

  // 清除所有 markers
  removeMarkers() {
    this.state.markers.forEach(marker => {
      marker.setMap(null)
    })
  }

  // 展示 markers
  addMarkers(points) {
    const map = this.state.map;
    const MapFactory = window.google.maps;
    const closeLastInfoWin = function() {
      if (lastInfoWin) {
        lastInfoWin.close();  // 关闭上一个 infoWindow
      }
    };
    let lastInfoWin = null;
    let lastMarker = null;
    let markers = [];

    // 点击地图空白处关闭 infoWindow
    MapFactory.event.addListener(map, 'click', closeLastInfoWin);

    points.forEach((point, idx, pointArr) => {
      let {lat, lng} = point.location;
      let marker = new MapFactory.Marker({
          position: {lat: Number(lat), lng: Number(lng)},  // 强类型转换，防止参数异常
          icon: markerIcon,  // 自定义图标
          title: point.name,
          zIndex: idx + 1,
          animation: MapFactory.Animation.DROP,  // 下落动画
          map: map
      });

      // 中国地址从大到小
      let address = (point.location.cc.toLowerCase() === 'cn'
        ? point.location.formattedAddress.reverse()
        : point.location.formattedAddress).join(' ');

      let infowindow = new MapFactory.InfoWindow({
        content: `<div class="map-info-window">
            <h4>${point.name}</h4>
            <p><strong>地址:</strong> ${address}</p>
          </div>`
      });

      markers.push(marker);

      (function(marker, infowindow) {
        MapFactory.event.addListener(marker, 'click', function(e) {
          closeLastInfoWin();

          if (lastMarker) {
            lastMarker.setZIndex(lastMarker.getZIndex() - pointArr.length)
          }

          infowindow.open(map, marker);
          lastInfoWin = infowindow;
          map.panTo(marker.getPosition());  // 平移居中
          marker.setZIndex(marker.getZIndex() + pointArr.length)  // 点击置顶
        });
      })(marker, infowindow)
    })

    this.setState({markers})
  }

  // 生命周期：首次渲染之前
  componentWillMount() {
    if (!this.state.isLoaded) {
      this.loadMap(mapAPI.url)
        .catch(() => {
          this.props.globalNotify('地图加载失败')
        });
    }
  }

  // 生命周期：接收到新参数，重新渲染前
  componentWillUpdate() {
    // 疑问：此处为什么无法第一时间获得更新后的 state.markers ？
    // 居然比 componentDidUpdate 慢半拍？
    // console.log('WillUpdate', this.state.markers)
  }

  // 生命周期：重新渲染后
  componentDidUpdate() {
    // console.log('DidUpdate', this.state.markers)
  }

  render() {
    return (
      <div className={this.props.className}>
        {!this.state.isLoaded && (
          <Notify type="loading">地图载入中...</Notify>
        )}
        {this.props.isSearching && (
          <Notify type="loading" theme="darken" position="tc">搜索中...</Notify>
        )}

        {/* 地图已载入 && 未处于搜索状态 && 搜索结果为空 */}
        {this.state.isLoaded
          && !this.props.isSearching
          && this.state.markers.length === 0
          && (
            <Notify type="notice" theme="darken" position="bc">当前区域无搜索结果</Notify>
          )
        }
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
