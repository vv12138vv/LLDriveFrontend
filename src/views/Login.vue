<template>
  <div class="login-body">
    <div class="bg"></div>
    <!-- 登录框 -->
    <div class="login-panel">
      <el-form class="login-register" :model="formData" :rules="rules" ref="formDataRef" @submit.prevent>
        <div class="login-title">蓝鲤网盘</div>

        <!-- 游客访问 -->
        <div v-if="opType == 1">
          <el-form-item>
            <el-button type="primary" round="true" @click="asVisitor">以游客身份访问</el-button>
          </el-form-item>
        </div>

        <!--输入电子邮箱-->
        <el-form-item prop="email">
          <el-input size="large" clearable placeholder="请输入电子邮箱地址" v-model="formData.email" maxLength="150">
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!--输入登录密码-->
        <el-form-item label="" prop="password" v-if="opType == 1">
          <el-input size="large" type="password" clearable placeholder="请输入密码" v-model.trim="formData.password"
            maxLength="150" show-password>
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>


        <!-- 注册或者重置密码时 -->
        <div v-if="opType == 0 || opType == 2">
          <!--邮箱验证码-->
          <el-form-item label="" prop="emailCode">
            <div class="send-email-panel">
              <el-input size="large" placeholder="请输入电子邮箱验证码" v-model.trim="formData.emailCode">
                <template #prefix>
                  <el-icon>
                    <CircleCheck />
                  </el-icon>
                </template>
              </el-input>
              <el-button class="send-mail-btn" type="primary" size="large" v-if="opType == 0" round
                @click="sendEmailCode0">
                获取验证码
              </el-button>
              <el-button class="send-mail-btn" type="primary" size="large" v-if="opType == 2" round
                @click="sendEmailCode2">
                获取验证码
              </el-button>
            </div>

          </el-form-item>

          <!-- 昵称 -->
          <el-form-item label="" prop="nickName" v-if="opType == 0">
            <el-input size="large" placeholder="请输入昵称" v-model.trim="formData.nickName" maxLength="20">
              <template #prefix>
                <el-icon>
                  <User />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>


          <!--注册密码、找回密码-->
          <el-form-item prop="registerPassword">
            <el-input type="password" size="large" placeholder="请输入密码" v-model.trim="formData.registerPassword"
              show-password>
              <template #prefix>
                <el-icon>
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <!-- 重复密码 -->
          <el-form-item prop="reRegisterPassword">
            <el-input type="password" size="large" placeholder="请确认密码" v-model.trim="formData.reRegisterPassword"
              show-password>
              <template #prefix>
                <el-icon>
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

        </div>



        <!--输入验证码-->
        <el-form-item prop="checkCode">
          <div class="check-code-panel">
            <el-input size="large" clearable placeholder="请输入验证码" v-model.trim="formData.checkCode"
              @keyup.enter="doSubmit">
              <template #prefix>
                <el-icon>
                  <CircleCheck />
                </el-icon>
              </template>
            </el-input>
            <!-- 验证码 -->
            <div height="44px">
              <checkCode ref="checkCodeRef"></checkCode>
            </div>
          </div>
        </el-form-item>

        <!-- 登录 -->
        <el-form-item v-if="opType == 1">

          <div class="no-account">
            <a href="javascript:void(0)" class="a-link" @click="showPanel(2)">
              忘记密码？</a>
            <a href="javascript:void(0)" class="a-link" @click="showPanel(0)">
              没有账号</a>
          </div>
        </el-form-item>

        <!-- 找回密码 -->
        <el-form-item v-if="opType == 2">
          <a href="javascript:void(0)" class="a-link" @click="showPanel(1)">
            去登录</a>
        </el-form-item>


        <el-form-item v-if="opType == 0">
          <a href="javascript:void(0)" class="a-link" @click="showPanel(1)">
            已有账号</a>
        </el-form-item>



        <!--登录按钮-->
        <el-form-item label="" prop="">
          <el-button type="primary" class="op-btn" size="large" round @click="doSubmit">
            <span v-if="opType == 0">注册</span>
            <span v-if="opType == 1">登录</span>
            <span v-if="opType == 2">重置密码</span>
          </el-button>
        </el-form-item>



      </el-form>
    </div>



  </div>
