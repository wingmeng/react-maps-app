import React from 'react';
import PropTypes from 'prop-types';
import './notify.scss';

// position class 类名映射
const positions = {
  tl: 'pos-top-left',
  tc: 'pos-top-center',
  tr: 'pos-top-right',
  cc: 'pos-center',
  bl: 'pos-bottom-left',
  bc: 'pos-bottom-center',
  br: 'pos-bottom-right'
};

// 主题
const themes = ['lighten', 'darken'];

// 类型
const types = ['loading', 'notice'];

/**
 * Notify 通知提示组件
 * @interface {number} [delay] - 通知提示框停留时间，超时后消失。不设置或设置为0，则不消失
 * @interface {string} [position] - 通知提示框相对于父容器的位置（见上面的 positions）
 * @interface {string} [theme] - 主题背景色，如不设置则为透明背景
 * @interface {string} [type] - 提示框类型，notice（默认） 或 loading
 */
class Notify extends React.Component {
  state = {
    live: true
  }

  // 生命周期：渲染完毕后
  componentDidMount() {
    let delay = Number(this.props.delay);

    if (delay) {
      setTimeout(() => {
        this.setState({live: false})
      }, delay)
    }
  }

  render() {
    const {position, theme, type, children} = this.props;
    let pos = positions[position] || positions.tl;

    return (
      <div className={`notify ${theme} is-${type || 'notice'} ${pos} ${!this.state.live && 'invisible'}`}>
        {children}
      </div>
    )
  }
}

Notify.propTypes = {
  delay: PropTypes.number,
  position: PropTypes.oneOf(Object.keys(positions)),
  theme: PropTypes.oneOf(themes),
  type: PropTypes.oneOf(types)
}

export default Notify;
