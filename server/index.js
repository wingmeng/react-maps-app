// 使用代理服务器来响应客户端的 Yelp API 请求
// 参考自：https://blog.csdn.net/O_Victorain/article/details/79947969

const fs = require('fs');
const fetch = require('node-fetch');
const express = require('express');

const app = express();
const port = 3001;

const api = 'https://api.yelp.com/v3';
const headers = {
  'Authorization': 'Bearer Gf3eQ3ArWDsMy-oDVJstohUqpRVngZS0OcIRG1Oh4QWYlcuOEEQI4EHo3zKmZw6rx9BMtcWaOAP-OUtcminMpzCtiuHe9A5XZus3jTXlgDXMHysZqM84HQs-r0OPXHYx'
};

// 设置跨域访问
app.all('/yelp/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET');
  // res.header('X-Powered-By', '3.2.1');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
})

// API 地址：https://www.yelp.com/developers/documentation/v3/business_search
// client request: localhost:3001/yelp/businesses_search
// server proxy: https://api.yelp.com/v3/businesses/search
app.get('/yelp/businesses_search', (req, res) => {
  let { query } = req;

  fetch(`${api}/businesses/search
    ?categories=${query.categories}
    &latitude=${query.latitude}
    &longitude=${query.longitude}
    &term=${query.term}
    &radius=${query.radius}
    `.replace(/[\n\s]*/gm, ''), { headers })
    .then(res => res.json())
    .then(json => res.send(json))
})


const server = app.listen(port, function() {
  let host = server.address().address;
  let port = server.address().port;

  console.log('Server is running: http://%s:%s', host, port)
})
