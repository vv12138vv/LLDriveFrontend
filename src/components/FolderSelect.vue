<template>
  <div>
    <Dialog
      :show="dialogConfig.show"
      :title="dialogConfig.title"
      :buttons="dialogConfig.buttons"
      width="600px"
      :showCancel="false"
      @close="close"
    >
      <div class="navigation-panel">
        <Navigation
          ref="navigationRef"
          @navChange="navChange"
          :watchPath="false"
        ></Navigation>
      </div>
      <div class="folder-list" v-if="folderList.length > 0">
        <div
          class="folder-item"
          v-for="item in folderList"
          @click="selectFolder(item)"
        >
          <icon :fileType="0"></icon>
          <!-- <span class="file-name">{{ item.fileName }}</span> -->
          <span class="file-name">{{ item.file_name }}</span>
        </div>
      </div>
      <div v-else class="tips">
        移动到 <span>{{ currentFolder.file_name }}</span> 文件夹
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();

const api = {
  loadAllFolder: "/file/loadAllFolder",
};

const dialogConfig = ref({
  show: false,
  title: "移动到",
  buttons: [
    {
      type: "primary",
      click: () => {
        folderSelect();
      },
      text: "移动到此",
    },
  ],
});

//父级ID
// const filePid = {value: 2};
const filePid = ref("");
const currentFileIds = ref({});
const folderList = ref([]);
const currentFolder = ref({});
import axios from "axios";
const instance = axios.create({
  baseURL: 'http://localhost:8848'
})


const userInfo = ref(
  proxy.VueCookies.get("userInfo")
);

const loadAllFolder = async () => {
  // let result = await proxy.Request({
  //   url: api.loadAllFolder,
  //   params: {
  //     filePid: filePid.value,
  //     currentFileIds: currentFileIds.value,
  //   },
  // });
  // if (!result) {
  //   return;
  // }

  let filename =  "";
  if(filePid.value != ""){

  const response1 = await instance.get('/api/files/dir',{
    params:{
      user_file_id: filePid.value,
    }
  })
   filename =  response1.data.data.file_name;
}
console.log("fpid:  "+filePid.value);
console.log("filename:  "+filename);
  let response2 = await instance.post('/api/files/list',{
      username: userInfo.value.nickName,
      dir_id: filePid.value,
      type: 0,
      // file_name: filename,
      page_no: 1,
      page_size: 15
    })
   const folderarray = []; 
   console.log(response2.data.data.list);
   response2.data.data.list.forEach((i)=>{
    if(i.is_dir && i.dir_id == filePid.value){
      folderarray.push(i);
    }
   });

  folderList.value = folderarray;
};

const close = () => {
  dialogConfig.value.show = false;
};

//展示弹出框对外的方法
const showFolderDialog = (currentFolder) => {
  dialogConfig.value.show = true;
  currentFileIds.value = currentFolder;
  // filePid.value = "0";
  filePid.value = "";
  nextTick(() => {
    navigationRef.value.init();
  });
};

defineExpose({
  showFolderDialog,
  close,
});
//选择目录
const navigationRef = ref();
const selectFolder = (data) => {
  navigationRef.value.openFolder(data);
};

const emit = defineEmits(["folderSelect"]);
const folderSelect = () => {
  emit("folderSelect", filePid.value);
};

//导航改变回调
const navChange = (data) => {
  const { curFolder } = data;
  currentFolder.value = curFolder;
  console.log(curFolder);
  // filePid.value = curFolder.fileId;
  filePid.value = curFolder.user_file_id;
  console.log(data);
  loadAllFolder();
};
</script>



<style lang="scss" scoped>
.navigation-panel {
  padding-left: 10px;
  background: #f1f1f1;
}
.folder-list {
  .folder-item {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 10px;
    .file-name {
      display: inline-block;
      margin-left: 10px;
    }
    &:hover {
      background: #f8f8f8;
    }
  }
  max-height: calc(100vh - 200px);
  min-height: 200px;
}
.tips {
  text-align: center;
  line-height: 200px;
  span {
    color: #06a7ff;
  }
}
</style>