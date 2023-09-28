<template>
  <div>
    <div class="top">
      <el-button type="success" :disabled="selectFileIdList.length == 0" @click="revertBatch">
        <span class="iconfont icon-revert"></span>还原
      </el-button>
      <el-button type="danger" :disabled="selectFileIdList.length == 0" @click="delBatch">
        <span class="iconfont icon-del"></span>删除
      </el-button>
    </div>

    <div class="file-list">
      <Table :columns="columns" :showPagination="true" :dataSource="tableData" :fetch="loadDataList"
        :options="tableOptions" @rowSelected="rowSelected">
        <template #file_name="{ index, row }">
          <div class="file-item" @mouseenter="showOp(row)" @mouseleave="cancelShowOp(row)">
            <!-- 下面行为预览展示框 -->
            <template v-if="(row.fileType == 3 || row.fileType == 1) && row.status !== 0">
              <icon :cover="row.fileCover"></icon>
            </template>
            <!-- 下面template为图标 -->
            <template v-else>
              <icon v-if="row.folderType == 0" :fileType="row.fileType"></icon>
              <icon v-if="row.folderType == 1" :fileType="0"></icon>
            </template>
            <span class="file-name" :title="row.fileName">
              <span>{{ row.fileName }}</span>
            </span>
            <span class="op">
              <template v-if="row.showOp && row.fileId">
                <span class="iconfont icon-revert" @click="revert(row)">还原</span>
                <span class="iconfont icon-del" @click="delFile(row)">删除</span>
              </template>
            </span>
          </div>
        </template>
        <template #file_size="{ index, row }">
          <span v-if="row.fileSize > 0">
            {{ proxy.Utils.size2Str(row.fileSize) }}</span>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();
import axios from 'axios';
// const api = {
//   loadDataList: "/recycle/loadRecycleList",
//   delFile: "/recycle/delFile",
//   recoverFile: "/recycle/recoverFile",
// };

const instance = axios.create({
  baseURL: "http://localhost:8848"
})
const userInfo = ref(
  proxy.VueCookies.get("userInfo")
);

//列表
const columns = [
  {
    label: "文件名",
    prop: "file_name",
    scopedSlots: "file_name",
  },
  {
    label: "删除时间",
    prop: "update_time",
    width: 200,
  },
  {
    label: "大小",
    prop: "size",
    scopedSlots: "file_size",
    width: 200,
  },
];
//列表
// const tableData = ref({});
const tableData = ref({ page_no: 1, page_size: 15 });
const tableOptions = {
  extHeight: 20,
  selectType: "checkbox",
};
// const loadDataList = async () => {
//   let params = {
//     pageNo: tableData.value.pageNo,
//     pageSize: tableData.value.pageSize,
//   };
//   if (params.category !== "all") {
//     delete params.filePid;
//   }
//   let result = await proxy.Request({
//     url: api.loadDataList,
//     params,
//   });
//   if (!result) {
//     return;
//   }
//   tableData.value = result.data;
// };

const loadDataList = async () => {
  console.log("recycle.vue: call loadDataList");
  try {
    let response = await instance.post('/api/files/list/recycle', {
      username: userInfo.value.nickName,
      // page_no: 1,
      // page_size: 15
      page_no: tableData.value.page_no,
      page_size: tableData.value.page_size
    })
    if (response.data.status_code == proxy.Status.success) {
      const p = response.data.data;
      p.list.forEach((element) => {
        element.fileName = element.file_name;
        element.folderType = element.is_dir == true ? 1 : 0;
        element.fileType = element.type;
        //下面解注释使文件预览
        element.status = 0;
        element.fileSize = element.size;
        // element.showOp = true;
        element.fileId = element.user_file_id;

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

const selectFileIdList = ref([]);
const rowSelected = (rows) => {
  selectFileIdList.value = [];
  rows.forEach((item) => {
    selectFileIdList.value.push(item.user_file_id);
  });
};

//恢复
const revert = async (row) => {
  const user_file_id=row.user_file_id;
  try {
    const confirmed = window.confirm("你确定要还原该文件吗？");
    if (!confirmed) {
      return;
    }
    const result = await instance.get('/api/files/recover', {
      params: {
        user_file_id: user_file_id,
        username: userInfo.value.nickName
      }
    })
    if (!result) {
      return;
    }
    loadDataList();
  } catch (error) {
    console.log(error);
  }
};


const revertBatch = async () => {
  if (selectFileIdList.value.length === 0) {
    return;
  }
  try {
    const confirmed = window.confirm("你确定要还原这些文件吗？");
    if (!confirmed) {
      return;
    }
    for (const user_file_id of selectFileIdList.value) {
      const result = await instance.get('/api/files/recover', {
        params: {
          user_file_id: user_file_id,
          username: userInfo.value.nickName
        }
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


//删除文件
const emit = defineEmits(["reload"]);
const delFile = async (row) => {
  const user_file_id=row.user_file_id;
  try {
    const confirmed = window.confirm("你确定要彻底删除该文件吗？该操作无法复原。");
    if (!confirmed) {
      return;
    }
    const result = await instance.get('/api/files/recycle/delete', {
      params: {
        user_file_id: user_file_id,
        username: userInfo.value.nickName
      }
    })
    if (!result) {
      return;
    }
    loadDataList();
  } catch (error) {
    console.log(error);
  }
};

const delBatch = async () => {
  if (selectFileIdList.value.length === 0) {
    return;
  }
  try {
    const confirmed = window.confirm("你确定要彻底删除这些文件吗？该操作无法复原。");
    if (!confirmed) {
      return;
    }
    for (const user_file_id of selectFileIdList.value) {
      const result = await instance.get('/api/files/recycle/delete', {
        params: {
          user_file_id: user_file_id,
          username: userInfo.value.nickName
        }
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
</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";

.file-list {
  margin-top: 10px;

  .file-item {
    .op {
      width: 120px;
    }
  }
}
</style>