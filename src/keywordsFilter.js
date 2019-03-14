import React from 'react'

const handleChange = debounce((e) => {
  let input = e.target;
  let value = input.value.trim();

  console.log(value)
  // if (value === '') {
  //   this.setState({ total: null })
  //   return
  // }

  // if (!this.state.searching) {
  //   this.setState({ searching: true });

  //   this.updateQuery(value, (data) => {
  //     this.setState(() => {
  //       return {
  //         searchedBooks: data,
  //         searching: false,
  //         total: data.length
  //       }
  //     })
  //   })
  // }
});

const formSubmit = (e) => {
  e.preventDefault();
  console.log(e.target.getFieldsValue)
  console.log(e.target.refs.name.getDOMNode().value)
}

function Filter(props) {
  return (
    <form onSubmit={formSubmit}>
      <input type="text"
        placeholder={props.placeholder || 'keywords'}
        name="query"
        value={props.query}
        onChange={handleChange}
      />
    </form>
  )
}

// 防抖函数
function debounce(func, delay=380) {
  let timer;

  return function(event) {
    clearTimeout(timer)

    // 保留对事件的引用
    // 参考自：https://blog.csdn.net/qq_37860930/article/details/83545473
    event.persist && event.persist()

    timer = setTimeout(() => {
      func(event)
    }, delay)
  }
}

export default Filter;
