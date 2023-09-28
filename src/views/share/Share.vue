<template>
  <div>
    <div class="top">
      <el-button
        type="primary"
        :disabled="selectIdList.length == 0"
        @click="saveBatch"
      >
        <span class="iconfont icon-share1"></span>保存到我的网盘
      </el-button>
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
                (row.fileType == 3 || row.fileType == 1) && row.status !== 0
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
                <span class="iconfont icon-link" @click="copy(row)"
                  >复制链接</span
                >
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
})

// const api = {
//   loadDataList: "/share/loadShareList",
//   cancelShare: "/share/cancelShare",
// };

// const shareUrl = ref(document.location.origin + "/share/");

//列表
const columns = [
  {
    label: "文件名",
    prop: "file_name",
    scopedSlots: "file_name",
  },
  {
    label: "分享时间",
    prop: "share_time",
    width: 200,
  },
  {
    label: "失效时间",
    prop: "expire_time",
    scopedSlots: "expire_time",
    width: 200,
  },
  {
    label: "分享次数",
    prop: "shared_count",
    width: 200,
  },
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
        element.status = 0;
        element.fileSize = element.size;
        element.expireTime=element.expire_time;
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
  });
};

//取消分享
const cancelShareIdList = ref([]);
// const cancelShareBatch = () => {
//   if (selectIdList.value.length == 0) {
//     return;
//   }
//   cancelShareIdList.value = selectIdList.value;
//   cancelShareDone();
// };
const saveBatch = async () => {
  if (selectIdList.value.length === 0) {
    return;
  }
  try {
    const confirmed = window.confirm("你确定要转存这些文件吗？");
    if (!confirmed) {
      return;
    }
    for(const shared_id of selectIdList.value){
      const result = await instance.post('/api/share/save',{
        shared_id: shared_id,
        username: userInfo.value.nickName,
        dir_id: ""
      })
      if (!result) {
        return;
      }
    }
    loadDataList();
  } catch (error) {
    console.log(error);
  }
};

// const cancelShare = (row) => {
//   cancelShareIdList.value = [row.shareId];
//   cancelShareDone();
// };

const cancelShareDone = async () => {
  proxy.Confirm(`你确定要取消分享吗？`, async () => {
    let result = await proxy.Request({
      url: api.cancelShare,
      params: {
        shareIds: cancelShareIdList.value.join(","),
      },
    });
    if (!result) {
      return;
    }
    proxy.Message.success("取消分享成功");
    loadDataList();
  });
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
</style>