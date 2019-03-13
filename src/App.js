import React, { Component } from 'react'
// import requireMap from './requireMap'
// import axios from 'axios'
import IconBtn from './iconBtn'
import Map from './map'
import './App.scss'



// var clientId = "HCFKSRBOE34ZWFFURMZYDY1F4HT2D3OHGOXFMU12H5Y3LTVU";
// var clientSecret = "G4MBBX2XNBGQJYQ3QJJY1N2ZPVTB1R05CHPT5N5LM3X4P5IL";
// var url =
//   "https://api.foursquare.com/v2/venues/search?client_id=" +
//   clientId +
//   "&client_secret=" +
//   clientSecret +
//   "&v=20180803&ll=" +
//   40.7413549 +
//   // place.marker.getPosition().lat() +
//   "," +
//   // place.marker.getPosition().lng() +
//   -73.99802439999996 +
//   "&limit=1";

// // $script(url, function(a,b) {
// //   console.log(a, b)
// // });

class App extends Component {
  state = {
    isMiniMode: false
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
  onMapReady(map) {

    console.log(map)
  }

  // 生命周期：首次渲染之前
  componentWillMount() {
    let timer = null;

    this.initMiniMode();
    window.addEventListener('resize', () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        this.initMiniMode()
      }, 20);
    }, false);
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

          </aside>
          <Map className="map-container" id="mapBox"
            mapCallback={(map) => this.onMapReady(map)} />
        </main>
      </div>
    );
  }
}

export default App;
