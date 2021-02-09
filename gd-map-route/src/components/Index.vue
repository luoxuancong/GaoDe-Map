<template>
  <div class="hello">
    <AddEdit @updateList="getShipLineList" />
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
      mapData:{}
    }
  },
  methods:{
    getShipLineList(data){
      debugger
      this.mapData = data
    }
  }
}
</script>

<style scoped>

</style>
