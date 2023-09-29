<template>
    <div>
      <Dialog
        :show="dialogConfig.show"
        :title="dialogConfig.title"
        :buttons="dialogConfig.buttons"
        width="600px"
        :showCancel="false"
        @close="dialogConfig.show = false"
      >
        <el-form
          :model="formData"
          :rules="rules"
          ref="formDataRef"
          label-width="100px"
          @submit.prevent
        >
          <el-form-item label="文件"> {{ formData.fileName }} </el-form-item>
          <template v-if="showType == 0">
            <el-form-item label="有效期" prop="validType">
              <el-radio-group v-model="formData.validType">
                <el-radio :label="0">5分钟</el-radio>
                <el-radio :label="1">2小时</el-radio>
                <el-radio :label="2">1天</el-radio>
                <el-radio :label="3">7天</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="提取码" prop="codeType">
              <el-radio-group v-model="formData.codeType">
                <el-radio :label="0">自定义</el-radio>
                <!-- <el-radio :label="1">系统生成</el-radio> -->
              </el-radio-group>
            </el-form-item>
            <el-form-item prop="code" v-if="formData.codeType == 0">
              <el-input
                clearable
                placeholder="请输入6位提取码"
                v-model.trim="formData.code"
                maxLength="6"
                :style="{ width: '130px' }"
              ></el-input>
            </el-form-item>
          </template>
          <template v-else>
            <!-- <el-form-item label="分享连接">
              {{ shareUrl }}{{ resultInfo.shareId }}
            </el-form-item> -->
            <el-form-item label="提取码">
              {{ resultInfo.code }}
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="copy">复制提取码</el-button>
            </el-form-item>
          </template>
        </el-form>
      </Dialog>
    </div>
  </template>
  
  <script setup>
  import useClipboard from "vue-clipboard3";
  const { toClipboard } = useClipboard();
  import { ref, getCurrentInstance, nextTick } from "vue";
  const { proxy } = getCurrentInstance();
  import axios from "axios";
  
  // const shareUrl = ref(document.location.origin + "/share/");
  const instance = axios.create({
    baseURL: 'http://localhost:8848'
  })
  
  // const api = {
  //   shareFile: "/share/shareFile",
  // };
  const showType = ref(0);
  const formData = ref({});
  const formDataRef = ref();
  const rules = {
    validType: [{ required: true, message: "请选择有效期" }],
    codeType: [{ required: true, message: "请选择提取码类型" }],
    code: [
      { required: true, message: "请输入提取码" },
      // { validator: proxy.Verify.shareCode, message: "提取码只能是数字字母" },
      { min: 6, message: "提取码最少6位" },
    ],
  };

  
  const showCancel = ref(false);
  const dialogConfig = ref({
    show: false,
    title: "分享",
    buttons: [
      {
        type: "primary",
        text: "确定",
        click: (e) => {
          share();
        },
      },
    ],
  });
  
  const resultInfo = ref({});
  const share = async () => {
    if (Object.keys(resultInfo.value).length != 0) {
      dialogConfig.value.show = false;
      return;
    }
    console.log(formData.value);

    //   showType.value = 1;
    //   resultInfo.value = result.data;
    //   dialogConfig.value.buttons[0].text = "关闭";
    //   showCancel.value = false;
    // });
    let expireTime = 0;
    switch(formData.value.validType){
      case(0):
        expireTime=5;
        break;
      case(1):
        expireTime=120;
        break;
      case(2):
        expireTime=1440;
        break;
      case(3):
        expireTime=10080;
        break;
    }
    try{
      let response = await instance.post('/api/share',{
        user_file_id: formData.value.user_file_id,
        code: formData.value.code,
        expire_time: expireTime,
      })
      if(response.data.status_code != proxy.Status.success){
        return;
      }
      showType.value=1;
      dialogConfig.value.buttons[0].text = "关闭";
      showCancel.value = false;
      resultInfo.value.code=response.data.data.code;
    }catch(error){
      console.log(error);
    }
  };
  
  const show = (data) => {
    showCancel.value = true;
    dialogConfig.value.show = true;
    showType.value = 0;//用于判断两个页面,分享输入页面和结果展示页面
    resultInfo.value = {};
    nextTick(() => {
      formDataRef.value.resetFields();
      formData.value = Object.assign({}, data);
    });
  };
  
  defineExpose({ show });
  
  const copy = async () => {
    await toClipboard(
      // `链接:${shareUrl.value}${resultInfo.value.shareId} 提取码: ${resultInfo.value.code}`
      `${resultInfo.value.code}`
    );
    proxy.Message.success("复制成功");
  };
  </script>
  
  <style lang="scss" scoped>
  </style>
  