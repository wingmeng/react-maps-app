import React, { Component } from 'react'
import * as Search from './searchNearby'
import IconBtn from './iconBtn'
import Form from './form'
import List from './list'
import Map from './map'
import Notify from './notify'
import './App.scss'

class App extends Component {
  map = null;
  markers = null;
  displayMarker = () => {};
  infoWindow = null;

  state = {
    isMiniMode: false,
    isSearching: false,

    curPlaceId: null,
    notification: '',
    query: '',
    hotels: []
  }

  initMiniMode() {
    // 小屏默认不显示侧边栏
    this.toggleAside(
      document.body.clientWidth <= 480 ? 'close' : 'open'
    )
  }

  // 切换侧边栏
  toggleAside(wantTo) {
    this.setState(state => {
      switch(wantTo) {
        case 'open':
          return {isMiniMode: false}
        case 'close':
          return {isMiniMode: true}
        default:
          return {isMiniMode: !state.isMiniMode}
      }
    })
  }

  // 获取地图当前视区地理范围
  getCurBounds(map) {
    let {ga, ma} = map.getBounds();
    let sw = `${ma.l},${ga.j}`;
    let ne = `${ma.j},${ga.l}`;

    return { sw, ne }
  }

  // 地图初始化完成回调。`map` 为当前地图实例
  onMapReady(map, cb) {
    this.map = map;
    this.displayMarker = cb;

    const MapEvent = window.google.maps.event;
    let zoomLv = map.getZoom();  // 当前地图缩放等级

    // 批量绑定地图事件，触发搜索
    [
      'idle',         // 地图空闲（初始化）
      'dragend',      // 拖放结束
      'zoom_changed'  // 地图缩放
    ].forEach(evtName => {
      const handle = MapEvent.addListener(map, evtName, () => {
        let { sw, ne } = this.getCurBounds(map);

        // 过滤高频请求
        if (!this.state.isSearching) {
          this.setState({isSearching: true})

          /**
           * 这段的作用是过滤掉重复请求
           * 每次地图缩放时判断是放大还是缩小：
           *  1.放大 - 不再调用 API 重复搜索
           *  2.缩小 - 地图缩放等级小于上次记录的值时，更新对比等级
           */
          if (evtName === 'zoom_changed') {
            // 地图放大时（视野降低）不再重复搜索
            if (map.getZoom() >= zoomLv) {
              this.setState({isSearching: false})
              return
            } else {
              zoomLv = map.getZoom();  // 当视图缩放等级大于上一次，重置等级
            }
          }

          this.searchNearby(sw, ne, cb)
            .then(() => {
              if (evtName === 'idle') {
                // 完成初始化标记展示后移除 idle 事件
                MapEvent.removeListener(handle)
              }
            })
            .catch(err => {
              this.setState({isSearching: false})
              this.setGlobalNotify(err)
            })
        }
      })
    })
  }

  // 设置当前位置
  setCurPlaceId(id, to) {
    this.setState({curPlaceId: id})

    if (to === 'list') {
      // 地图没想出用路由的思路，暂时使用 hash 代替，用以将对应列表项滚动到可视区
      window.location.hash = id;
    } else if (to === 'map') {
      let markers = this.markers;

      for (let i = 0; i < markers.length; i++) {
        if (markers[i].id === id) {
          this.showInfoWindow(markers[i])
          break
        }
      }
    }
  }

  // 该代码与 map.js 中的部分重复
  showInfoWindow(marker) {
    let { data } = marker;
    let infoWindow = new window.google.maps.InfoWindow({
      content: `<div class="map-info-window">
          <h4>${data.name}</h4>
          <p><strong>地址:</strong> ${data.address}</p>
        </div>`
    });

    if (this.infoWindow) {
      this.infoWindow.close()
    }

    infoWindow.open(this.map, marker)
    this.infoWindow = infoWindow;
    this.map.panTo(marker.getPosition())  // 平移居中
    marker.setZIndex(marker.getZIndex() + this.markers.length)  // 点击置顶
  }

  getCurMarkers(markers) {
    this.markers = markers;
  }

  // 搜索 sw 和 ne 矩形区域的信息
  searchNearby(sw, ne, cb) {
    return new Promise((resolve, reject) => {
      let timer = setTimeout(() => {
        reject('搜索超时，请重试')
      }, 15 * 1e3);

      Search.getNearby(sw, ne, this.state.query)
        .then(data => {
          clearTimeout(timer);
          this.setState({isSearching: false})

          if (data.meta.code === 200) {
            this.setState({hotels: data.response.venues})
          } else {
            this.setState({hotels: []})
          }

          cb(this.state.hotels)
          resolve()
        })
        .catch(() => {
          reject('服务端接口异常，搜索失败')
        })
    })
  }

  // 全局通知
  setGlobalNotify(msg) {
    this.setState({notification: msg})
  }

  // 更新查询条件
  updateQuery(querys) {
    const { keywords } = querys;
    const { sw, ne } = this.getCurBounds(this.map);

    this.setState({query: keywords})

    if (!this.state.isSearching) {
      this.setState({isSearching: true})
      this.searchNearby(sw, ne, this.displayMarker)
        .catch(err => {
          this.setState({isSearching: false})
          this.setGlobalNotify(err)
        })
    }
  }

  // 生命周期：首次渲染之前
  componentWillMount() {
    let timer = null;

    this.initMiniMode();

    window.addEventListener('resize', () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        this.initMiniMode()
      }, 20)
    }, false)
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
              handle={() => this.toggleAside('close')}
            />
          </h1>
          <IconBtn className="btn-menu text-info"
            title="切换侧边栏"
            icon="icon-menu"
            handle={() => this.toggleAside()}
          />
        </header>
        <main id="main">
          <aside className="aside">
            <Form children={[
                {
                  type: 'inputGroup',
                  children: [
                    {
                      type: 'text',
                      name: 'keywords',
                      'aria-label': 'keywords',
                      placeholder: '名称/地址'
                    }, {
                      component: <IconBtn className="btn-primary"
                        disabled={this.state.isSearching}
                        title="搜索"
                        icon="icon-search"
                        type="submit" />
                    }
                  ]
                }
              ]}
              isSearching={this.state.isSearching}
              onFormSubmit={(querys) => this.updateQuery(querys)}
            />
            <List className="list"
              items={this.state.hotels}
              placeId={this.state.curPlaceId}
              onItemClick={(id) => this.setCurPlaceId(id, 'map')}
            />
          </aside>
          <Map className="map-container" id="mapBox"
            isSearching={this.state.isSearching}
            geoLocation={true} // 开启 geo 定位
            placeId={this.state.curPlaceId}
            getMarkers={(markers) => this.getCurMarkers(markers)}
            onMarkerClick={(id) => this.setCurPlaceId(id, 'list')}
            globalNotify={(msg) => this.setGlobalNotify(msg)}
            mapCallback={(map, cb) => this.onMapReady(map, cb)}
          />
        </main>
        {this.state.notification && (
          <Notify delay="5000" type="notice" theme="darken" position="br">
            {this.state.notification}
          </Notify>
        )}
      </div>
    );
  }
}

export default App;
