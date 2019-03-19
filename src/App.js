import React from 'react';
import IconBtn from './iconBtn';
import List from './list';
import Map from './map';
import Notify from './notify';
import * as PlacesAPI from './placesAPI';

import './App.scss';
import markerIcon from './icon/marker.png';

const COLOR_success = '#58cc67';  // from _variables.scss
const SCREEN_sm = 480;   // 小屏设备尺寸基准

class App extends React.Component {
  MapConstr = null;  // 地图构造函数
  placeMap  = null;  // 当前地图实例

  state = {
    isMiniMode:   false,    // 侧边栏切换标识
    isSearching:  false,    // API  搜索状态标识
    markers:      [],       // 当前区域所有标记点
    infoWindow:   null,     // 当前   marker 的 infoWindow
    radiusCircle: null,     // 圆形搜索半径
    mapNotice:    null,     // 地图状态通知信息
    notification: '',       // 全局通知信息
    radiusRange:  5 * 1e3,  // 搜索范围（m）
    query:        '',       // 查询关键词
    placeId:      null,     // 当前地点 id
    places:       []        // 当前所有地点数据
  }

  // 生命周期：首次渲染之前
  componentWillMount() {
    let timer = null;

    this.initMiniMode();

    // 监听窗口调整事件
    window.addEventListener('resize', () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        this.initMiniMode()
      }, 20)
    }, false)
  }

  // 初始化侧边栏显示
  // 小屏默认隐藏侧边栏
  initMiniMode() {
    this.toggleAside(
      document.body.clientWidth <= SCREEN_sm ? 'close' : 'open'
    )
  }

  // 切换侧边栏
  toggleAside(wantTo) {
    this.setState(state => {
      switch(wantTo) {
        case 'open':
          return { isMiniMode: false }
        case 'close':
          return { isMiniMode: true }

        // toggle
        default:
          return { isMiniMode: !state.isMiniMode }
      }
    })
  }

  // 初始化搜索功能
  initSearch(MapConstr, map) {
    this.MapConstr = MapConstr;
    this.placeMap = map;
    this.mapZoomLv = map.getZoom();

    [
      'idle',  // “空闲”（当前瓦片图加载完毕）事件
      'dragend'  // 拖动结束事件
    ].forEach(evtName => {
      let handle = MapConstr.event.addListener(map, evtName, () => {
        const { lat, lng } = map.getCenter();

        this.onSearch(lat(), lng())
          .then(() => {
            this.buildMarkers(map);

            // 完成初始化搜索后移除 idle 事件
            if (evtName === 'idle') {
              MapConstr.event.removeListener(handle)
            }
          })
          .catch(err => {
            this.setGlobalNotify(err)
          })
      })
    })
  }

  onListClick(id) {
    // 小屏且侧边栏展开，点击地图后先隐藏侧栏
    if (document.body.clientWidth <= SCREEN_sm
      && !this.state.isMiniMode) {
      this.toggleAside('close')
    }

    this.setCurPlaceId(id, 'list')
  }

  // 设置当前位置 id
  setCurPlaceId(id, from) {
    this.setState({placeId: id});

    if (from === 'map') {
      // 地图可以使用路由吗？
      // 暂时使用 hash 代替，用以将对应列表项滚动到可视区，但无法像路由那样有历史记录
      window.location.hash = this.state.placeId;
    } else if (from === 'list') {
      this.buildInfoWindow(this.getCurMarker(id));
    }
  }

  // 搜索给定经纬度附近的地点
  onSearch(lat, lng) {
    // 开启搜索提示
    this.setState(() => (
      {
        isSearching: true,
        mapNotice: {
          content: '搜索中...',
          type: 'loading',
          theme: 'lighten',
          position: 'cc'
        }
      }
    ));

    return new Promise((resolve, reject) => {
      // 疑问：搜索超时定时器触发后如何中断当前 fetch 请求？
      // 网上的 new AbortController() 兼容性堪忧
      let timer = setTimeout(() => {
        this.setState(() => (
          {
            isSearching: false,
            mapNotice: null
          }
        ));

        reject('搜索超时，请重试');
      }, 15 * 1e3);

      PlacesAPI.searchNearby(lat, lng, this.state.query, this.state.radiusRange)
        .then(data => {
          clearTimeout(timer);

          // 移除搜索提示
          this.setState(() => (
            {
              isSearching: false,
              mapNotice: null
            }
          ));

          if (data.error) {
            this.setState({places: []});
            reject('服务端接口异常，搜索失败');
          } else {
            this.setState({places: data.businesses})
          }

          // 搜索结果为空
          if (!this.state.places.length) {
            this.setState(() => (
              {
                mapNotice: {
                  content: '当前无搜索结果',
                  type: 'notice',
                  theme: 'darken',
                  position: 'cc'
                }
              }
            ));
          }

          resolve()
        })
    })
  }

  // 更新查询关键词
  updateQuery(value) {
    this.setState({query: value})
  }

  // 表单提交事件
  onFormSubmit(e) {
    e.preventDefault();

    const map = this.placeMap;
    const { lat, lng } = map.getCenter();

    this.onSearch(lat(), lng())
      .then(() => {
        this.buildMarkers(map);
      })
      .catch(err => {
        this.setGlobalNotify(err)
      })
  }

  buildRadiusCircle(map, center) {
    // 清除上一个区域
    if (this.state.radiusCircle) {
      this.state.radiusCircle.setMap(null);
      this.setState({radiusCircle: null});
    }

    let { lat, lng } = center;
    let radiusCircle = new this.MapConstr.Circle({
      strokeColor: COLOR_success,
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: COLOR_success,
      fillOpacity: 0.15,
      radius: this.state.radiusRange,
      center: {lat: lat(), lng: lng()},
      map
    });

    this.MapConstr.event.addListener(radiusCircle, 'click', () => {
      this.closeInfoWindow()
    });

    this.setState({radiusCircle});
  }

  // 创建并显示 marker
  buildMarkers(map) {
    let markers = [];
    let lastMarker = null;
    let bounds = new this.MapConstr.LatLngBounds();  // 界限集合

    this.removeMarkers();
    this.state.places.forEach(place => {
      let { latitude, longitude } = place.coordinates;
      let marker = new this.MapConstr.Marker({
          position: {
            lat: Number(latitude),  // 强类型转换，防止参数异常
            lng: Number(longitude)
          },
          icon: markerIcon,  // 自定义图标
          data: {  // 存储 place 数据
            ...place
          },
          zIndex: 1,
          animation: this.MapConstr.Animation.DROP,  // 下落动画
          map
      });

      markers.push(marker);
      bounds.extend(marker.position);  // 将 marker 加入到界限集合中

      this.MapConstr.event.addListener(marker, 'click', () => {
        if (lastMarker) {
          lastMarker.setZIndex(1)
        }

        marker.setZIndex(100);  // 当前点击的 marker 置顶
        lastMarker = marker;
        this.setCurPlaceId(marker.data.id, 'map');
        this.buildInfoWindow(marker);
      })
    });

    if (markers.length) {
      let boundsCenter = bounds.getCenter();

      // 缩放平移地图，使所有 marker 都显示出来
      map.setCenter(boundsCenter);
      map.fitBounds(bounds);

      this.buildRadiusCircle(map, boundsCenter);
    }

    // 避免视野过低
    if (map.getZoom() > 19) {
      map.setZoom(19)
    }

    this.setState({markers});
  }

  // 移除 markers
  removeMarkers() {
    this.state.markers.forEach(marker => {
      marker.setMap(null);
      marker = null;  // 释放内存
    });

    this.setState({markers: []});
  }

  // 获取当前 placeId 对应的地图 marker
  getCurMarker(id) {
    let markers = this.state.markers;

    for (let i = 0; i < markers.length; i++) {
      if (markers[i].data.id === id) {
        return markers[i]
      }
    }
  }

  // 创建 infoWindow
  buildInfoWindow(marker) {
    let { data, map } = marker;

    // 关闭上一个
    if (this.state.infoWindow) {
      this.state.infoWindow.close()
    }

    let infoWindow = new this.MapConstr.InfoWindow({
      content: `<div class="map-info-window">
          <h4 class="info-title">
            <a href="${data.url}" target="_blank" rel="noopener noreferrer">${data.name}</a>
          </h4>
          <div class="info-body">
            <div class="info-content">
              <p><strong>地址：</strong>${data.location.display_address.join(', ')}</p>
              <p><strong>座机：</strong>${data.display_phone}</p>
              <p><strong>价格：</strong>${data.price}</p>
              <p><strong>评分：</strong>${data.rating}</p>
            </div>
            <figure class="info-photo">
              <img src="${data.image_url || markerIcon}" alt="${data.name}" />
            </figure>
          </div>
        </div>`
    });

    infoWindow.open(map, marker);
    map.panTo(marker.getPosition());  // 平移居中
    this.setState({infoWindow});
  }

  // 关闭地图上的 infoWindow
  closeInfoWindow() {
    if (this.state.infoWindow) {
      this.state.infoWindow.close();
      this.setState({infoWindow: null});
    }
  }

  // 全局通知信息
  setGlobalNotify(msg) {
    this.setState({notification: msg})
  }

  render() {
    return (
      <div className={this.state.isMiniMode ? 'is-aside-mini' : ''}>
        <header id="header">
          <h1 className="app-title">
            <span>Hotel Locations</span>
            <IconBtn className="btn-close"
              title="关闭侧边栏"
              icon="icon-left"
              onClick={() => this.toggleAside('close')}
            />
          </h1>
          <IconBtn className="btn-menu text-info"
            title="切换侧边栏"
            icon="icon-menu"
            onClick={() => this.toggleAside()}
          />
        </header>
        <main id="main">
          <aside className="aside">
            <form onSubmit={(event) => this.onFormSubmit(event)}>
              <div className="form-group">
                <div className="input-group">
                  <input type="text" className="form-control"
                    value={this.state.query}
                    placeholder="名称/地址"
                    aria-label="keywords"
                    onChange={(event) => this.updateQuery(event.target.value)}
                  />
                  <IconBtn className="btn-danger"
                    title="清空"
                    icon="icon-close"
                    type="reset"
                    style={{display: this.state.query ? 'block' : 'none'}}
                    onClick={() => this.updateQuery('')}
                  />
                  <IconBtn className="btn-primary"
                    disabled={this.state.isSearching}
                    title="搜索"
                    icon="icon-search"
                    type="submit"
                  />
                </div>
              </div>
            </form>
            <List className="list"
              items={this.state.places}
              activeId={this.state.placeId}
              onItemClick={(id) => this.onListClick(id)}
            />
          </aside>
          <Map className="map-container" id="mapBox"
            geoLocation={true} // 开启 geo 定位
            mapNotice={this.state.mapNotice}
            onMapReady={(MapConstr, map) => this.initSearch(MapConstr, map)}
            onMapClick={() => this.closeInfoWindow()}
          >
            <p className="sources-tip">
              搜索数据来自：<a href="https://www.yelp.com/" target="_blank" rel="noopener noreferrer">
                <img src="https://s3-media2.fl.yelpcdn.com/assets/srv0/yelp-shared-styles/58cfc999e1f5/lib/img/logos/burst_desktop_xsmall_outline.png" alt="Yelp" />
                Yelp</a>
            </p>
          </Map>
        </main>
        {this.state.notification && (
          <Notify delay={5000} type="notice" theme="darken" position="cc">
            {this.state.notification}
          </Notify>
        )}
      </div>
    );
  }
}

export default App;
