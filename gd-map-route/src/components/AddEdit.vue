<!--
 * @Descripttion:
 * @version:
 * @Author: luoxuancong
 * @Date: 2020-04-20 15:42:26
 * @LastEditors: luoxuancong
 * @LastEditTime: 2021-02-09 19:15:42
 -->
<template>
  <div class="map-flex">
    <div>
      <el-form
        ref="form"
        :model="formData"
        :show-message="false"
        :status-icon="true"
        :rules="rules"
        inline
        label-width="90px"
      >
        <el-form-item label="起点:">
          <el-input
            id="tipinput"
            v-model.trim="formData.startAddress"
            clearable
            size="mini"
            @input="mapAddrChoice('tipinput', 'start')"
            @focus="mapAddrChoice('tipinput', 'start')"
          />
        </el-form-item>
        <el-form-item label="目的地:">
          <el-input
            id="tipinput2"
            v-model.trim="formData.destAddress"
            clearable
            size="mini"
            @input="mapAddrChoice('tipinput2', 'end')"
            @focus="mapAddrChoice('tipinput2', 'end')"
          />
        </el-form-item>
        <el-form-item label="里程(KM):" prop="liCheng">
          <el-input-number
            v-model="formData.liCheng"
            size="mini"
            :min="0"
            :max="99999999"
            :precision="2"
            :controls="false"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="small" type="success" @click="prviewBtnFn"
            >预览</el-button
          >
          <el-button
            :loading="btnLoading"
            size="small"
            type="primary"
            @click="saveBtnFn"
            >生成地图数据</el-button
          >
        </el-form-item>
      </el-form>
      <div style="width:100%;height:calc(100% - 80px);">
        <div id="container" class="map" />
      </div>
    </div>
    <MapRouter
      :show.sync="mapRouterShow"
      :edit-router="editRouter"
      @getRouterVal="getRouterVal"
    />
  </div>
</template>

