//引入express框架
var  express = require("express");

var app = express();

var admin = require("./routers/admin.js");
var product = require("./routers/product.js");

//引入session  并设置中间件
//引入express-session
var session = require("express-session");
//设置session参数中间件
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge : 1000*60*30 },
    rolling:true
}))

//配置ejs模板引擎
app.set("view engine","ejs");

//配置静态文件目录
app.use(express.static("public"));
//配置图片上传虚拟路由
app.use("/upload",express.static("upload"));

//配置路由
app.use("/admin",admin);

//权限操作 如果没有登录 不允许  访问product下面的路由
//自定义一个中间件  判断是否有session  如果有 就next()
app.use( function(req,res,next){
	//获取请求的路由  req.url
	//判断请求的路由是否是登录login    或   loginDo
	if( req.url ==="/login" || req.url === "/loginDo" ){
		next();
	}else{ //如果请求的是其他路由    判断是否有session  
		if( req.session.userinfo ){ //说明已经登录
			next();
		}else{
			//没有登录 跳转到登录页面上
			res.redirect("/admin/login");
		}
	}
} )


app.use("/product",product);

app.listen(8000);
