<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="btn">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
            <el-button type="primary">
              上传
            </el-button>
          </el-upload>
        </div>
          <el-button color="#626aef" type="danger" @click="downloadFile" :disabled="selectFileIdList.length == 0">
            下载
          </el-button>
          <el-button color="#adff41" type="success" @click="newFolder" v-if="category == 'all'">
            新建文件夹
          </el-button>
          <el-button @click="delFileBatch" type="danger" :disabled="selectFileIdList.length == 0">
            删除
          </el-button>
          <el-button @click="moveFolderBatch" type="warning" :disabled="selectFileIdList.length == 0">
            批量移动
          </el-button>
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
      </div>
      <!--导航-->
      <Navigation ref="navigationRef" @navChange="navChange"></Navigation>
    </div>


    <!-- 这下面的 initFetch 最后要改为 false -->
    <div class="file-list" v-if="tableData.list && tableData.list.length > 0">
      <Table
        ref="dataTableRef"
        :columns="columns"
        :showPagination="true"
        :dataSource="tableData"
        :fetch="loadDataList"
        :initFetch="false"
        :options="tableOptions"
        @rowSelected="rowSelected"
      >
     
        <template #file_name="{ index, row }">
          <div class="file-item" @mouseenter="showOp(row)" @mouseleave="cancelShowOp(row)">
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
            </span>
            <div class="edit-panel" v-if="row.showEdit == true">
              <el-input
                v-model.trim="row.fileNameReal"
                ref="editNameRef"
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
              <template v-if="row.showOp && row.fileId && row.status == 2">
                <template v-if="row.showOp && row.fileId">
                <span class="iconfont icon-share1" 
                @click="share(row)"
                v-if="row.folderType == 0"
                  >分享</span
                >
                <span
                  class="iconfont icon-download"
                  @click="download(row)"
                  v-if="row.folderType == 0"
                  >下载</span
                >
                <span class="iconfont icon-del" @click="delFile(row)"
                  >删除</span
                >
                <span
                  class="iconfont icon-edit"
                  @click.stop="editFileName(index)"
                  >重命名</span
                >
                <span class="iconfont icon-move" @click="moveFolder(row)"
                  >移动</span
                >
                </template>
              </template>
            </span>
          </div>
        </template>
        <template #file_size="{ index, row }">
          <span v-if="row.fileSize >= 0">
            {{ proxy.Utils.size2Str(row.fileSize) }}
          </span>
        </template>
      </Table>
    </div>

    <div class="no-data" v-else>
      <div class="no-data-inner">
        <div class="tips">当前文件夹为空</div>
        <div class="op-list">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
            <div class="op-item">
              <Icon iconName="file" :width="60"></Icon>
              <div>上传文件</div>
            </div>
          </el-upload>
          <div class="op-item" v-if="category == 'all'" @click="newFolder">
            <Icon iconName="folder" :width="60"></Icon>
            <div>新建目录</div>
          </div>
        </div>
      </div>
    </div>
    <!--预览-->
    <Preview ref="previewRef"> </Preview>
    <!--移动-->
    <FolderSelect
      ref="folderSelectRef"
      @folderSelect="moveFolderDone"
    ></FolderSelect>
    <!--分享-->
    <FileShare ref="shareRef"></FileShare>
  </div>
</template>

<script setup>
import CategoryInfo from "@/js/CategoryInfo.js";
import FileShare from "./ShareFile.vue";
import { ref, reactive, getCurrentInstance, nextTick, computed,toRef } from "vue";
import { useRouter, useRoute } from "vue-router";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();
const emit = defineEmits(["addFile"]);
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8848'
});

const currentFolder = ref({user_file_id: ""});
// const currentFolder = ref({fileId: 0});

const userInfo = ref(
  proxy.VueCookies.get("userInfo")
);
//添加文件
const addFile = async (fileData) => {
  emit("addFile", { file: fileData.file, filePid: currentFolder.value.user_file_id });
};


