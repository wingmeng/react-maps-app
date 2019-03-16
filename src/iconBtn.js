import React from 'react'
import $script from 'scriptjs'
import './iconBtn.scss'

// 加载 svg 图标
$script('//at.alicdn.com/t/font_1084739_y0tftj5rsk.js');

/**
 * Icon names:
    icon-search
    icon-hotel
    icon-left
    icon-close
    icon-menu
    icon-back
    icon-cog
 */

export default (props) => {
  return (
    <button className={`icon-button ${props.className || ''}`}
      type={props.type || ''}
      title={props.title || ''}
      disabled={props.disabled}
      onClick={() => props.handle ? props.handle() : false}
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
