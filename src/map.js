import React, { Component } from 'react'
import $script from 'scriptjs'
import axios from 'axios'
import mapAPI from './mapConfig'

class Map extends Component {
  state = {
    isLoaded: false,  // 地图是否加载成功
    map: null,  // 初始化后的地图实例
    marks: []
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

      this.props.mapCallback(this.state.map, (points) => {
        this.showMarks(points)
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

  showMarks(points) {
    const map = this.state.map;
    let lastInfoWin = null;
    let latlngbounds = new window.google.maps.LatLngBounds();  // 点集合

    points.forEach(function(point) {
      let {lat, lng} = point.location;
      let marker = new window.google.maps.Marker({
          position: {lat: Number(lat), lng: Number(lng)},
          title: point.name,
          map: map
      });

      // var content =
      //     '<div class="map-info-window">' +
      //         '<h4>Coordinate - ' + point.title + '</h4>' +
      //         '<p><b>Lat/Lng:</b> ' + point.pos.lat + ',' + point.pos.lng + '</p>' +
      //         '<p><b>Capacity:</b> 5 MWh</p>' +
      //         '<p><b>ID Code:</b> ' + ((+new Date()).toString(32).toUpperCase()) + '</p>' +
      //     '</div>';

      // var infowindow = new google.maps.InfoWindow({
      //     content: content
      // });            

      // marker.addListener('click', function() {
      //   closeLastInfoWin();
        
      //   infowindow.open(mapObj, marker);
      //   curInfoWin = infowindow;

      //   if (mapObj.getZoom() < 12) {
      //       mapObj.setZoom(12);
      //   }
      //   mapObj.panTo(marker.getPosition());
      // });

    // (function(marker, infowindow) {
    // 	google.maps.event.addListener(marker, 'click', function(e) {
    // 		closeLastInfoWin();
              
    // 		infowindow.open(mapObj, marker);
    // 		curInfoWin = infowindow;

    // 		if (mapObj.getZoom() < 12) {
    // 			mapObj.setZoom(12);
    // 		}
    // 		mapObj.panTo(marker.getPosition());
    // 	});
    // })(marker, infowindow);

      // 将每个坐标点的经纬度都添加到集合对象中
      // latlngbounds.extend(marker.position);
    });

    // Center map and adjust Zoom based on the position of all markers.
    // map.setCenter(latlngbounds.getCenter());
    // map.fitBounds(latlngbounds);
  }

  // 生命周期：首次渲染之前
  componentWillMount() {
    if (!this.state.isLoaded) {
      this.loadMap(mapAPI.url)
        .catch(() => {
          console.error('地图加载失败')
        });
    }
  }

  // 生命周期：接收到新参数，重新渲染前
  // state.marks 的更新并不会触发地图重新渲染
  // 个人猜想应该是 React 没有在视图中找到 marks 的引用，所以忽略了更新
  // componentWillUpdate() {
  //   console.log(this.state.marks)
  // }

  // componentDidUpdate() {
  //   console.log(this.state.marks)
  //   console.log('地图 更新完了')
  // }

  render() {
    return (
      <div className={this.props.className}>
        {!this.state.isLoaded && (
          <p className="tip-msg is-loading">map is loading...</p>
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
