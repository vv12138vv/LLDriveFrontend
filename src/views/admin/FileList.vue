<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="search-panel">
          <el-input
            clearable
            placeholder="输入文件名搜索"
            v-model="fileNameFuzzy"
            @keyup.enter="search"
          >
            <template #suffix>
              <i class="iconfont icon-search" @click="search"></i>
            </template>
          </el-input>
        </div>
        <div class="iconfont icon-refresh" @click="loadDataList"></div>
        <el-button
          :style="{ 'margin-left': '10px' }"
          type="danger"
          :disabled="selectFileIdList.length == 0"
          @click="delFileBatch"
        >
          <span class="iconfont icon-del"></span>
          批量删除
        </el-button>
      </div>
      <!--导航-->
      <Navigation
        ref="navigationRef"
        @navChange="navChange"
        :adminShow="true"
      ></Navigation>
    </div>
    <div class="file-list">
      <Table
        :columns="columns"
        :showPagination="true"
        :dataSource="tableData"
        :fetch="loadDataList"
        :initFetch="false"
        :options="tableOptions"
        @rowSelected="rowSelected"
      >
        <template #fileName="{ index, row }">
          <div
            class="file-item"
            @mouseenter="showOp(row)"
            @mouseleave="cancelShowOp(row)"
          >
            <template
              v-if="(row.fileType == 3 || row.fileType == 1) && row.status == 3"
            >
              <icon :cover="row.fileCover" :width="32"></icon>
            </template>
            <template v-else>
              <icon v-if="row.folderType == 0" :fileType="row.fileType"></icon>
              <icon v-if="row.folderType == 1" :fileType="0"></icon>
            </template>
            <span class="file-name" v-if="!row.showEdit" :title="row.fileName">
              <span @click="preview(row)">{{ row.fileName }}</span>
              <span v-if="row.status == 0" class="transfer-status">转码中</span>
              <span v-if="row.status == 1" class="transfer-status transfer-fail"
                >转码失败</span
              >
            </span>
            <div class="edit-panel" v-if="row.showEdit">
              <el-input
                v-model.trim="row.fileNameReal"
                :maxLength="190"
                @keyup.enter="saveNameEdit(index)"
              >
                <template #suffix>{{ row.fileSuffix }}</template>
              </el-input>
              <span
                :class="[
                  'iconfont icon-right1',
                  row.fileNameReal ? '' : 'not-allow',
                ]"
                @click="saveNameEdit(index)"
              ></span>
              <span
                class="iconfont icon-error"
                @click="cancelNameEdit(index)"
              ></span>
            </div>
            <span class="op">
              <template v-if="row.showOp && row.fileId">
                <span
                  class="iconfont icon-download"
                  @click="download(row)"
                  v-if="row.folderType == 0"
                  >下载</span
                >
                <span class="iconfont icon-del" @click="delFile(row)"
                  >删除</span
                >
              </template>
            </span>
          </div>
        </template>
        <template #fileSize="{ index, row }">
          <span v-if="row.fileSize">
            {{ proxy.Utils.size2Str(row.fileSize) }}</span
          >
        </template>
      </Table>
    </div>
    <!--预览-->
    <Preview ref="previewRef"> </Preview>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, computed } from "vue";
const { proxy } = getCurrentInstance();
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8848'
});

const api = {
  loadDataList: "/admin/loadFileList",
  delFile: "/admin/delFile",
  createDownloadUrl: "/admin/createDownloadUrl",
  download: "/api/admin/download",
};

//列表
const columns = [
  {
    label: "文件名",
    prop: "fileName",
    scopedSlots: "fileName",
  },
  {
    label: "发布人",
    prop: "nickName",
    width: 250,
  },
  {
    label: "修改时间",
    prop: "lastUpdateTime",
    width: 200,
  },
  {
    label: "大小",
    prop: "fileSize",
    scopedSlots: "fileSize",
    width: 200,
  },
];
//搜索
const search = () => {
  showLoading.value = true;
  loadDataList();
};
//列表
const tableData = ref({page_no: 1,page_size: 15});
const tableOptions = {
  extHeight: 50,
  selectType: "checkbox",
};

//多选 批量选择
const selectFileIdList = ref([]);
const rowSelected = (rows) => {
  selectFileIdList.value = [];
  rows.forEach((item) => {
    selectFileIdList.value.push(item.user_file_id);
  });
  console.log(selectFileIdList);
};

const fileNameFuzzy = ref();
const showLoading = ref(true);


const loadDataList = async () => {
  try{
    let response = await instance.post('/api/files/admin-list',{
      file_name: fileNameFuzzy.value,
      page_no: tableData.value.page_no,
      page_size: tableData.value.page_size
    })  
    if(response.data.status_code==proxy.Status.success){
      const p = response.data.data;
      p.list.forEach((element)=>{
        element.fileName = element.file_name;
        element.folderType = element.is_dir == true ? 1:0;
        element.fileType = element.type;
        //下面解注释使文件预览,该页面中status为2时为预览
        element.status = 2;
        element.fileSize = element.size;
        element.fileId = element.user_file_id;
        element.fileCover = element.file_name;
        element.lastUpdateTime=element.update_time;
        element.nickName=element.username;
        // element.showOp = true;
        // element.fileCover = 
        
      })
      // tableData.value = response.data.data;
      tableData.value = p;
      // console.log(p);
      // console.log(tableData.value.data);
      editing.value = false;
    }
  }catch(error){
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

const previewRef = ref();
const navigationRef = ref();
const preview = (data) => {
  if (data.folderType == 1) {
    navigationRef.value.openFolder(data);
    return;
  }
  if (data.status != 2) {
    proxy.Message.warning("文件正在转码中，无法预览");
    return;
  }
  previewRef.value.showPreview(data, 1);
};

//目录
const currentFolder = ref({ fileId: 0 });
const navChange = (data) => {
  const { curFolder } = data;
  currentFolder.value = curFolder;
  showLoading.value = true;
  loadDataList();
};

//删除文件
const delFile = async (row) => {
  const user_file_id=row.user_file_id;
  try {
    const confirmed = window.confirm("你确定要删除该文件吗?");
    if (!confirmed) {
      return;
    }
    const result = await instance.get('/api/files/admin-delete',{
      params: {
        user_file_id: user_file_id,
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
//批量删除
const delFileBatch = async () => {
  if (selectFileIdList.value.length === 0) {
    return;
  }
  try {
    const confirmed = window.confirm("你确定要删除这些文件吗?");
    if (!confirmed) {
      return;
    }
    for(const user_file_id of selectFileIdList.value){
      const result = await instance.get('/api/files/admin-delete',{
        params: {
          user_file_id: user_file_id,
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

//下载文件
const download = async (row) => {
  const user_file_id=row.user_file_id;
  try {
      console.log(user_file_id);
      const response = await instance.get('/api/transfers/download', {
        params: {
          user_file_id: user_file_id,
        },
        responseType: 'blob',
      });
      console.log(response);
      const downloadLink = document.createElement('a');
      const dispositionHeader = response.headers['content-disposition'];
      // const fileName = dispositionHeader
      //   ? dispositionHeader.split('filename=')[1].replace(/"/g, '')
      //   : 'file';
      const fileName = dispositionHeader
    ? decodeURIComponent(dispositionHeader.split('filename=')[1].replace(/"/g, ''))
    : 'file';
      downloadLink.href = window.URL.createObjectURL(response.data);
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error) {
      console.log(error);
    }
};

</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";
.search-panel {
  margin-left: 0px !important;
}
.file-list {
  margin-top: 10px;
  .file-item {
    .op {
      width: 120px;
    }
  }
}
</style>