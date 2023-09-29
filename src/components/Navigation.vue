<template>
  <div class="top-navigation">
    <template v-if="folderList.length > 0">
      <span class="back link" @click="backParent">返回上一级</span>
      <el-divider direction="vertical" />
    </template>
    <span v-if="folderList.length == 0" class="all-file">全部文件</span>
    <!-- <span
      class="link"
      @click="setCurrentFolder(-1)"
      v-if="folderList.length > 0"
      >全部文件
    </span> -->
    <template v-for="(item, index) in folderList">
      <span class="iconfont icon-right"></span>
      <span
        class="link"
        @click="setCurrentFolder(index)"
        v-if="index < folderList.length - 1"
        >
        <!-- {{ item.fileName }} -->
        {{ item.file_name}}
        </span>
      <span v-if="index == folderList.length - 1" class="text">\
      <!-- {{
        item.fileName
      }} -->
      {{
        item.file_name
      }}
      </span>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();
import axios from "axios";
const instance = axios.create({
  baseURL: 'http://localhost:8848'
})
const props = defineProps({
  watchPath: {
    type: Boolean, //是否监听路径变化
    default: true,
  },
  shareId: {
    type: String,
  },
  adminShow: {
    type: Boolean,
    default: false,
  },
});

// const api = {
//   getFolderInfo: "/file/getFolderInfo",
//   getFolderInfo4Share: "/showShare/getFolderInfo",
//   getFolderInfo4Admin: "/admin/getFolderInfo",
// };

//分类
const category = ref();
//目录
const folderList = ref([]);
//当前目录
const currentFolder = ref({ user_file_id: "" });
// const currentFolder = ref({  });
const userInfo = ref(
  proxy.VueCookies.get("userInfo")
);
//初始化
const init = () => {
  folderList.value = [];
  currentFolder.value = { user_file_id: "" };
  doCallback();
};

//点击目录
const openFolder = (data) => {
  const { user_file_id, file_name } = data;
  const folder = {
    file_name: file_name,
    user_file_id: user_file_id,
  };
  // console.log(folder)
  folderList.value.push(folder);
  currentFolder.value = folder;
  console.log(folderList.value);
  console.log(currentFolder.value);
  setPath();
};

defineExpose({ openFolder, init });

//返回上一级
const backParent = () => {
  let currentIndex = null;
  for (let i = 0; i < folderList.value.length; i++) {
    // if (folderList.value[i].fileId == currentFolder.value.fileId) {
    if (folderList.value[i].user_file_id == currentFolder.value.user_file_id) {
      currentIndex = i;
      break;
    }
  }
  console.log("currentIndex： "+currentIndex);
  setCurrentFolder(currentIndex - 1);
};

//点击导航 设置当前目录
const setCurrentFolder = (index) => {
  if (index == -1) {
    //返回全部
    // currentFolder.value = { fileId: "0" };
    currentFolder.value = { user_file_id: "" };
    folderList.value = [];
  } else {
    currentFolder.value = folderList.value[index];
    folderList.value.splice(index + 1, folderList.value.length);
  }
  setPath();
};

//设置URL路径
const setPath = () => {
  if (!props.watchPath) {
    doCallback();
    return;
  }
  let pathArray = [];
  folderList.value.forEach((item) => {
    // pathArray.push(item.fileId);
    pathArray.push(item.user_file_id);
  });
  console.log("pathArray:  "+pathArray);
  router.push({
    path: route.path,
    query:
      pathArray.length == 0
        ? ""
        : {
            path: pathArray.join("/"),
          },
  });
};

//获取当前路径的目录
const getNavigationFolder = async (path) => {


  folderList.value = [];

  let pathArray = path.split('/');
  console.log(pathArray);
const apiUrl = 'http://localhost:8848/api/files/dir';

// 使用 Promise.all 来等待所有请求完成
const requests = pathArray.map(userFileId => {
  return axios.get(apiUrl, {
    params: {
      user_file_id: userFileId
    }
  });
});

Promise.all(requests)
  .then(responses => {
    // const folderList = [];
    responses.forEach((response, index) => {
      console.log(response);
      const f = {
        file_name: response.data.data.file_name,
        user_file_id: pathArray[index], // 使用 pathArray 中的相应元素
      };
      folderList.value.push(f);
    });

    // 此时 folderList 的顺序应该与 pathArray 一致
    // console.log(folderList);
  })
  .catch(error => {
    console.error(error);
  });



  console.log(folderList.value);
  
};

const emit = defineEmits(["navChange"]);
const doCallback = () => {
  emit("navChange", {
    categoryId: category.value,
    curFolder: currentFolder.value,
  });
};

watch(
  () => route,
  (newVal, oldVal) => {
    if (!props.watchPath) {
      return;
    }
    //路由切换到其他路由  首页和管理员查看文件列表页面需要监听
    if (
      newVal.path.indexOf("/main") === -1 &&
      newVal.path.indexOf("/settings/fileList") === -1 &&
      newVal.path.indexOf("/share") === -1
    ) {
      return;
    }
    const path = newVal.query.path;
    console.log("path: "+path);
    const categoryId = newVal.params.category;
    console.log("catagoryId: "+categoryId);
    category.value = categoryId;
    if (path == undefined) {
      init();
    } else {
      getNavigationFolder(path);
      //设置当前目录
      let pathArray = path.split("/");
      currentFolder.value = {
        // fileId: pathArray[pathArray.length - 1],
        user_file_id: pathArray[pathArray.length - 1],
      };
      doCallback();
    }
  },
  { immediate: true, deep: true }
);
</script>




<style lang="scss" scoped>
.top-navigation {
  font-size: 13px;
  display: flex;
  align-items: center;
  line-height: 40px;
  .all-file {
    font-weight: bold;
  }
  .link {
    color: #06a7ff;
    cursor: pointer;
  }
  .icon-right {
    color: #06a7ff;
    padding: 0px 5px;
    font-size: 13px;
  }
}
</style>