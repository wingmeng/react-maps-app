import React from 'react'

function List(props) {
  const { items, placeId } = props;

  return (
    <ul aria-label="Hotels list" className={props.className}>
      {Array.isArray(items) && items.map(item => (
        <li key={item.id}>
          {/* 使用锚点链接 */}
          <a href={`#${item.id}`} id={item.id} title={item.name}
            className={placeId === item.id ? 'is-active' : ''}
            onClick={() => props.onItemClick(item.id)}
          >{item.name}</a>
        </li>
      ))}
    </ul>
  )
}

export default List;
