import React, { Component } from 'react'
import IconBtn from './iconBtn'
import Map from './map'
import * as Search from './searchNearby'
import './App.scss'

class App extends Component {
  state = {
    isMiniMode: false,
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
    this.setState((state) => {
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
    // 平移或缩放后在地图空闲时触发（类似防抖处理）
    window.google.maps.event.addListener(map, 'idle', () => {
      let {lat, lng} = map.getCenter();

      Search.getNearby(lat(), lng())
        .then(data => {
          if (data.meta.code === 200) {
            this.setState({hotels: data.response.venues})    
          } else {
            this.setState({hotels: []})
          }

          cb(this.state.hotels)
        })
        .catch(() => {
          console.error('请求失败，请重试')
        })
    })
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
          <h1>
            <span>Hotel Locations</span>
            <IconBtn className="header-btn btn-close"
              title="关闭侧边栏"
              icon="icon-left"
              handle={() => this.toggleAside('close')} />
          </h1>
          <IconBtn className="header-btn btn-menu text-info"
            title="切换侧边栏"
            icon="icon-menu"
            handle={() => this.toggleAside()} />
        </header>
        <main id="main">
          <aside className="aside">
            <form>
              <input type="text" placeholder="keywords"></input>
            </form>
            <ul>
              <li>列表</li>
            </ul>
          </aside>
          <Map className="map-container" id="mapBox"
            mapCallback={(map, cb) => this.onMapReady(map, cb)} />
        </main>
      </div>
    );
  }
}

export default App;
