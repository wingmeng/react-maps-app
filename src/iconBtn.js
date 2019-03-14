import React from 'react'
import $script from 'scriptjs'
import './iconBtn.scss'

// 加载 svg 图标
$script('//at.alicdn.com/t/font_1084739_lvg4ix9y5nm.js');

export default (props) => {
  return (
    <button className={`icon-button ${props.className}`} title={props.title}
        onClick={() => props.handle()}>
      <svg className="icon" aria-hidden="true">
        <use href={`#${props.icon}`}></use>
      </svg>
    </button>
  )
}
