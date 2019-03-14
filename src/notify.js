import React, {Component} from 'react'
import './notify.scss'

class Notify extends Component {
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

    // class 类名映射
    const posArr = {
      tl: 'pos-top-left',
      tc: 'pos-top-center',
      tr: 'pos-top-right',
      cc: 'pos-center',
      bl: 'pos-bottom-left',
      bc: 'pos-bottom-center',
      br: 'pos-bottom-right'
    };
    const pos = posArr[position] || posArr.tl;

    return (
      <div className={`notify ${theme} is-${type || 'notice'} ${pos} ${!this.state.live && 'invisible'}`}>
        {children}
      </div>
    )
  }
}

export default Notify;