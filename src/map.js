import React, { Component } from 'react'
import $script from 'scriptjs'
import axios from 'axios'
import mapAPI from './mapConfig'
import Notify from './notify'
import markerIcon from './icon/marker.png';

class Map extends Component {
  MapFactory = null;

  state = {
    isLoaded: false,  // 地图是否加载完成
    map: null,  // 初始化后的地图实例
    markers: [],
    infoWindow: null
  }

  // 地图初始化
  initMap() {
    if (window.google && window.google.maps) {
      this.MapFactory = window.google.maps;

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

      if (this.props.geoLocation) {
        this.geoLocation()  // HTML5 地理定位
      }

      // 点击地图空白处关闭 infoWindow
      this.MapFactory.event.addListener(this.state.map, 'click', () => {
        this.closeInfoWindow()
      })

      this.props.mapCallback(this.state.map, (points) => {
        this.removeMarkers()
        this.buildMarkers(points)
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
  buildMarkers(points) {
    const map = this.state.map;
    const MapFactory = this.MapFactory;
    const closeLastInfoWin = function() {
      // if (lastInfoWin) {
      //   lastInfoWin.close();  // 关闭上一个 infoWindow
      // }
    };
    let lastMarker = null;
    let markers = [];

    points.forEach((point, idx, pointArr) => {
      let {lat, lng} = point.location;

      // 中国地址从大到小
      let address = (point.location.cc.toLowerCase() === 'cn'
        ? point.location.formattedAddress.reverse()
        : point.location.formattedAddress).join(' ');

      let marker = new MapFactory.Marker({
          position: {lat: Number(lat), lng: Number(lng)},  // 强类型转换，防止参数异常
          icon: markerIcon,  // 自定义图标
          data: {
            name: point.name,
            address: address
          },
          zIndex: idx + 1,
          id: point.id,
          animation: MapFactory.Animation.DROP,  // 下落动画
          map: map
      });
      
      (() => {
        MapFactory.event.addListener(marker, 'click', () => {
          this.closeInfoWindow();

          if (lastMarker) {
            lastMarker.setZIndex(lastMarker.getZIndex() - pointArr.length)
          }

          this.buildInfoWindow(marker)
          map.panTo(marker.getPosition())  // 平移居中
          marker.setZIndex(marker.getZIndex() + pointArr.length)  // 点击置顶
          this.props.onMarkerClick(marker.id)
        });
      })(marker)

      markers.push(marker)
    })

    this.setState({markers})
  }

  closeInfoWindow() {
    console.log(this)
    if (this.state.infoWindow) {
      this.state.infoWindow.close()
    }
  }

  buildInfoWindow(marker) {
    let { data } = marker;
    let infoWindow = new this.MapFactory.InfoWindow({
      content: `<div class="map-info-window">
          <h4>${data.name}</h4>
          <p><strong>地址:</strong> ${data.address}</p>
        </div>`
    });

    infoWindow.open(this.state.map, marker)
    this.setState({infoWindow})
  }

  // HTML5 地理定位
  geoLocation() {
    if (navigator.geolocation) {
      let timer = setTimeout(() => {
        this.props.globalNotify('Geolocation 地理定位超时')
      }, 15 * 1e3);

      navigator.geolocation.getCurrentPosition(pos => {
        const position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        clearTimeout(timer)
        this.state.map.setCenter(position)
      })
    } else {
      this.props.globalNotify('您的设备不支持 Geolocation 地理定位')
    }
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
    this.props.getMarkers(this.state.markers)
  }

  render() {
    return (
      <div className={this.props.className}>
        {!this.state.isLoaded && (
          <Notify type="loading">地图载入中...</Notify>
        )}
        {this.props.isSearching && (
          <Notify type="loading" theme="lighten" position="cc">搜索中...</Notify>
        )}

        {/* 地图已载入 && 未处于搜索状态 && 搜索结果为空 */}
        {this.state.isLoaded
          && !this.props.isSearching
          && this.state.markers.length === 0
          && (
            <Notify type="notice" theme="darken" position="bc">当前区域无搜索结果</Notify>
          )
        }
        <div id={this.props.id} role="application" style={
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
