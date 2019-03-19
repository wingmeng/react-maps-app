import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import $script from 'scriptjs';
import './iconBtn.scss';

// svg 图标，from: iconfont.cn
const iconsUrl = '//at.alicdn.com/t/font_1084739_y0tftj5rsk.js';

// Icon names:
const iconNames = [
  'icon-search',
  'icon-hotel',
  'icon-left',
  'icon-close',
  'icon-menu',
  'icon-back',
  'icon-cog'
];

/**
 * IconBtn 图标按钮组件
 * @interface {string} [className] - 附加的 class 类名
 * @interface {string} [type] - 按钮类型，如 submit、reset、button
 * @interface {string} [title] - 按钮的 title 提示
 * @interface {object} [style] - 按钮的 style 样式自定义
 * @interface {boolean} [disabled] - 按钮是否处于禁用状态
 * @interface {function} [onClick] - 按钮点击事件
 * @interface {string} [icon] - 按钮图标的名称，如不设置，则不显示图标。
 */
class IconBtn extends React.Component {
  state = {
    isIconLoaded: true
  }

  // 生命周期：即将渲染
  componentWillMount() {
    axios.get(iconsUrl, { timeout: 5000 })
      .then(() => {
        $script(iconsUrl)
      })

      // 图标加载失败
      .catch(() => {
        this.setState({isIconLoaded: false})
      })
  }

  render() {
    const props = this.props;

    return (
      <button className={`icon-button ${props.className || ''}`}
        type={props.type || ''}
        title={props.title || ''}
        style={{...props.style}}
        disabled={props.disabled}
        onClick={() => props.onClick ? props.onClick() : false}
      >
        {props.icon && this.state.isIconLoaded && (
          <svg className="icon" aria-hidden="true">
            <use href={`#${props.icon}`}></use>
          </svg>
        )}

        {props.children && (
          <span>{props.children}</span>
        )}

        {/* 图标加载失败，且无文本，则显示 title 避免一片空白 */}
        {!this.state.isIconLoaded && !props.children && (
          <small>{props.title}</small>
        )}
      </button>
    )
  }
}

IconBtn.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
  title: PropTypes.string,
  style: PropTypes.object,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  icon: PropTypes.oneOf(iconNames)
}

export default IconBtn;
