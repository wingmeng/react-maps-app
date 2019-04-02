import React from 'react';
import PropTypes from 'prop-types';

/**
 * List 列表组件
 * @interface {string} [className] - 附加的 class 类名
 * @interface {array} [items] - 列表数据
 * @interface {string | number} [activeId] - 当前高亮条目 id
 * @interface {function} [onItemClick] - 列表项点击事件回调
 */
function List(props) {
  const { items } = props;

  return (
    <ul aria-label="Hotels list" className={props.className}>
      {!items.length && (
        <li className="is-empty">
          <small className="text-muted">当前列表为空</small>
        </li>
      )}
      {items.map(item => (
        <li key={item.id} id={item.id} title={item.name}
          className={props.activeId === item.id ? 'is-active' : ''}
          onClick={() => props.onItemClick && props.onItemClick(item.id)}
        >{item.name}</li>
      ))}
    </ul>
  )
}

List.propTypes = {
  className: PropTypes.string,
  items: PropTypes.array,
  activeId: PropTypes.oneOfType([
    PropTypes.string, PropTypes.number
  ]),
  onItemClick: PropTypes.func
}

export default List;
