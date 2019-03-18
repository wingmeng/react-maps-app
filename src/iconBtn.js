import React from 'react';
import PropTypes from 'prop-types';
import $script from 'scriptjs';
import './iconBtn.scss';

// 加载 svg 图标
$script('//at.alicdn.com/t/font_1084739_y0tftj5rsk.js');

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
function IconBtn(props) {
  return (
    <button className={`icon-button ${props.className || ''}`}
      type={props.type || ''}
      title={props.title || ''}
      style={{...props.style}}
      disabled={props.disabled}
      onClick={() => props.onClick ? props.onClick() : false}
    >
      {props.icon && (
        <svg className="icon" aria-hidden="true">
          <use href={`#${props.icon}`}></use>
        </svg>
      )}
      {props.children && (
        <span>{props.children}</span>
      )}
    </button>
  )
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