//添加文件回调
const reload = () => {
  showLoading.value = false;
  loadDataList();
};
defineExpose({
  reload,
});


const fileAccept = computed(() => {
  const categoryItem = CategoryInfo[category.value];
  return categoryItem ? categoryItem.accept : "*";
});

//列表
const columns = [
  {
    label: "文件名",
    prop: "file_name",
    scopedSlots: "file_name",
  },
  {
    label: "修改时间",
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

const fileNameFuzzy = ref();
const showLoading = ref(true);
const category = ref();


const loadDataList = async () => {
  console.log(category.value);
  console.log(typeof(category.value));
  try{
    let response = await instance.post('/api/files/list',{
      username: userInfo.value.nickName,
      // dir_id: "",
      dir_id:currentFolder.value.user_file_id,
      // type: "",
      type: pathTypeMap.get(category.value),
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
console.debug("debug"+route.params.myParameter);


// 展示操作按钮
const showOp = (row) => {
  tableData.value.list.forEach((element) => {
    element.showOp = false;
  });
  row.showOp = true;
};

const cancelShowOp = (row) => {
  row.showOp = false;
};

//编辑行
const editing = ref(false);
  const editNameRef = ref();

//新建文件夹
const newFolder = () => {
  if (editing.value) {
    return;
  }

  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });
  editing.value = true;
  tableData.value.list.unshift({
    showEdit: true,
    fileType: 0,
    fileId: "",
    // filePid: currentFolder.value.fileId,
    filePid: currentFolder.value.user_file_id,
    fileName: "",
    // fileNameReal: "nnn",
  });
  console.log(tableData.value.list);
};

const cancelNameEdit = (index) => {
  const fileData = tableData.value.list[index];
  if (fileData.fileId) {
    fileData.showEdit = false;
  } else {
    tableData.value.list.splice(index, 1);
  }
  editing.value = false;
};

const saveNameEdit = async (index) => {
  const { fileId, filePid, fileNameReal,fileSuffix } = tableData.value.list[index];
  if (fileNameReal == "" || fileNameReal.indexOf("/") != -1) {
    proxy.Message.warning("文件名不能为空且不能含有斜杠");
    return;
  }
  
  console.log("fileId: "+fileId);
  console.log("suffix: "+fileSuffix);

  if(fileId == ""){
    let response = await instance.post('/api/files/mkdir',{
      username: userInfo.value.nickName,
      dir_name: fileNameReal,
      dir_id: filePid,
    })
  
  tableData.value.list[index].fileName = fileNameReal;
  tableData.value.list[index].showEdit = false;
  tableData.value.list[index].status = 2;
  tableData.value.list[index].folderType = 1;
  tableData.value.list[index].fileId = response.data.data.user_file_id;
  tableData.value.list[index].user_file_id = response.data.data.user_file_id;
  console.log(tableData.value.list);
  loadDataList();
  }else{
    let response = await instance.get('/api/files/rename',{
      params:{
          user_file_id: fileId,
          new_name: fileNameReal+fileSuffix,
      }
    })
    tableData.value.list[index].fileName = fileNameReal+fileSuffix;
    tableData.value.list[index].showEdit = false;
    // tableData.value.list[index].status = 2;
    tableData.value.list[index].folderType = 0;
    // tableData.value.list[index].fileid = "";
  }
 
  editing.value = false;
};

//编辑文件名
const editFileName = (index) => {
  if (tableData.value.list[0].fileId == "") {
    tableData.value.list.splice(0, 1);
    index = index - 1;
  }
  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });
  let cureentData = tableData.value.list[index];
  cureentData.showEdit = true;

  //编辑文件
  if (cureentData.folderType == 0) {
    cureentData.fileNameReal = cureentData.fileName.substring(
      0,
      cureentData.fileName.indexOf(".")
    );
    cureentData.fileSuffix = cureentData.fileName.substring(
      cureentData.fileName.indexOf(".")
    );
  } else {
    cureentData.fileNameReal = cureentData.fileName;
    cureentData.fileSuffix = "";
  }
  editing.value = true;
  nextTick(() => {
    editNameRef.value.focus();
  });
};

//多选 批量选择
const selectFileIdList = ref([]);
const selectFileList = ref([]);
const rowSelected = (rows) => {
  selectFileList.value = rows;
  console.log("debug:"+selectFileList.value);
  selectFileIdList.value = [];
  rows.forEach((item) => {
    selectFileIdList.value.push(item.user_file_id);
  });
};

//删除文件
const delFile = async (row) => {
  const user_file_id=row.user_file_id;
  try {
    const confirmed = window.confirm("你确定要删除该文件吗?删除的文件可在10天内通过回收站还原");
    if (!confirmed) {
      return;
    }
    const result = await instance.get('/api/files/delete',{
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

//批量删除
const delFileBatch = async () => {
  if (selectFileIdList.value.length === 0) {
    return;
  }
  try {
    const confirmed = window.confirm("你确定要删除这些文件吗?删除的文件可在10天内通过回收站还原");
    if (!confirmed) {
      return;
    }
    for(const user_file_id of selectFileIdList.value){
      const result = await instance.get('/api/files/delete',{
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
//批量下载
const downloadFile = async () => {
  if (selectFileIdList.value.length === 0) {
    return;
  }
  for (const user_file_id of selectFileIdList.value) {
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
      const fileName = dispositionHeader
    ? decodeURIComponent(dispositionHeader.split('filename=')[1].replace(/"/g, ''))
    : 'file';
      downloadLink.href = window.URL.createObjectURL(response.data);
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error) {
      console.log(error);
    }
  }
};

//移动目录
const folderSelectRef = ref();
const currentMoveFile = ref({});

const moveFolder = (data) => {

  currentMoveFile.value = data;
  folderSelectRef.value.showFolderDialog(data.fileId);
};

//批量移动
const moveFolderBatch = () => {
  currentMoveFile.value = {};
  //批量移动如果选择的是文件夹，那么要讲文件夹也过滤
  // const excludeFileIdList = [currentFolder.value.fileId];
  const excludeFileIdList = [currentFolder.value.user_file_id];
  selectFileList.value.forEach((item) => {
    if (item.folderType == 1) {
      excludeFileIdList.push(item.fileId);
    }
  });
  folderSelectRef.value.showFolderDialog(excludeFileIdList.join(","));

};




const moveFolderDone = async (folderId) => {
  if (
    currentMoveFile.value.filePid === folderId ||
    // currentFolder.value.fileId == folderId
    currentFolder.value.user_file_id == folderId
  ) {
    proxy.Message.warning("文件正在当前目录，无需移动");
    return;
  }
  let filedIdsArray = [];
  if (currentMoveFile.value.fileId){
  let response = await instance.post("/api/files/move",{
    username: userInfo.value.nickName,
    user_file_id: currentMoveFile.value.fileId,
    dir_id: folderId,
  })
  }else{
    for(const user_file_id of selectFileIdList.value){
      const response =await instance.post('/api/files/move',{
        username: userInfo.value.nickName,
        user_file_id: user_file_id,
        dir_id: folderId,
      })
    }
  }
  folderSelectRef.value.close();
  console.log(currentFolder.value.user_file_id);
  loadDataList();
};
const pathTypeMap = new Map([
  ['folder',0],
  ['video',1],
  ['music',2],
  ['image',3],
])


const previewRef = ref();
const navigationRef = ref();

const preview = (data) => {
  if (data.folderType == 1) {
    //openFolder(data);
    navigationRef.value.openFolder(data);
    return;
  }else{
    return;
  }
};

//目录
const navChange = (data) => {
  const { curFolder, categoryId } = data;
  currentFolder.value = curFolder;
  showLoading.value = true;
  category.value=categoryId;
  loadDataList();
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


//分享
const shareRef = ref();
const share = (row) => {
  shareRef.value.show(row);
};

</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";


.o{
  color: #adff41;
}
</style>