<script>
import gdMap from "@/utils/map";
import MapRouter from "./MapRouter";
export default {
  name: "AddEdit",
  components: {
    MapRouter
  },
  props: {},
  data() {
    return {
      editRouter: [], // 编辑时的途径数据
      routerValList: [],
      mapRouterShow: false, // 显示设置途径点弹窗
      renderKey: Math.random(1000), // 渲染DOM key
      startWLData: undefined, // 起点围栏数据
      endWLData: undefined, // 起点围栏数据
      showTxt: false,
      currentLngLat: undefined, // 最后的点击地图target 位置 的经纬度
      btnLoading: false,
      formData: {
        startObj: {},
        endObj: {},
        projectName: "",
        recevierName: "",
        startAddress: "",
        destAddress: "",
        liCheng: ""
      },
      mapData: {
        speedLimit: undefined, // 线速
        waypoints: [], // 途径路线
        lineData: [] // 全部导航包
      }, // 地图数据包
      map: undefined,
      AMap: undefined,
      rules: {
        projectName: [{ required: true }],
        liCheng: [{ required: true }]
      }
    };
  },
  created() {
    this.initMap();
  },
  methods: {
    getRouterVal(val) {
      this.routerValList = val;
      this.editRouter = Array.from(val);
      // 有途径网点后重新渲染路线
      this.driverLine2(true);
    },
    prviewBtnFn() {
      const that = this;
      that.showTxt = !that.showTxt;
      if (
        !this.mapData.waypoints ||
        this.mapData.waypoints.length === 0 ||
        JSON.stringify(this.mapData.waypoints) === "{}"
      ) {
        return;
      }
      this.mapData.waypoints.forEach((item, index) => {
        index = new that.AMap.Text({
          map: that.map,
          visible: that.showTxt,
          position: new that.AMap.LngLat(item.lng, item.lat),
          text:
            '<b>途径序号： </b> <span style="color:blue">' +
            (index + 1) +
            "</span><br/>" +
            (item.speedLimit
              ? "限速：" + item.speedLimit + "KM/小时"
              : "限速： 未设置"),
          offset: new that.AMap.Pixel(0, 20)
        });
        that.map.add(index);
      });

      if (!that.showTxt) {
        that.removeMapTxt();
      }
    },
    removeMapTxt() { // 清空地图覆盖物
      const that = this;
      const txt = that.map.getAllOverlays("text");
      that.map.remove(txt);
      that.showTxt = false;
    },
    mapSearch(id) {
      // 地图查询
      // 输入提示
      var autoOptions = {
        input: id
      };
      var auto = new this.AMap.Autocomplete(autoOptions);
      var placeSearch = new this.AMap.PlaceSearch({
        map: this.map,
        children: 0
      }); // 构造地点查询类
      this.AMap.event.addListener(auto, "select", select); // 注册监听，当选中某条记录时会触发
      function select(e) {
        placeSearch.setCity(e.poi.adcode);
        placeSearch.search(e.poi.name, (status, res) => {}); // 关键字查询查询
      }
    },
    mapAddrChoice(id, type) {
      const that = this;
      if(!window.AMapUI) {
        return false
      }
      window.AMapUI.loadUI(["misc/PoiPicker"], function(PoiPicker) {
        var poiPicker = new PoiPicker({
          // city:'北京',
          input: id
        });

        // 初始化poiPicker
        poiPickerReady(poiPicker);
      });
      function poiPickerReady(poiPicker) {
        var marker = new that.AMap.Marker();
        var infoWindow = new that.AMap.InfoWindow({
          offset: new that.AMap.Pixel(0, -20)
        });

        // 选取了某个POI
        poiPicker.on("poiPicked", function(poiResult) {
          var poi = poiResult.item;
          if (!poi.location) {
            that.$message.warning("没有获取到该位置的经纬度数据！");
            return;
          }
          var info = `<b>地名:</b> ${poi.name}； <br/><b>地址:</b> ${
            poi.address
          }；<br/><b>经纬度:</b> ${poi.location.toString()}`;

          marker.setMap(that.map);
          infoWindow.setMap(that.map);

          marker.setPosition(poi.location);
          infoWindow.setPosition(poi.location);
          if (type === "start") {
            that.formData.start = info;
            that.formData.startObj = poi;
            that.formData.startAddress = poi.name;
            infoWindow.setContent(
              "<b>当前位置</b>  <br/>" + that.formData.start
            );
            if (that.formData.endObj && that.formData.startObj) {
              // 起点终点都填写了
              that.driverLine2();
            }
          } else {
            that.formData.end = info;
            that.formData.endObj = poi;
            that.formData.destAddress = poi.name;
            infoWindow.setContent("<b>当前位置</b>  <br/>" + that.formData.end);
            if (that.formData.endObj && that.formData.startObj) {
              // 起点终点都填写了
              that.driverLine2();
            }
          }
          // if (that.formData.endObj && that.formData.startObj) {
          //   // 起点终点都填写了
          //   that.driverLine()
          // }
          infoWindow.open(that.map, marker.getPosition());
          marker.on("click", _ => {
            infoWindow.open(that.map, marker.getPosition());
          });
          that.map.setCenter(marker.getPosition());
        });
      }
    },
    driverLine2(isFull) {
      // isFull 是否自动居中显示
      const that = this;
      that.map.clearMap(); // 清除所有地图marker
      if(!that.formData.startObj.location.lng || !that.formData.startObj.location.lat){
        that.$message.warning('请输入有效的起点位置！')
        return false
      }
      if(!that.formData.endObj.location || !that.formData.endObj.location.lat){
        that.$message.warning('请输入有效的终点位置！')
        return false
      }
      const startPoi = new that.AMap.LngLat(
        that.formData.startObj.location.lng,
        that.formData.startObj.location.lat
      );
      const endPoi = new that.AMap.LngLat(
        that.formData.endObj.location.lng,
        that.formData.endObj.location.lat
      );

      const waypointsPoi = this.routerValList.map(item => {
        let res;
        if (item) {
          res = new that.AMap.LngLat(
            item.lng || item.location.lng,
            item.lat || item.location.lat
          );
        } else {
          res = false;
        }
        return res;
      });
      var drivingRouter = new that.AMap.Driving({
        // 驾车路线规划策略
        // policy: that.AMap.DrivingPolicy.LEAST_DISTANCE
      });
      // 当超过十六个途径网点的时候 做拆分获取导航数据
      // 将起点 终点加入到途径网点 用来获取路径
      waypointsPoi.unshift(startPoi);
      waypointsPoi.push(endPoi);

      const length = waypointsPoi.length;
      const midNum = 16;
      const count = Math.ceil(length / midNum); // 向上取整 获取请求次数
      // const lineList = []
      let mid, start, end;
      // console.log(waypointsPoi, count)
      const tmpplandatas = [];
      for (let i = 0; i < count; i++) {
        start = midNum * i; // 起点
        if (length - start > midNum) {
          end = start + midNum;
          mid = Array.from(waypointsPoi).splice(start + 1, midNum);
        } else {
          end = length - 1;
          mid = Array.from(waypointsPoi).splice(start, end);
        }
        // console.log(waypointsPoi[start], start, waypointsPoi[end], end, mid, '请求参数')
        tmpplandatas.push(
          new Promise((resolve, reject) => {
            drivingRouter.search(
              waypointsPoi[start],
              waypointsPoi[end],
              { waypoints: mid },
              function(status, result) {
                // result 即是对应的驾车导航信息，相关数据结构文档请参考  https://lbs.amap.com/api/javascript-api/reference/route-search#m_DrivingResult
                if (status === "complete") {
                  // 实际里程赋值
                  resolve(result);
                  // 具体线路赋值
                } else {
                  reject(result);
                }
              }
            );
          })
        );
      }
      // 所有请求结束后执行
      Promise.all(tmpplandatas)
        .then(res => {
          // 实际里程
          let totalDis = 0;
          const lineData = [];
          res.forEach(item => {
            totalDis += item.routes[0].distance;
            // 实际路线
            item.routes[0].steps.forEach(item2 => {
              item2.path.forEach(item3 => {
                const list = [];
                list[0] = item3.lng;
                list[1] = item3.lat;
                lineData.push(list);
              });
            });
          });
          that.mapData.lineData = lineData;
          that.drawLineFn(that.mapData.lineData, isFull);
          that.formData.liCheng = (totalDis / 1000).toFixed(2);
        })
        .catch(err => {
          that.$message.warning("线路生成失败：" + err);
        });

      if (that.routerValList) {
        const tjList = that.routerValList.map(item => {
          item.lng = item.lng || item.location.lng;
          item.lat = item.lat || item.location.lat;
          return item;
        });
        that.mapData.waypoints = tjList;
      }
      that.triggerClick();
      that.addMarkerClick();
    },
    darwMidLineFn(isFull) {
      // 绘制途径点，起、终点
      const startIcon = new this.AMap.Icon({
        // 图标尺寸
        size: new this.AMap.Size(25, 34),
        // 图标的取图地址
        image:
          "//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png",
        // 图标所用图片大小
        imageSize: new this.AMap.Size(135, 40),
        // 图标取图偏移量
        imageOffset: new this.AMap.Pixel(-9, -3)
      });
      const marker = new this.AMap.Marker({
        icon: startIcon,
        size: [3, 3],
        position: [
          this.formData.startObj.location.lng,
          this.formData.startObj.location.lat
        ],
        draggable: this.type !== "preview"
      });
      marker.on("dragend", res => {
        const { lng, lat } = res.lnglat;
        this.formData.startObj.location.lng = lng;
        this.formData.startObj.location.lat = lat;
        this.driverLine2(true);
      });
      const endIcon = new this.AMap.Icon({
        size: new this.AMap.Size(25, 34),
        image:
          "//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png",
        imageSize: new this.AMap.Size(135, 40),
        imageOffset: new this.AMap.Pixel(-95, -3)
      });
      const marker2 = new this.AMap.Marker({
        icon: endIcon,
        size: [3, 3],
        position: [
          this.formData.endObj.location.lng,
          this.formData.endObj.location.lat
        ],
        draggable: this.type !== "preview"
      });
      marker2.on("dragend", res => {
        const { lng, lat } = res.lnglat;
        this.formData.endObj.location.lng = lng;
        this.formData.endObj.location.lat = lat;
        this.driverLine2(true);
      });
      this.map.add([marker, marker2]);
      this.routerValList.forEach((item, index) => {
        const startIcon = new this.AMap.Icon({
          // 图标尺寸
          size: new this.AMap.Size(25, 34),
          // 图标的取图地址
          image:
            "//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png",
          // 图标所用图片大小
          imageSize: new this.AMap.Size(135, 40),
          // 图标取图偏移量
          imageOffset: new this.AMap.Pixel(-53, -3)
        });
        const marker = new this.AMap.Marker({
          icon: startIcon,
          size: [3, 3],
          position: [item.lng, item.lat],
          draggable: this.type !== "preview"
        });
        let routerValIndex;
        marker.on("mousedown", res => {
          const list = [this.currentLngLat.lng, this.currentLngLat.lat];
          const distanceList = this.routerValList.map(item2 => {
            // 获取距离list
            if (!item2.lng || !item2.lat) {
              this.$message.warning("请检途径点输入是否有效！");
            }
            const p = [item2.lng, item2.lat];
            return this.AMap.GeometryUtil.distance(list, p);
          });
          const min = Math.min.apply(null, distanceList); // 最小值
          routerValIndex = distanceList.indexOf(min);
          // console.log(routerValIndex)
        });
        marker.on("dragend", res => {
          const { lng, lat, Q, R } = res.lnglat;
          this.routerValList[routerValIndex].lat = lat;
          this.routerValList[routerValIndex].lng = lng;
          this.routerValList[routerValIndex].location.lat = lat;
          this.routerValList[routerValIndex].location.lng = lng;
          this.routerValList[routerValIndex].location.Q = Q;
          this.routerValList[routerValIndex].location.R = R;
          this.driverLine2(true);
        });
        this.map.add(marker);
      });
      if (isFull) {
        return;
      }
      this.map.setFitView();
    },
    // 绘制路线
    drawLineFn(pathData, isFull) {
      const that = this;
      const path = pathData.map(item => {
        return new that.AMap.LngLat(item[0], item[1]);
      });
      var newLine = new this.AMap.Polyline({
        path: path,
        strokeWeight: 8,
        strokeOpacity: 0.8,
        strokeColor: "#0091ea",
        showDir: true,
        lineJoin: "round"
      });
      this.map.add(newLine);
      that.darwMidLineFn(isFull);
    },
    addMarkerClick() {
      const that = this;
      var infoWindow = new that.AMap.InfoWindow({
        offset: new that.AMap.Pixel(0, -20)
      });
      // 拿到地图上的marker 点
      setTimeout(() => {
        var dom = document
          .getElementById("container")
          .getElementsByClassName("amap-marker");
        dom = Array.from(dom).filter(item => {
          if (item.style.display !== "none") {
            return item;
          }
        });
        dom.forEach((item, index) => {
          const img = item.getElementsByClassName("amap-icon")[0];
          if (img) {
            img.onclick = e => {
              // marker 点击事件
              const leftCss = img.getElementsByTagName("img")[0].style.left;
              if (leftCss === "-9px" || leftCss === "-95px") {
                // 用来排除 起点、终点
                return;
              }
              const list = [that.currentLngLat.lng, that.currentLngLat.lat];
              const distanceList = this.mapData.waypoints.map(item => {
                // 获取距离list
                const p = [item.lng, item.lat];
                return that.AMap.GeometryUtil.distance(list, p);
              });
              const min = Math.min.apply(null, distanceList); // 最小值
              const index = distanceList.indexOf(min);
              const currentPoint = this.mapData.waypoints[index];
              const LngLat = new that.AMap.LngLat(
                currentPoint.lng,
                currentPoint.lat
              );
              infoWindow.setMap(that.map);
              // 设置marker信息展示内容
              const speedLimit = currentPoint.speedLimit
                ? currentPoint.speedLimit + "KM"
                : "未设置";
              infoWindow.setContent(
                "<b>报警信息 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b>  <br/><br/>" +
                  '<b>途径序号：  <span style="color:blue">' +
                  (index + 1) +
                  "</span></b><br/>" +
                  '<b>限速： </b> <span class="speed-input">' +
                  speedLimit +
                  "</span><br/><br/>" +
                  `<button id="closeBtn" type="button" class="el-button el-button--small el-button--danger" "><span>删除</span></button> <button id="editBtn" type="button" class="el-button el-button--primary el-button--small"><span>设 置</span></button>`
              );
              if (this.type !== "preview") {
                infoWindow.open(that.map, LngLat);
              }
              setTimeout(() => {
                document.getElementById("closeBtn").onclick = () => {
                  // console.log(index)
                  this.routerValList.splice(index, 1);
                  this.editRouter = this.routerValList;
                  this.driverLine2(true);
                  infoWindow.close();
                };
                document.getElementById("editBtn").onclick = () => {
                  that.limitSet(index);
                };
              }, 500);
            };
          }
          // const markerIcon = item.getElementsByClassName('amap-marker-content')[0].getElementsByTagName('div')[0]
        });
      }, 500);
    },
    addMapMarker() {
      // 点击地图添加点
      const that = this;
      that.map.on("click", async function(ev) {
        if (
          !(that.formData.endObj && that.formData.startObj) ||
          that.type === "preview"
        ) {
          return;
        }
        var lnglat = ev.lnglat;
        // 制作途径点ICON
        const startIcon = new that.AMap.Icon({
          // 图标尺寸
          size: new that.AMap.Size(25, 34),
          // 图标的取图地址
          image:
            "//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png",
          // 图标所用图片大小
          imageSize: new that.AMap.Size(135, 40),
          // 图标取图偏移量
          imageOffset: new that.AMap.Pixel(-53, -3)
        });
        const marker = new that.AMap.Marker({
          icon: startIcon,
          size: [3, 3],
          position: [lnglat.lng, lnglat.lat],
          draggable: true
        });
        // 添加途经点
        that.map.add(marker);
        // 获取当前途经点的位置信息
        const obj = await that.getMapAddr(lnglat);
        // 拼装一个临时途径点数据结构
        const templateMid = {
          name: obj.pois.length > 0 ? obj.pois[0].name : obj.formattedAddress,
          detalAddr: obj.formattedAddress,
          location: lnglat
        };
        that.getMidAddIndex(templateMid, true);

        // 拖拽点实时更新经纬度数据
        marker.on("dragend", async res => {
          lnglat = res.lnglat;
          // 获取当前途经点的位置信息
          const obj = await that.getMapAddr(lnglat);
          // 拼装一个临时途径点数据结构
          const templateMid = {
            name: obj.pois.length > 0 ? obj.pois[0].name : obj.formattedAddress,
            detalAddr: obj.formattedAddress,
            location: lnglat
          };
          that.getMidAddIndex(templateMid);
        });
      });
    },

    /**
     * @name: getMidAddIndex
     * @param {Object} mid 单个途经点
     * @param {Boolean} add 是否添加到途径点
     * @return:
     */
    getMidAddIndex(mid, add) {
      // 获取途径点插入位置
      // console.log(mid, this.routerValList)
      const list = [mid.location.lng, mid.location.lat];
      if (add) {
        if (this.routerValList.length === 0) {
          this.routerValList.push(mid);
        } else {
          const distanceList = this.routerValList.map(item => {
            // 获取距离list
            const p = [item.lng, item.lat];
            return this.AMap.GeometryUtil.distance(list, p);
          });
          // console.log(distanceList)
          const min = Math.min.apply(null, distanceList); // 最最近点
          const index = distanceList.indexOf(min); // 最近的点索引
          // 当前点 距离起点的距离
          const startPos = [
            this.formData.startObj.location.lng,
            this.formData.startObj.location.lat
          ]; // 起点经纬度
          const endPos = [
            this.formData.endObj.location.lng,
            this.formData.endObj.location.lat
          ]; // 终端经纬度

          const startDis = this.AMap.GeometryUtil.distance(list, startPos); // 计算最当前点到起点的距离
          const endDis = this.AMap.GeometryUtil.distance(list, endPos); // 计算最当前点到终点的距离

          // 最近点距离起、终点的距离
          const nearPos = [
            this.routerValList[index].location.lng,
            this.routerValList[index].location.lat
          ]; // 最近点经纬度

          const nearSDis = this.AMap.GeometryUtil.distance(nearPos, startPos); // 计算最近点到起点的距离
          const nearEDis = this.AMap.GeometryUtil.distance(nearPos, endPos); // 计算最近点到终点的距离

          // console.log(index)
          if (startDis < endDis) {
            // 当前点靠近起点时
            // console.log('当前点靠近起点')
            if (nearSDis > startDis) {
              // marker点比最近点更靠近起点
              // console.log('marker点比最近点更靠近起点', index)
              if (index === 0) {
                // 如果是第一个点直接将marker点放到第一
                this.routerValList.unshift(mid);
              } else {
                this.routerValList.splice(index + 1, 0, mid);
              }
            } else {
              // console.log('最近点比marker点更靠近起点')
              this.routerValList.splice(index + 1, 0, mid);
            }
          } else {
            // 当前点靠近终点时
            // console.log('当前点靠近终点')
            if (nearEDis > endDis) {
              // 最近点 离 终点 比 当前点离终点近时
              // console.log('marker点更靠近终点')
              this.routerValList.splice(index + 1, 0, mid);
            } else {
              // console.log('最近点更靠近终点')
              this.routerValList.splice(index, 0, mid);
            }
            // this.routerValList.splice(index - 1, 0, mid)
          }
          // this.routerValList.push(mid)
        }
      }
      this.editRouter = this.routerValList;
      this.driverLine2(true);
    },
    getMapAddr(lnglat) {
      return new Promise(resolve => {
        const that = this;
        that.AMap.plugin("AMap.Geocoder", function() {
          var geocoder = new that.AMap.Geocoder({
            extensions: "all",
            radius: 500
            // city 指定进行编码查询的城市，支持传入城市名、adcode 和 citycode
            // city: '010'
          });
          geocoder.getAddress(lnglat, function(status, result) {
            if (status === "complete" && result.info === "OK") {
              resolve(result.regeocode);
            }
          });
        });
      });
    },
    limitSet(index) {
      this.$prompt("请输入最大速度（KM/小时）", "提示", {
        closeOnClickModal: false,
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^\d+(\.\d{0,2})?$/,
        inputErrorMessage: "格式不正确，最多输入两位小数点"
      }).then(({ value }) => {
        this.mapData.waypoints[index]["speedLimit"] = Number(value);
        document.getElementsByClassName("speed-input")[0].innerHTML =
          Number(value) + "KM"; // 赋值
        this.removeMapTxt();
      });
    },
    triggerClick() {
      // 获取当前地图点击的坐标点
      const that = this;
      that.map.on("mousemove", function(ev) {
        var lnglat = ev.lnglat;
        that.currentLngLat = lnglat;
      });
    },
    initMap() {
      const that = this;
      gdMap().then(
        AMap => {
          that.AMap = AMap;
          that.map = new AMap.Map("container", {
            resizeEnable: true,
            zoom: 13
          });
          AMap.plugin(["AMap.ToolBar", "AMap.Scale"], function() {
            that.map.addControl(new AMap.ToolBar());
            that.map.addControl(new AMap.Scale());
          });
          that.addMapMarker();
        },
        e => {
          console.log("地图加载失败", e);
        }
      );
    },
    saveBtnFn() {
      if (!this.mapData.lineData || this.mapData.lineData.length === 0) {
        this.$message.warning("请完善地图线路信息！");
        return;
      }
      // 地图路线数据 直接返回经纬度数组
      this.$emit("updateList",this.mapData.lineData);
    }
  }
};
</script>

<style lang="scss" scoped>
.map-flex {
  display: flex;
  justify-content: space-between;
  & > div {
    width: 50%;
    padding: 0 10px;
  }
}
/deep/ {
  .el-button + .el-button {
    margin-left: 8px;
  }
  .amap-overlay-text-container {
    color: red;
    font-weight: bold;
    opacity: 0.9;
  }
  .speed-input {
    color: red;
    font-weight: bold;
    font-size: 16px;
  }
  .el-input--mini .el-input__inner {
    font-weight: bold;
    color: #1890ff;
  }
  .amap-ui-poi-picker-sugg-container {
    min-width: 100% !important;
    max-height: 350px !important;
    text-align: left;
    line-height: 18px;
  }
  .amap-ui-poi-picker-search-results-container {
    min-width: 300px !important;
    line-height: 18px;
  }
  .el-form--inline .el-form-item {
    margin: 0 10px 0 0;
  }
  .el-form {
    padding-bottom: 5px;
  }
}
#container {
  width: 100%;
  height: 500px;
}
</style>
