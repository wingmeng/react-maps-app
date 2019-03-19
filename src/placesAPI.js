// Yelp API 不支持 localhost 访问，故使用代理服务器来响应客户端的 Yelp API 请求
// `../server/index.js`
const api = 'http://localhost:3001/yelp';

// https://www.yelp.com/developers/documentation/v3/all_category_list
const categories = 'hotels';

export const searchNearby = (lat, lng, query, radius) => {
  if (!(lat && lng)) {
    return new Error(`\`lat\` or \`lng\` is required`)
  }

  return fetch(`${api}/businesses_search
    ?categories=${categories}
    &latitude=${lat}
    &longitude=${lng}
    &term=${query}
    &radius=${radius}
    `.replace(/[\n\s]*/gm, ''))
    .then(res => res.json())
}
