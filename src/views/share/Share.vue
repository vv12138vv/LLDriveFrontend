<template>
  <div>
    <div class="top">
    
    </div>
    <div class="file-list">
      <Table
        :columns="columns"
        :showPagination="true"
        :dataSource="tableData"
        :fetch="loadDataList"
        :options="tableOptions"
        @rowSelected="rowSelected"
      >
        <template #file_name="{ index, row }">
          <div
            class="file-item"
            @mouseenter="showOp(row)"
            @mouseleave="cancelShowOp(row)"
          >
            <template
              v-if="
                (row.fileType == 3 || row.fileType == 1) && row.status == 3
              "
            >
              <icon :cover="row.fileCover"></icon>
            </template>
            <template v-else>
              <icon v-if="row.folderType == 0" :fileType="row.fileType"></icon>
              <icon v-if="row.folderType == 1" :fileType="0"></icon>
            </template>
            <span
              class="file-name"
              v-if="!row.showRename"
              :title="row.fileName"
            >
              <span>{{ row.fileName }}</span>
            </span>
              <span class="op">
                <template v-if="row.showOp && row.fileId">
                  <span class="iconfont icon-share" @click="openDialog(row)">转存</span>
                </template>
              </span>
          </div>
        </template>
        <template #expire_time="{ index, row }">
          {{ row.validType == 3 ? "永久" : row.expireTime }}
        </template>
      </Table>
    </div>
  </div>
  <div v-if="dialogVisible" class="modal-overlay">
    <!-- 对话框 -->
    <el-dialog v-model="dialogVisible" title="填写提取码" @close="dialogVisible = false" :width="300">
        <el-input v-model="extractCode" placeholder="请输入提取码" :maxLength="6" style="margin-bottom: 10%;"></el-input>
      <span slot="footer" class="dialog-footer" style="display: flex;justify-content: center;">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script setup>
import useClipboard from "vue-clipboard3";
const { toClipboard } = useClipboard();
import { ref, reactive, getCurrentInstance, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();
import axios from 'axios';
const instance = axios.create({
  baseURL: "http://localhost:8848"
});



//列表
const columns = [
  {
    label: "分享ID",
    prop: "shared_id",
    width: 300,
  },
  {
    label: "文件名",
    prop: "file_name",
    scopedSlots: "file_name",
    width: 500,
  },
  {
    label: "分享者",
    prop: "sharer_name",
  },
  {
    label: "分享时间",
    prop: "share_time",
  },
  {
    label: "失效时间",
    prop: "expire_time",
    scopedSlots: "expire_time",
  },
  {
    label: "分享次数",
    prop: "shared_count",
  }
];
//搜索
const search = () => {
  showLoading.value = true;
  loadDataList();
};
//列表
const tableData = ref({ page_no: 1, page_size: 15 });
const tableOptions = {
  extHeight: 20,
  selectType: "checkbox",
};
const userInfo = ref(
  proxy.VueCookies.get("userInfo")
);


const loadDataList = async () => {
  console.log('loadDataList called');
  try {
    let response = await instance.get('/api/share/list',{
      params:{
        page_no: tableData.value.page_no,
        page_size:  tableData.value.page_size,
      }
    });
    if(response.data.status_code==proxy.Status.success){
      const p = response.data.data;
      p.list.forEach((element)=>{
        element.fileName = element.file_name;
        element.folderType = element.is_dir == true ? 1:0;
        element.fileType = element.type;
        //下面解注释使文件预览
        element.status = 2;
        element.fileSize = element.size;
        element.expireTime=element.expire_time;
        element.fileId = element.shared_id;
      })
      // tableData.value = response.data.data;
      tableData.value = p;
      console.log(p);
      // console.log(tableData.value.data);
      // editing.value = false;
    }
  } catch (error) {
    console.log(error);
  }
  console.log(tableData.value);
};

//展示操作按钮
const showOp = (row) => {
  tableData.value.list.forEach((element) => {
    element.showOp = false;
  });
  row.showOp = true;
};

const cancelShowOp = (row) => {
  row.showOp = false;
};

//复制链接
const copy = async (data) => {
  await toClipboard(
    `链接:${shareUrl.value}${data.shareId} 提取码: ${data.code}`
  );
  proxy.Message.success("复制成功");
};

//多选 批量选择
const selectIdList = ref([]);
const rowSelected = (rows) => {
  selectIdList.value = [];
  rows.forEach((item) => {
    selectIdList.value.push(item.shared_id);
    // console.log(item.shared_id);
  });};
//取消分享

const cancelShareIdList = ref([]);

// const saveBatch = async () => {
//   if (selectIdList.value.length === 0) {
//     return;
//   }
//   try {
//     const confirmed  window.confirm("你确定要转存这些文件吗？");
//     return;
//     if (!confirmed) {
//     }
//     for(const shared_id of selectIdList.value){
//       const result = await instance.post('/api/share/save',{
//         shared_id: shared_id,
//         username: userInfo.value.nickName,
//         dir_id: ""
//       })
//       if (!result) {
//         return;
//       }
//     }
//     loadDataList();
//   } catch (error) {
//     console.log(error);
//   }
// };



const dialogVisible = ref(false); // 控制对话框的显示状态
const extractCode = ref(); // 用于存储提取码的变量
const shared_file_id=ref();
const valid_type=ref();
const openDialog = (row) => {
  valid_type.value=row.valid_type;
  shared_file_id.value=row.shared_id;
  if(valid_type.value==2){
    dialogVisible.value = true; // 显示对话框
  }else{
    save();
  }
  // console.log(row.shared_id);
  // console.log(shared_file_id.value);
};
const save = async () => {

  // console.log(shared_file_id.value);
  // console.log(extractCode.value);
  let response =await instance.post('/api/share/save',{
    shared_id: shared_file_id.value,
    username: userInfo.value.nickName,
    dir_id: "",
    code: extractCode.value
  })
  if(!(response.data.status_code==proxy.Status.success)){
    proxy.Message.error("提取码错误");
  }else{
    proxy.Message.success("转存成功");

  }
  dialogVisible.value = false;
};


</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";
.file-list {
  margin-top: 10px;
  .file-item {
    .file-name {
      span {
        &:hover {
          color: #494944;
        }
      }
    }
    .op {
      width: 170px;
    }
  }
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
</style>