</template>



<script setup>

import { useRouter, useRoute } from "vue-router";
import md5 from "js-md5";
import axios from 'axios';
const instance = axios.create({
  baseURL: "http://localhost:8848"
})

const router = useRouter();
const route = useRoute();

import { ref, reactive, getCurrentInstance, nextTick, onMounted } from "vue"
const { proxy } = getCurrentInstance();

import checkCode from "../components/checkCode.vue";



//检查确认密码是否与上一次输入密码一致
const checkRePassword = (rule, value, callback) => {
  if (value !== formData.value.registerPassword) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
}



const checkCheckCode = (rule, value, callback) => {
  const codeList = checkCodeRef.value.codeList;
  const joinedCodes = codeList.map(item => item.code).join('').toLowerCase(); // 转换为小写

  if (value.toLowerCase() !== joinedCodes) { // 将输入的验证码值也转换为小写进行比较
    callback(new Error(rule.message));
  } else {
    callback();
  }
};


const formData = ref({});
const formDataRef = ref(formData.value);
const rules = {
  // title: [{ required: true, message: "请输入内容" }],
  email: [{ required: true, message: "请输入邮箱" },
  { validator: proxy.Verify.email, message: "请输入正确的邮箱" },
  ],
  password: [{ required: true, message: "请输入密码" }],
  emailCode: [{ required: true, message: "请输入邮箱验证码" }],
  nickName: [{ required: true, message: "请输入用户名" }],
  registerPassword: [{ required: true, message: "请输入密码" },
  { validator: proxy.Verify.password, message: "密码只能是数字、字母、特殊字符,8-18位" },
  ],
  reRegisterPassword: [{ required: true, message: "请再次输入密码" },
  { validator: checkRePassword, message: "与前一次密码不一致" },
  ],

  checkCode: [{ required: true, message: "请输入验证码" },
  { validator: checkCheckCode, message: "验证码错误" }],
};



//操作类型；0：注册   1：登录    2：重置密码
const opType = ref(1); //一开始默认登录界面
const showPanel = (type) => {
  opType.value = type;
  resetForm();
}

onMounted(() => {
  showPanel(1);
})





components: {
  checkCode
}

const asVisitor = () => {
  router.push('/visitors');
}



//发送邮箱验证码(注册)
const sendEmailCode0 = () => {
  formDataRef.value.validateField("email", async (valid) => {
    if (!valid) {
      return;
    }
    instance.get('/api/users/register', {
      params: {
        // email:formData.email
        email: formData.value.email
      }
    })
      .then(function (response) {
        console.log(response);
        const status_code = response.data.status_code;
        if (status_code === proxy.Status.email_exist) {
          proxy.Message.error("邮箱已存在，注册失败");
        }
        else {
          proxy.Message.success("验证码发送成功");
        }
      }
      )
      .catch(function (error) {
        console.log(error);
      })
  });
}


//发送邮箱验证码(重置密码)
const sendEmailCode2 = () => {
  formDataRef.value.validateField("email", async (valid) => {
    if (!valid) {
      return;
    }
    instance.get('/api/users/reset-password', {
      params: {
        // email:formData.email
        email: formData.value.email
      }
    })
      .then(function (response) {
        console.log(response);
        // const status_code = response.data.status_code;

        proxy.Message.success("验证码发送成功");
      }
      )
      .catch(function (error) {
        console.log(error);
      })
  });
}





//验证码引用
const checkCodeRef = ref();

//重置表单
const resetForm = () => {
  //刷新验证码
  if (checkCodeRef.value) {
    checkCodeRef.value.refreshCode();
  }
  //重置表单
  formDataRef.value.resetFields();
  formData.value = {};
  //登录情况下
  if (opType.value == 1) {
    const cookieLoginInfo = proxy.VueCookies.get("loginInfo");
    if (cookieLoginInfo) {
      formData.value = cookieLoginInfo;
    }
  }

}



