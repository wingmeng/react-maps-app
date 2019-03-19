# Hotel Locations

一个酒店（宾馆）地图搜索的网页应用，主要为用户提供附近酒店的地图位置标注、关键词搜索、酒店详情等服务。

## 安装及部署

- 使用 `npm install` 安装所有项目依赖项
- 使用 `npm start` 启动前端服务器
- 使用 `npm server` 启动后端服务器
- 使用 `npm run build` 打包发布项目

> 如你安装了 Yarn，可使用 `yarn` 来代替上述代码中的 `npm`

## 开始使用

1. 成功启动前端和后端服务器后，使用浏览器访问 `http://localhost:3000` 即可打开应用；
2. 地图会自动定位到当前访问设备的 IP 所在地区，以此为中心点，搜索附近 5 公里范围的酒店（宾馆）；
3. 你可以拖动地图来更新搜索中心点，每次地图拖放后会自动更新搜索；
4. 搜索结果会显示在页面侧栏，以列表形式列出酒店名称，同时地图上会有相应的标记点；
5. 你也可以通过键入关键词来过滤搜索结果，列表及地图的展示条目会随之同步更新；
6. 当点击列表上的酒店名称时，地图上对应的标记点会居中显示并弹出概要信息窗口；
7. 概要信息包含酒店名称、照片、地址、电话、价格和评分信息；
8. 点击概要信息上的酒店名称链接可跳转到详情页。

## 支持平台

PC 端、移动端主流浏览器

## 第三方 API

- [Google Maps](https://cloud.google.com/maps-platform/)
- [Yelp Business Search](https://www.yelp.com/developers/documentation/v3/business_search)
- [ipapi](https://ipapi.co/)
