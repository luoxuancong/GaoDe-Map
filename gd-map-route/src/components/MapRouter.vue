<!--
 * @Descripttion:
 * @version:
 * @Author: luoxuancong
 * @Date: 2020-07-17 10:46:23
 * @LastEditors: luoxuancong
<<<<<<< HEAD
 * @LastEditTime: 2021-02-09 15:24:30
=======
 * @LastEditTime: 2021-02-09 18:51:37
>>>>>>> c02250effae8c22ef433fc61009a2570db823c24
-->
<template>
  <div>
    <div class="route-list">
      <div class="list header">
        <div class="th">
          序号
        </div>
        <div class="th">
          地址
        </div>
        <div class="th">
          详细地址
        </div>
        <div class="th">
          限速（km/h）
        </div>
        <div class="th">
          地址是否有效
        </div>
        <div class="th">
          操作
        </div>
      </div>
      <div class="content">
        <draggable v-model="routerList" :animation="200" :options="{filter:'.dis',preventOnFilter:false}" @end="changeEnd">
          <div v-for="(item,index) in routerList" :key="index" class="list">
            <div class="td">
              {{ index+1 }}
            </div>
            <div class="td">
              <el-input
                :id="'tipinputrouter'+index"
                v-model.trim="item.name"
                class="dis"
                :title="item.name"
                clearable
                size="mini"
                @input="mapAddrChoice('tipinputrouter'+index,index)"
                @change="mapAddrChoice('tipinputrouter'+index,index)"
                @clear="clearInput(index)"
                @blur="inputBlur"
              />
            </div>
            <div class="td">
              {{ item.detalAddr }}
            </div>
            <div class="td">
              <el-input-number
                v-model.trim="item.speedLimit"
                class="dis"
                :controls="false"
                :title="item.speedLimit"
                clearable
                size="mini"
              />
            </div>
            <div :class="{'td':true,'green':item.location,'red':!item.location}">
              {{ item.location?'有效':'无效' }}
            </div>
            <div class="td">
              <el-button type="danger" size="mini" @click="deleteRouter(index)">删除</el-button>
              <el-button type="primary" size="mini" @click="addRouter(index)">添加</el-button>
            </div>
          </div>
        </draggable>
      </div>
      <div class="footer center">
<<<<<<< HEAD
        <el-button @click="colseFn">取消</el-button>
=======
>>>>>>> c02250effae8c22ef433fc61009a2570db823c24
        <el-button type="primary" @click="addRouter(routerList.length)">添加途经点</el-button>
        <el-button :loading="btnLoading" type="primary" @click="confirmFn">生成路线</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { debounce } from '@/utils'
import gdMap from '@/utils/map'
import draggable from 'vuedraggable'
export default {
  components: {
    draggable
  },
  props: {
    type: { // 编辑类型
      type: String,
      default: undefined
    },
    editRouter: {
      type: Array,
      default: undefined
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      btnLoading: false,
      render: Math.random(1000),
      map: undefined,
      AMap: undefined,
      routerList: [

      ]
    }
  },
  watch: {
    show(val) {
      if (val) {
        this.routerList = []
        this.render = Math.random(1000)
        this.initMapRouter()
        if (this.editRouter.length > 0) {
          this.routerList = Array.from(this.editRouter)
        }
      }
    },
    editRouter(val) {
      this.routerList = []
      this.render = Math.random(1000)
      this.initMapRouter()
      if (val.length > 0) {
        this.routerList = Array.from(val)
      }
    }
  },
  mounted() {
    this.inputBlur = debounce(() => {
      this.renderKey = Math.random(1000)
      this.confirmFn()
    }, 500)
  },
  methods: {
    changeEnd() {
      this.inputBlur()
    },
    confirmFn() { // 确认事件
      const flag = this.routerList.some(item => {
        return !item.location
      })
      console.log(this.routerList)
      // 判断是否获取到了经纬度数据
      if (flag) {
        this.$message.warning('请选择有效的地址信息！')
        return
      } else {
        this.$emit('getRouterVal', this.routerList)
      }
      this.btnLoading = true
      setTimeout(() => {
        this.btnLoading = false
      }, 1500)
    },
    addRouter(index) { // 添加途径点
      this.routerList.splice(index + 1, 0, {})
    },
    deleteRouter(index) { // 删除途径点
      this.routerList.splice(index, 1)
      this.inputBlur()
    },
    clearInput(index) { // 点击清空输入框时 将定位数据清除
      const obj = {
        location: '',
        name: '',
        detalAddr: ''
      }
      this.routerList[index] = obj
      const list = Array.from(this.routerList)
      this.routerList = list
      this.render = Math.random(1000)
    },
<<<<<<< HEAD
    colseFn() {
      this.$emit('update:show', false)
    },
=======
>>>>>>> c02250effae8c22ef433fc61009a2570db823c24
    initMapRouter() { // 初始化地图
      const that = this
      gdMap().then(
        AMap => {
          that.AMap = AMap
          that.map = new AMap.Map('router_map', {
            resizeEnable: true,
            zoom: 13
          })
          AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function() {
            that.map.addControl(new AMap.ToolBar())
            that.map.addControl(new AMap.Scale())
          })
        },
        e => {
          console.log('地图加载失败', e)
        }
      )
    },
    mapAddrChoice(id, index) { // 地图检索事件
      const that = this
      window.AMapUI.loadUI(['misc/PoiPicker'], function(PoiPicker) {
        var poiPicker = new PoiPicker({
          // city:'北京',
          input: id
        })

        // 初始化poiPicker
        poiPickerReady(poiPicker)
      })
      function poiPickerReady(poiPicker) {
        // 选取了某个POI
        poiPicker.on('poiPicked', function(poiResult) {
          this.render = Math.random(1000)
          var poi = poiResult.item
          if (!poi.location) {
            that.$message.warning('没有获取到该位置的经纬度数据！')
            return
          }
          that.routerList[index].lat = poi.location.lat
          that.routerList[index].lng = poi.location.lng
          that.routerList[index].location = poi.location
          that.routerList[index].name = poi.name
          that.routerList[index].detalAddr = (poi.district ? (poi.district + '-') : '') + poi.name
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.amap-ui-poi-picker-sugg-list{
  max-height: 300px;
}
.footer{
  margin-top: 10px;
}
.route-list{
  height: 100%;
  .content{
    height: calc(100% - 90px);
    overflow: auto;
    position: relative;
  }
  .header{
    background: #e8e8e8;
    color: #333;
  }
  .list{
    display: flex;
    align-items: center;
    justify-content: space-around;
    border-bottom: 1px solid #e8e8e8;
    min-height: 36px;
    .td,.th{
      width: 33.33333%;
      text-align: center;
      line-height: 16px;
      &:nth-child(1){
        width: 80px;
      }
      &:nth-child(3){
        padding: 0 10px;
        font-size: 13px;
      }
      &:nth-child(4),&:nth-child(5){
        width: 130px;
      }
      &:nth-child(6){
        width: 150px;
        min-width: 150px;
      }
    }
  }
}
</style>
