//引入express框架
var  express = require("express");

var app = express();

var fs = require("fs");

//引入multiparty模块  ：   实现接收表单post提交的数据 并实现上传图片
var multiparty = require("multiparty");
//引入md5-node模块   完成对密码的加密
var md5 = require("md5-node");

//配置ejs模板引擎
app.set( "view engine","ejs" );

//配置中间件  导入静态文件
app.use( express.static("public") )

//引入body-parser
var bodyParser = require("body-parser");

//配置body-parser 中间件 （内置中间件）
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

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

//引入 数据库 自定义模块
var db = require("./modules/db");



//注册路由
app.get("/register",function(req,res){
	res.render("register");
})

//注册功能实现
app.post("/registerDo",function(req,res){
	//接收表单数据
	var query = req.body;
	//获取用户名和密码
	var username=query.username;
	var password = md5( query.password );
	//注册时保证用户名的唯一性    
	//思路：使用当前传递的用户名作为查找条件  如果查找的结果数组 为0  说明当前用户名不存在  
	//操作数据库  执行查找功能
	db.fnFind( "user" , {"username":query.username} , function(err,data){
		if( data.length == 0 ){ //说明用户不存在  
			//将得到的用户名和密码 存入到 数据库中
			db.fnInsert( "user" , { "username":username,"password":password } , function(err,data){
				if( !err ){
					//说明 注册成功了    跳转到登录页
					res.redirect("/login");
					//res.send("<script>alert('注册成功');location.href='/login'</script>");
				}
			}  )
		}else{
			res.send("<script>alert('用户名已存在');location.href='/register'</script>");
		}
	} )
	
})

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
			res.redirect("/login");
		}
	}
} )

//登录
app.get("/login",function(req,res){
	res.render("login");
})

//登录功能实现
app.post("/loginDo",function(req,res){
	//接收用户提交的数据
	var query = req.body;//接收从表单接收的数据   admin  admin   
	//对接收的密码进行加密  使加密后的密码和 数据库密码一致  才可以登录
	var username = query.username;
	var password = md5( query.password ) ;//对密码进行加密
	//操作数据库  完成查询功能 
	db.fnFind( "user" , {"username":username,"password":password}, function(err,data){
		//console.log(data);
		if( data.length > 0 ){//登录成功
			//存储session信息  
			req.session.userinfo = query.username;
			
			//为ejs模板引擎设置一个全局session
			app.locals["username"] = req.session.userinfo;
			
			//登录成功  跳转到列表product
			res.redirect("/product");
		}else{
			//登录失败  回到登录页面
			res.redirect("/login");
		}
	})
})

//设置全局变量     每一个页面都可以访问这个数据
//app.locals["username"] = "8888888888";

//商品列表
app.get("/product",function(req,res){
	//将数据库的product集合中的数据  显示到页面上
	db.fnFind( "product" , {} , function(err,data){
		res.render("product",{
			list : data
		});
	})
})

//商品添加
app.get("/productadd",function(req,res){
	res.render("productadd");
})

//配置一个中间    获取upload中的数据
app.use("/upload",express.static("upload"));//虚拟路由  
//首先查找 upload路由，找到在这个路由下找upload目录  读取这个目录中的静态数据

// {title,fee,price} = { price, }
//添加功能实现
app.post("/productAddDo",function(req,res){
	//接收表单提交的数据   使用post提交数据  
	//实现上传图片功能   使用multiparty接收数据
	//创建一个multiparty类型的表单对象
	var form = new multiparty.Form();
	//设置图片上传的路径
	form.uploadDir = "upload";//在服务器的目录下创建一个upload目录
	form.parse( req,function(err,data,files){
		//data参数：表示  提交的表单的数据
		//files参数 ： 上传的图片的信息
		console.log( data );
		console.log( files );
		//接收表单数据
		var title = data.title[0];
		var price = data.price[0];
		var fee = data.fee[0];
		var description = data.description[0];
		//获取图片的路径
		var pic = files.pic[0].path;
		//{title,price} = {title:45,price:90}
		//将接收的数据 添加到product表中
		db.fnInsert( "product",{ //解构赋值
			title,
			price,
			fee,
			description,
			pic
		},function(err,data){
			if( !err ){
				//添加成功  跳转到商品列表
				res.redirect("/product");
			}
		} )
		
	} )
})
//商品编辑
app.get("/productedit",function(req,res){
	//接收要修改的商品编号
	var id = req.query.id;
	//根据id查找商品的其他信息
	db.fnFind( "product",{"_id": new db.ObjectID(id) },function(err,data){
		console.log( data );
		res.render("productedit",{
			list:data[0]
		});
	} )
})

//确认修改功能
app.post("/producteditDo",function(req,res){
	//使用multiparty模块接收表单的数据
	//创建一个multiparty类型的表单对象
	var form = new multiparty.Form();
	//设置图片上传的路径
	form.uploadDir = "upload";//在服务器的目录下创建一个upload目录
	
	form.parse(req,function(err,data,files){
		console.log( files );
		//接收表单数据
		var id = data.id[0];
		var title = data.title[0];
		var price = data.price[0];
		var fee = data.fee[0];
		var description = data.description[0];
		//接收图片路径
		var pic = files.pic[0].path;
		
		//获取图片的 originalFilename  如果这个参数值为空 说明  没有修改图标
		var originalFilename = files.pic[0].originalFilename;
		var updateJson = {};
		if( originalFilename ){//如果有修改操作 该参数是一个字符串
			updateJson = {
				title,
				price,
				fee,
				description,
				pic
			}
		}else{ //说明没有修改图片 但是会生成一个临时文件   可以将这个文件删除
			updateJson = {
				title,
				price,
				fee,
				description
			}
			//删除生成的临时文件  unlink
			fs.unlink(pic);
		}
		
		//操作数据库实现修改
		db.fnUpdate( "product",{ "_id":new db.ObjectID(id) },updateJson,function(err,data){
			if( !err ){
				res.redirect("/product");
			}
		} )
	})
})

//删除功能
app.get("/productdelete",function(req,res){
	//接收要删除的商品编号
	var id = req.query.id;
	//操作数据库完成删除
	db.fnDelete( "product",{"_id":new db.ObjectID(id)},function(err,data){
		if( !err ){
			res.redirect("/product");
		}
	} )
})

//模糊查询 ： db.product.find( {"title": /手机/ } )
//搜索功能  使用post方式接收表单数据
app.post( "/search",function(req,res){
	//接收要搜索的数据
	var title = req.body.title;
		title = eval( "/"+title+"/" ); //  alert(  eval("3+2")  )
	//根据搜索的数据在数据库中进行查询
	db.fnFind( "product",{ "title" : title },function(err,data){
		//console.log( data );
		res.render("product",{
			list : data
		})
	} )
} )

app.listen(8000);
