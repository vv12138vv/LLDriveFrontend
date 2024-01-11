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
        label-width="80px"
        @submit.prevent
      >
        <el-form-item label="原密码" prop="oriPassword" >
          <el-input 
          type="password"
          size="large"
          placeholder="请输入原始密码" 
          v-model.trim="formData.oriPassword"
          show-password
          >
            <template #prefix>
                <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword" >
          <el-input 
          type="password"
          size="large"
          placeholder="请输入新密码" 
          v-model.trim="formData.newPassword"
          show-password
          >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
          </el-input>
        </el-form-item>
      </el-form>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from "vue"
const { proxy } = getCurrentInstance();
import axios from 'axios';

const instance = axios.create({
  baseURL: "http://localhost:8848"
})



const formData = ref({});
const formDataRef = ref();
const rules = {
  oriPassword: [{ required: true, message: "请输入原始密码" },
  // { validator: proxy.Verify.password , message:"密码只能是数字、字母、特殊字符,8-18位"},
],

  newPassword: [{ required: true, message : "请输入新密码"},
  { validator: proxy.Verify.password , message:"密码只能是数字、字母、特殊字符,8-18位"},
],

};



const dialogConfig = ref({
  show: false,
  title: "修改密码",
  buttons: [
   {
    type: "primary",
    text: "确定",
    click: (e) => {
      submitForm();
    },
  },
 ],
});


const show =()=>{
  dialogConfig.value.show = true;
  nextTick( ()=>{
    formDataRef.value.resetFields();
    formData.value = {};
  });
};

defineExpose({show});

const userInfo = ref(
  proxy.VueCookies.get("userInfo")
);


const submitForm = async()=>{
  formDataRef.value.validate(async(valid)=>{
    if(!valid){
      return;
    }
    try {
        const response = await instance.post('/api/users/change-password', {
          password: formData.value.oriPassword,
          email: userInfo.value.email,
        });
        console.log(response);
        const status_code = response.data.status_code;
        if(status_code == proxy.Status.incorrect_password){
          proxy.Message.error("原始密码错误，修改失败");
        }
        else if(status_code == proxy.Status.success){
          const response2 = await instance.post('/api/users/set-new-password',{
            email: userInfo.value.email,
            new_password: formData.value.newPassword,
          })
          console.log(response2);
          proxy.Message.success("密码修改成功");
          dialogConfig.value.show = false;
        }
      } catch (error) {
        console.log(error);
      }


  });
}

</script>

<style lang="scss" scoped>
</style>