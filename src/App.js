import React from 'react';
import IconBtn from './iconBtn';
import List from './list';
import Map from './map';
import Notify from './notify';
import * as PlacesAPI from './placesAPI';

import './App.scss';
import markerIcon from './icon/marker.png';

class App extends React.Component {
  MapConstr = null;  // 地图构造函数
  placeMap  = null;  // 当前地图实例
  mapZoomLv = null;  // 地图缩放等级

  state = {
    isMiniMode:   false,  // 侧边栏切换标识
    isSearching:  false,  // API  搜索状态标识
    markers:      [],     // 当前区域所有标记点
    infoWindow:   null,   // 当前   marker 的 infoWindow
    mapNotice:    null,   // 地图状态通知信息
    notification: '',     // 全局通知信息
    query:        '',     // 查询关键词
    placeId:      null,   // 当前地点 id
    places:       []      // 当前所有地点数据
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
    let screen_sm = 480;

    this.toggleAside(
      document.body.clientWidth <= screen_sm ? 'close' : 'open'
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

    const { event } = MapConstr;

    // 监听地图“空闲”（当前瓦片图加载完毕）事件
    // 完成初始化搜索后移除 idle 事件
    event.addListenerOnce(map, 'idle', (e) => {
      const { sw, ne } = this.getCurBounds(map);

      this.onSearch(sw, ne)
        .then(() => {
          this.buildMarkers(map);
        })
        .catch(err => {
          this.setGlobalNotify(err)
        })
    })
  }

  // 地图触发事件回调
  onMapEvent(map, evtName) {
    const { sw, ne } = this.getCurBounds(map);

    // 上一次请求完成后再请求，过滤高频发送请求
    if (!this.state.isSearching) {
      /**
       * 这段的作用是过滤掉重复请求
       * 每次地图缩放时判断是放大还是缩小：
       *  1.放大 - 不再调用 API 重复搜索
       *  2.缩小 - 地图缩放等级小于上次记录的值时，更新对比等级
       */
      if (evtName === 'zoom_changed') {
        let curZoomLv = map.getZoom();

        // 地图放大时（视野降低）不再重复搜索
        if (curZoomLv >= this.mapZoomLv) {
          return
        } else {
          // 当视图缩放等级小于上一次记录值，重置等级
          this.mapZoomLv = curZoomLv
        }
      }

      this.onSearch(sw, ne)
        .then(() => {
          this.buildMarkers(map)
        })
        .catch(err => {
          this.setGlobalNotify(err)
        })
    }
  }

  // 获取地图当前视区地理范围（西南角和东北角的一个矩形区域）
  // 地图“空闲”（当前瓦片图加载完毕）时，才有值，否则返回 undefined
  getCurBounds(map) {
    let {ga, ma} = map.getBounds();
    // ga: {j: 116.38962347977167, l: 116.40558798782831}  // lng
    // ma: {j: 39.89942035908015, l: 39.914514091354995}  // lat
    if (ga && ma) {
      let sw = `${ma.j},${ga.j}`;
      let ne = `${ma.l},${ga.l}`;

      return { sw, ne }
    }
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

  // 搜索 sw 和 ne 矩形区域的地点
  onSearch(sw, ne) {
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
      let timer = setTimeout(() => {
        this.setState(() => (
          {
            isSearching: false,
            mapNotice: null
          }
        ));

        reject('搜索超时，请重试');
      }, 15 * 1e3);

      PlacesAPI.searchList(sw, ne, this.state.query)
        .then(data => {
          clearTimeout(timer);

          // 移除搜索提示
          this.setState(() => (
            {
              isSearching: false,
              mapNotice: null
            }
          ));

          if (data.meta.code === 200) {
            this.setState({
              places: data.response.venues.map(item => (
                {
                  id: item.id,
                  name: item.name,
                  location: item.location
                }
              ))
            })
          } else {
            this.setState({places: []});
            reject('服务端接口异常，搜索失败');
          }

          // 搜索结果为空
          if (!this.state.places.length) {
            this.setState(() => (
              {
                mapNotice: {
                  content: '当前无搜索结果',
                  type: 'notice',
                  theme: 'darken',
                  position: 'bc'
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

    PlacesAPI.getPhotos('4bcc3b9868f976b07a386283')
      .then(res => {
        console.log(res)
      })
  }

  // 表单提交事件
  onFormSubmit(e) {
    e.preventDefault();
    
    const map = this.placeMap;
    const { sw, ne } = this.getCurBounds(map);

    this.onSearch(sw, ne)
      .then(() => {
        this.buildMarkers(map)
      })
      .catch(err => {
        this.setGlobalNotify(err)
      })
  }

  // 创建并显示 marker
  buildMarkers(map) {
    let markers = [];
    let lastMarker = null;

    this.removeMarkers();
    this.state.places.forEach(place => {
      let { lat, lng } = place.location;

      // 中国地址从大到小
      let address = (place.location.cc.toLowerCase() === 'cn'
        ? place.location.formattedAddress.reverse()
        : place.location.formattedAddress)
        .join(' ');

      let marker = new this.MapConstr.Marker({
          position: {
            lat: Number(lat),  // 强类型转换，防止参数异常
            lng: Number(lng)
          },
          icon: markerIcon,  // 自定义图标
          data: {  // 存储 place 数据
            id: place.id,
            name: place.name,
            address: address
          },
          zIndex: 1,
          animation: this.MapConstr.Animation.DROP,  // 下落动画
          map
      });

      markers.push(marker);

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

    this.setState({markers})
  }

  // 移除 markers
  removeMarkers() {
    this.state.markers.forEach(marker => marker.setMap(null));
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
          <h4>${data.name}</h4>
          <p><strong>地址:</strong> ${data.address}</p>
        </div>`
    });

    infoWindow.open(map, marker);
    map.panTo(marker.getPosition());  // 平移居中
    this.setState({infoWindow});
  }

  // 关闭地图上的 infoWindow
  closeInfoWindow(e) {
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
              onItemClick={(id) => this.setCurPlaceId(id, 'list')}
            />
          </aside>
          <Map className="map-container" id="mapBox"
            geoLocation={true} // 开启 geo 定位
            mapNotice={this.state.mapNotice}
            onMapReady={(MapConstr, map) => this.initSearch(MapConstr, map)}
            onMapClick={() => this.closeInfoWindow()}
            onMapDragend={(map) => this.onMapEvent(map, 'dragend')}
            onMapZoomChanged={(map) => this.onMapEvent(map, 'zoom_changed')}
          >
            <p className="sources-tip">
              搜索数据来源：<a href="https://foursquare.com/"
              target="_blank" rel="noopener noreferrer">Foursquare</a>
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
