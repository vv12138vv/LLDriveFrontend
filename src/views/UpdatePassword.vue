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

// const api = {
//   updatePassword: "updatePassword",
// }


// const checkRePassword = (rule , value , callback)=>{
//   if(value!==formData.value.password){
//     callback(new Error(rule.message));
//   }else{
//     callback();
//   }
// }

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




const submitForm = async()=>{
  formDataRef.value.validate(async(valid)=>{
    if(!valid){
      return;
    }
    try {
        const response = await instance.post('/api/users/register', {
          username: formData.value.nickName,
          password: formData.value.registerPassword,
          email: formData.value.email,
          code: formData.value.emailCode,
        });
        console.log(response);
        const status_code = response.data.status_code;
        if(status_code === 5000){
          proxy.Message.success("注册成功");
          showPanel(1);
        }else if(status_code === 4001){
          proxy.Message.error("邮箱已存在，注册失败");
        }
        else if(status_code == 4006){
          proxy.Message.error("邮箱验证码错误");
        }
      } catch (error) {
        console.log(error);
      }





    // let result = await prroxy.Request({
    //   url:api.updatePassword,
    //   params:{
    //     password: formData.value.password,
    //   },
    // });
    // if(!result){
    //   return;
    // }
    // dialogConfig.value.show = false;
    // proxy.Message.success("密码修改成功");
  });
}

</script>

<style lang="scss" scoped>
</style>