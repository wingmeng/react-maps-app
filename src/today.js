export default (today=new Date()) => {
  const fixZero = num => num < 10 ? '0' + num : num;

  return today.getFullYear() +
    fixZero(today.getMonth() + 1) +
    fixZero(today.getDate())
}
