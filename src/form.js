import React, { Component } from 'react'

class Form extends Component {
  formItems = {};

  getFormValues(e) {
    e.preventDefault();

    // 灵感来自：https://stackoverflow.com/questions/44767821/react-js-how-to-set-state-on-form-submit
    // console.log(this.formItems)

    let values = {};
    let formItems = this.formItems;

    for (let key in formItems) {
      if (formItems.hasOwnProperty(key)) {
        values[key] = formItems[key].value
      }
    }

    // 将所有表单项的值传递出去
    this.props.onFormSubmit(values)
  }

  render() {
    return (
      <form onSubmit={(event) => this.getFormValues(event)}>
        {this.props.children.map((item, idx) => (
          <div key={idx} className="form-group">
            {item.type === 'inputGroup' ? (
              <div className="input-group">
                {Array.isArray(item.children) && item.children.map((field, fieldIdx) => (
                  <Field key={`${idx}_${fieldIdx}`}
                    fieldProps={field}  // 传递给子组件的表单属性
                    formItems={this.formItems}  // 用于收集表单传值
                  />
                ))}
              </div>
            ) : (
              <Field key={idx}
                fieldProps={item}
                formItems={this.formItems}
              />
            )}
          </div>
        ))}
      </form>
    )
  }
}

class Field extends Component {
  // 表单项 DOM 属性映射表
  fieldDOMProps = [
    'id',
    'className',
    'name',
    'cols',
    'rows',
    'size',
    'type',
    'value',
    'checked',
    'disabled',
    'readonly',
    'maxlength',
    'placeholder',
    'autocomplete',
    'aria-label'
  ];

  // 构建表单项属性，过滤掉非表单项 DOM 属性
  getDOMProps(curProps) {
    let temp = {};

    for (let key in curProps) {
      if (curProps.hasOwnProperty(key) && this.fieldDOMProps.includes(key)) {
        temp[key] = curProps[key];
      }
    }

    return temp
  }

  render() {
    let { fieldProps, formItems } = this.props;
    let clsName = 'form-control';

    return (
      // Fragments 空标签，用以解决语义化嵌套问题
      // 参考官方文档：https://reactjs.org/docs/fragments.html
      <>
        {/**
          * 使用 IIFE，从而可以在内部使用 js 方法
          * TODO：完善所有表单项类型
          */}
        {(() => {
          // 子组件
          if (fieldProps.component) {
            return fieldProps.component

          // 下拉框
          // TODO：需要遍历 option
          } else if (fieldProps.type === 'select') {

          // 单/复选框
          // TODO：情况比较特殊，存在多个同名 name 值，得使用数组存储
          } else if (['radio', 'checkbox'].includes(fieldProps.type)) {

          // 文本域
          } else if (fieldProps.type === 'textarea') {
            return <textarea className={clsName}></textarea>
          } else {
            return <input className={clsName}
              ref={(el) => {
                // 以表单项的 name 值为字段，存储其自身
                el && el.name ? formItems[el.name] = el : void(0)
              }}
              {...this.getDOMProps(fieldProps)} />
          }
        })()}
      </>
    )
  }
}

export default Form;
