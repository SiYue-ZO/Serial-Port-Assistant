	import { createRouter, createWebHashHistory, createWebHistory } from "vue-router"

	const routes = [
	    {
	        path: "/", // http://localhost:5173
	        component: () => import("@/views/index.vue")
	    },
	    {
	        path: "/content", // http://localhost:5173/content
	        component: () => import("@/views/portSetBar.vue")
	    },
	]

	const router = createRouter({
	    //使用url的#符号之后的部分模拟url路径的变化,因为不会触发页面刷新,所以不需要服务端支持
	    //history: createWebHashHistory(), 
	    history: createWebHistory(),
	    routes
	})

	export default router