<template>
  <div class="hello">
    <AddEdit @updateList="getShipLineList" />
    <h4>地图数据</h4>
    {{mapData}}
  </div>
</template>

<script>
import AddEdit from './AddEdit'
export default {
  components: {
    AddEdit
  },
  name: 'GdMapRouter',
  data () {
    return {
      mapData: []
    }
  },
  methods:{
    getShipLineList(data){
      this.mapData = data
    }
  }
}
</script>

<style scoped>

</style>
