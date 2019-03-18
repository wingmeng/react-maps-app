// 将当前日期对象转换为 yyyyMMdd 格式的日期字符串
export default (today=new Date()) => {
  const fixZero = num => num < 10 ? '0' + num : num;

  return today.getFullYear() +
    fixZero(today.getMonth() + 1) +
    fixZero(today.getDate())
}
