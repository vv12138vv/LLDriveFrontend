// import './assets/main.css'

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

//引入element plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

//引入图标
import '@/assets/icon/iconfont.css';
import '@/assets/base.scss';

//引入cookies
import VueCookies from 'vue-cookies';

//引入图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

//引入代码高亮
import HljsVuePlugin from '@highlightjs/vue-plugin';
import "highlight.js/styles/atom-one-light.css";
import 'highlight.js/lib/common';


//引入自定义组件
import Dialog from '@/components/Dialog.vue';
// import Avatar from '@/components/Avatar.vue'
import Table from '@/components/Table.vue';
import Icon from '@/components/Icon.vue';
import NoData from '@/components/NoData.vue';
import Window from '@/components/Window.vue';
import Preview from '@/components/preview/Preview.vue';
import Navigation from '@/components/Navigation.vue';
import FolderSelect from '@/components/FolderSelect.vue';


import Verify from '@/utils/Verify';
import Message from '@/utils/Message';
import Request from '@/utils/Request';
import Confirm from '@/utils/Confirm';
import Utils from '@/utils/Utils';
import Status from '@/utils/Status-code';
const app = createApp(App);





//导入图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}




app.use(ElementPlus);
app.use(HljsVuePlugin);
app.use(router);

app.component("Dialog",Dialog)
// app.component("Avatar",Avatar)
app.component("Table",Table)
app.component("Icon",Icon)
app.component("NoData", NoData);
app.component("Window", Window);
app.component("Preview", Preview);
app.component("Navigation", Navigation);
app.component("FolderSelect", FolderSelect);

//配置全局组件
app.config.globalProperties.Verify = Verify;
app.config.globalProperties.Message = Message;
app.config.globalProperties.Request = Request;
app.config.globalProperties.Confirm = Confirm;
app.config.globalProperties.VueCookies = VueCookies;
app.config.globalProperties.Utils = Utils;
app.config.globalProperties.Status=Status;

app.config.globalProperties.globalInfo = {
  avatarUrl: "/api/getAvatar/",
  imageUrl: "/api/file/getImage/"
}

app.mount('#app')
