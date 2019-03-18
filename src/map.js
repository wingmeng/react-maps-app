import React from 'react';
import PropTypes from 'prop-types';
import $script from 'scriptjs';
import axios from 'axios';
import mapAPI from './mapConfig';
import Notify from './notify';

/**
 * Map 地图组件
 * @interface {string} id - 地图容器 id
 * @interface {numbner} [height] - 地图容器的高度，默认为 100%
 * @interface {function} [onMapReady] - 地图初始化完成后的回调函数
 * @interface {function} [onMapClick] - 地图点击事件
 * @interface {function} [onMapDragend] - 地图拖放结束事件
 * @interface {function} [onMapZoomChanged] - 地图缩放事件
 * @interface {boolean} [geoLocation] - 是否开启 geolocation 地理定位
 * @interface {object} [mapNotice] - 地图状态通知信息配置
 */
class Map extends React.Component {
  mapElm = null;

  state = {
    isLoaded: false,  // 地图是否加载成功
    isFailed: false,  // 地图是否加载失败
    map: null,  // 初始化后的地图实例
    geoLocation: null
  }

  // 生命周期：首次渲染之前
  componentWillMount() {
    if (!this.state.isLoaded) {
      this.loadMap(mapAPI.url)
        .catch(() => {
          this.setState({isFailed: true})
        });
    }
  }

  // 生命周期：首次渲染完成
  componentDidMount() {
    this.mapElm = document.getElementById(this.props.id);
  }

  // 加载地图
  loadMap(mapUrls) {
    const urls = {};

    for (let {tag, url} of mapUrls) {
      urls[tag] = url;
    }

    // 异步加载地图
    return new Promise((resolve, reject) => {
      // 先尝试加载谷歌地图国际版
      // 这里的超时时间原本打算使用 navigator.connection API 来动态调整的
      // 但这是个实验中的 API，只有 Chrome 支持，故未采用
      axios.get(urls.GMap_i18n, {timeout: 1000})  // @临时
        .then(() => {
          $script(urls.GMap_i18n, () => {
            this.initMap();
            resolve();
          });
        })

        // 加载超时，尝试加载谷歌地图中国大陆版
        .catch(() => {
          // 大陆版的地图不支持跨域请求脚本，故使用 script 方式引入
          // 使用定时器来检测是否加载超时
          let timer = setTimeout(reject, 6000);

          $script(urls.GMap_cn, () => {
            clearTimeout(timer);
            this.initMap();
            resolve();
          });
        });
    })
  }

  // 地图初始化
  initMap() {
    if (window.google && window.google.maps) {
      const MapConstr = window.google.maps;
      
      this.setState(() => ({
        isLoaded: true,
        map: new MapConstr.Map(this.mapElm, {
          center: mapAPI.center,
          zoom: mapAPI.zoomLv,
          scaleControl: true,  // 比例尺
          clickableIcons: false,  // 禁用默认 POI 点击

          /**
           * greedy     : 当用户在屏幕上滑动（拖动）时，地图一律平移。
                          换言之，单指滑动和双指滑动都会使地图平移。
           * cooperative: 用户必须单指滑动来滚动页面，双指滑动来平移地图。
                          如果用户单指滑动地图，地图上会出现一个叠加项，提示用户使用双指来移动地图。
           * none       : 无法对地图执行平移或双指张合操作。
           * auto       : 默认值。根据页面是否可以滚动采用 cooperative 或 greedy 行为。
           */
          gestureHandling: 'greedy'
        })
      }));

      this.bindMapEvent(MapConstr);
      this.props.geoLocation && this.geoLocation();  // HTML5 地理定位
    }
  }

  // 绑定地图事件（可拓展）
  // API 详情：http://www.runoob.com/googleapi/ref-map.html
  bindMapEvent(MapConstr) {
    const props = this.props;

    // 地图就绪回调
    props.onMapReady && props.onMapReady(MapConstr, this.state.map);

    // 地图点击回调（不包含地图覆盖物）
    props.onMapClick && MapConstr.event.addListener(
      this.state.map, 'click', (event) => {
        props.onMapClick(event, this.state.map)
      }
    );

    // 地图拖放回调
    props.onMapDragend && MapConstr.event.addListener(
      this.state.map, 'dragend', () => {
        props.onMapDragend(this.state.map)
      }
    );

    // 地图缩放事件
    props.onMapZoomChanged && MapConstr.event.addListener(
      this.state.map, 'zoom_changed', () => {
        props.onMapZoomChanged(this.state.map)
      }
    );
  }

  // HTML5 地理定位
  geoLocation() {
    if (navigator.geolocation) {
      let timer = setTimeout(() => {
        this.setState({geoLocation: 'timeout'})
      }, 15 * 1e3);

      navigator.geolocation.getCurrentPosition(pos => {
        const position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        clearTimeout(timer);
        this.state.map.setCenter(position);
      })
    }
  }

  render() {
    const mapNotice = this.props.mapNotice;

    return (
      <div className={this.props.className}>
        {this.props.children}

        {!this.state.isLoaded && !this.state.isFailed && (
          <Notify type="loading">地图载入中...</Notify>
        )}

        {this.state.isFailed && (
          <p className="text-center text-danger" style={{marginTop: 20}}>
            地图加载失败！请刷新重试
          </p>
        )}

        {this.state.geoLocation === 'timeout' && (
          <Notify type="notice" delay={4000} theme="darken" position="br">
            地理定位超时
          </Notify>
        )}

        {/* 其他需要显示到地图上的通知信息 */}
        {mapNotice && (
          <Notify type={mapNotice.type}
            position={mapNotice.position}
            delay={mapNotice.delay}
            theme={mapNotice.theme}
            >{mapNotice.content}</Notify>
        )}

        <div id={this.props.id} role="application" style={
          {height: this.props.height || '100%'}
        }/>
      </div>
    )
  }
}

Map.propTypes = {
  id: PropTypes.string.isRequired,
  height: PropTypes.number,
  onMapReady: PropTypes.func,
  onMapClick: PropTypes.func,
  onMapDragend: PropTypes.func,
  onMapZoomChanged: PropTypes.func,
  geoLocation: PropTypes.bool,
  mapNotice: PropTypes.shape({
    type: PropTypes.oneOf(['loading', 'notice']),
    content: PropTypes.string,
    delay: PropTypes.number,
    theme: PropTypes.oneOf(['darken', 'lighten']),
    position: PropTypes.oneOf(['tc', 'tr', 'cc', 'bl', 'bc'])
  })
}

export default Map;