const doSubmit = async () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    if (opType.value == 0) {
      // 注册
      try {
        const response = await instance.post('/api/users/register', {
          username: formData.value.nickName,
          password: formData.value.registerPassword,
          email: formData.value.email,
          code: formData.value.emailCode,
        });
        console.log(response);
        const status_code = response.data.status_code;
        if (status_code === proxy.Status.success) {
          proxy.Message.success("注册成功");
          showPanel(1);
        } else if (status_code === proxy.Status.email_exist) {
          proxy.Message.error("邮箱已存在，注册失败");
        }
        else if (status_code == proxy.Status.incorrect_code) {
          proxy.Message.error("邮箱验证码错误");
        }
      } catch (error) {
        console.log(error);
      }
    } else if (opType.value == 1) {
      // 登录
      try {
        const response = await instance.post('/api/users/login', {
          email: formData.value.email,
          password: formData.value.password,
        });
        console.log(response);
        const status_code = response.data.status_code;
        if (status_code == proxy.Status.success) {
          const token = response.data.data.token;
          const response2 = await instance.get('/api/users/info', {
            headers: {
              'X-Token': token,
            },
          });
          const is_banned = response2.data.data.is_banned;
          if (is_banned == true) {
            proxy.Message.error("您已被禁用，无法登录");
            resetForm();
            return;
          }
          proxy.Message.success("登录成功");
          const userInfo = {
            cur_capacity: response2.data.data.cur_capacity,
            max_capacity: response2.data.data.max_capacity,
            token: token,
            nickName: response2.data.data.username,
            email: response2.data.data.email,
            is_banned: response2.data.data.is_banned,
            admin: response2.data.data.is_admin,
          };
          proxy.VueCookies.set("userInfo", userInfo, 0);
          // 跳转页面
          router.push("/");
        } else {
          if (status_code == proxy.Status.incorrect_password) {
            proxy.Message.error("密码错误");
            resetForm();
            return;
          }
          if (status_code == proxy.Status.email_not_exist) {
            proxy.Message.error("该邮箱不存在");
            resetForm();
            return;
          }
        }

      } catch (error) {
        console.log(error);
      }
    } else if (opType.value == 2) {
      // 重置密码
      try {
        const response = await instance.post('/api/users/reset-password', {
          email: formData.value.email,
          // password: formData.value.registerPassword,
          code: formData.value.emailCode,
        });
        console.log(response);
        const status_code = response.data.status_code;
        if (status_code == proxy.Status.incorrect_code) {
          proxy.Message.error("邮箱验证码错误");
        } else if (status_code == proxy.Status.success) {
          const response2 = await instance.post('/api/users/set-new-password', {
            email: formData.value.email,
            new_password: formData.value.registerPassword,
          });
          console.log(response2);
          proxy.Message.success("密码重置成功");
          showPanel(1);
        }




      } catch (error) {
        console.log(error);
      }
    }
  });
};


</script>





<style lang="scss" scoped>
.login-body {
  height: calc(100vh);
  background-size: cover;
  background: url("../assets/login_background.png");
  display: flex;

  .bg {
    flex: 1;
    background-size: cover;
    background-position: center;
    background-size: 800px;
    background-repeat: no-repeat;
    background-image: url("../assets/login_pic.png");
  }

  .login-panel {
    width: 430px;
    margin-right: 15%;
    margin-top: calc((100vh - 500px)/2);

    .login-register {
      padding: 25px;
      background: #fff;
      border-radius: 5px;

      .login-title {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .send-email-panel {
        display: flex;
        width: 100%;
        justify-content: space-between;

        .send-mail-btn {
          margin-left: 5px;
        }
      }

      .rememberme-panel {
        width: 100%;
      }

      .no-account {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }

      .op-btn {
        width: 100%;
      }
    }
  }

  .check-code-panel {
    width: 100%;
    display: flex;

    .check-code {
      margin-left: 5px;
      cursor: pointer;
    }
  }

}
</style>