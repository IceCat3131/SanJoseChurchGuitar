# 免费旅游行程规划器 H5 v1

这个版本不使用 Google Maps。

## 使用的免费/开源地图方案

- 地图显示：Leaflet + OpenStreetMap
- 地点搜索：OpenRouteService Geocoding；没有 API Key 时临时用 Nominatim 演示搜索
- 路线计算：OpenRouteService Directions；没有 API Key 时用直线距离估算

## 如何运行

直接打开 `index.html` 即可预览。

如果你放到 GitHub Pages，也可以直接运行。

## 如何填写 API Key

打开 `config.js`：

```js
window.APP_CONFIG = {
  ORS_API_KEY: "请在这里填写你的_OpenRouteService_API_Key"
};
```

把里面替换成你自己的 OpenRouteService Key。

申请地址：
https://openrouteservice.org/dev/#/signup

## 功能

- 手机 H5 自适应
- 搜索出发地
- 搜索终点
- 搜索并添加多个景点
- 每个景点设置游玩时间
- 景点可上移、下移、删除
- 景点实际时间可提前/延后
- 自动计算每站到达/离开时间
- 显示最终终点到达时间
- 地图显示点位和路线

## 注意

没有 OpenRouteService API Key 时，路线时间是估算，不是实际道路导航时间。
正式使用时建议填写 API Key。
