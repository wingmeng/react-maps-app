import React, { Component } from 'react'
import * as Search from './searchNearby'
import IconBtn from './iconBtn'
import Filter from './keywordsFilter'
import Map from './map'
import Notify from './notify'
import './App.scss'

class App extends Component {
  state = {
    isMiniMode: false,
    isSearching: false,
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

  // 地图初始化完成回调。`map` 为当前地图实例
  onMapReady(map, cb) {
    const MapEvent = window.google.maps.event;
    const getCurBounds = map => {
      let {ga, ma} = map.getBounds();
      let sw = `${ma.l},${ga.j}`;
      let ne = `${ma.j},${ga.l}`;

      return {sw, ne}
    };
    let zoomLv = map.getZoom();  // 当前地图缩放等级

    // 批量绑定地图事件，触发搜索
    [
      'idle',         // 地图空闲（初始化）
      'dragend',      // 拖放结束
      'zoom_changed'  // 地图缩放
    ].forEach(evtName => {
      const handle = MapEvent.addListener(map, evtName, () => {
        let {sw, ne} = getCurBounds(map);

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
              this.setState({isSearching: false})
              if (evtName === 'idle') {
                // 完成初始化标记展示后移除 idle 事件
                MapEvent.removeListener(handle)
              }
            })
            .catch(() => {
              this.setGlobalNotify('搜索失败，请重试')
            })
        }
      })
    })

    this.geoLocation()
  }

  // HTML5 地理定位
  geoLocation() {
    if (navigator.geolocation) {
      let timer = setTimeout(() => {
        this.setGlobalNotify('Geolocation 地理定位超时')
      }, 10 * 1e3);

      navigator.geolocation.getCurrentPosition(pos => {
        const position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        
        clearTimeout(timer)
        this.state.map.setCenter(position)
      })
    } else {
      this.setGlobalNotify('您的设备不支持 Geolocation 地理定位')
    }
  }

  // 搜索 sw 和 ne 矩形区域的信息
  searchNearby(sw, ne, cb) {
    return Search.getNearby(sw, ne, this.state.query)
      .then(data => {
        if (data.meta.code === 200) {
          this.setState({hotels: data.response.venues})
        } else {
          this.setState({hotels: []})
        }

        cb(this.state.hotels)
      })
  }

  // 全局通知
  setGlobalNotify(msg) {
    this.setState({notification: msg})
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

  // 生命周期：DOM 就绪
  componentDidMount() {
    // Search.getNearby().then(data => {
    //   this.setState({hotels: data.response.venues})
    // })
  }

  // 生命周期：接收到新参数，重新渲染前
  componentWillUpdate() {
    // console.log(this.state.hotels)
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
              handle={() => this.toggleAside('close')} />
          </h1>
          <IconBtn className="btn-menu text-info"
            title="切换侧边栏"
            icon="icon-menu"
            handle={() => this.toggleAside()} />
        </header>
        <main id="main">
          <aside className="aside">
            <Filter />

            <ul>
              <li>列表</li>
            </ul>
          </aside>
          <Map className="map-container" id="mapBox"
            isSearching={this.state.isSearching}
            globalNotify={(msg) => this.setGlobalNotify(msg)}
            mapCallback={(map, cb) => this.onMapReady(map, cb)} />
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
