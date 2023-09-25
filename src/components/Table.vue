<template>
  <div>
    <el-table
      ref="dataTable"
      :data="dataSource.list || []"
      :height="tableHeight"
      :stripe="options.stripe"
      :border="options.border"
      header-row-class-name="table-header-row"
      highlight-current-row
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
    >
      <!-- 选择框 -->
      <el-table-column
        v-if="options.selectType && options.selectType == 'checkbox'"
        type="selection"
        width="50"
        algin="center"
      ></el-table-column>
      <!-- 序号 -->
      <el-table-column
        v-if="options.showIndex"
        lable="序号"
        type="index"
        width="60"
        algin="center"
      ></el-table-column>
      <!-- 数据列 -->
      <template v-for="(column, index) in columns">
        <template v-if="column.scopedSlots">
            <el-table-column
              :key="index"
              :prop="column.prop"
              :label="column.label"
              :algin="column.algin || 'left'"
              :width="column.width"
            >
              <template #default="scope">
                <slot
                  :name="column.scopedSlots"
                  :index="scope.$index"
                  :row="scope.row"
                ></slot>
              </template>
            </el-table-column>
        </template>
        <template v-else>
            <el-table-column
              :key="index"
              :prop="column.prop"
              :label="column.label"
              :algin="column.algin || 'left'"
              :width="column.width"
              :fixed="column.fixed"
            ></el-table-column>
        </template>
      </template>
    </el-table>
    <!-- 分页 -->
    <div class="pagination" v-if="showPagination">
      <el-pagination
        v-if="dataSource.totalCount"
        background
        :total="dataSource.totalCount"
        :page-sizes="[15,30,50,100]"
        :page-size="dataSource.pageSize"
        :current-page.sync="dataSource.pageNo"
        :layout="layout"
        @size-change="handlePageSizeChange"
        @current-change="handlePageNoChange"
        style="text-align: right"
      ></el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const emit = defineEmits(["rowSelected" , "rowClick"]);
const props = defineProps({
    dataSource: Object,
    showPagination: {
        type: Boolean,
        default: true,
    },
    showPageSize: {
        type: Boolean,
        default: true,
    },
    options: {
        type: Object,
        default: {
            extHeight: 0,
            showIndex: false,
        },
    },
    colums: Array,
    fetch: Function, //获取数据的函数
    initFetch: {
        type: Boolean,
    },
});

const layout = computed(() => {
    return `total,${ 
        props.showPageSize ? "sizes" : ""
    }, prev, page, next, jumper`;
});

//顶部60，内容区域距离顶部20，上下内容间距15*2，分页区域高度46
const topHeight = 60 + 20 + 30 + 46;

const tableHeight = ref(
    props.options.tableHeight
     ? props.options.tableHeight
     :window.innerHeight - topHeight - props.options.extHeight
);


//初始化
const init = () =>{
    if(props.initFetch && props.fetch) {
        props.fetch();
    }
};
init();


const dataTable = ref();
//清楚选中
const clearSelection = () => {
    dataTable.value.clearSelection();
};

//设置行选中
const setCurrentRow = (rowKey , rowValue) => {
    let row = props.dataSource.list.find((item) => {
        return item[rowKey] === rowValue;
    });
    dataTable.value.setCurrentRow(row);
}

//将子组件暴露出去，否则父组件无法调用
defineExpose({setCurrentRow , clearSelection});

//行点击
const handleRowClick = (row) => {
    emit("rowClick" ,row);
};

//多选
const handleSelectionChange = (row) => {
    emit("rowSelected" , row);
};

//切换每页大小
const handlePageSizeChange = (size) => {
    props.dataSource.pageSize = size;
    props.dataSource.pageNo = 1;
    props.fetch();
};

//切换页码
const handlePageNoChange = (pageNo) => {
    props.dataSource.pageNo = pageNo;
    props.fetch();
};

</script>




<style lang="scss" scoped>
.pagination {
    padding-top: 10px;
    padding-right: 10px;
}
.el-pagination {
    justify-content: right;
}
:deep .el-table__cell {
    padding: 4px 0px;
}
</style>