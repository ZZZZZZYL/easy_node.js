var express = require("express");
var router = express.Router();
var db = require("../modules/db.js");

var bodyParser = require("body-parser");
//配置body-parser 中间件 （内置中间件）
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json());

var md5 = require("md5-node");

router.get("/login",function(req,res){
	res.render("admin/login.ejs");
})
router.post("/loginDo",function(req,res){
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
			//app.locals["username"] = req.session.userinfo;
			req.app.locals["username"] = req.session.userinfo;
			//登录成功  跳转到列表product
			res.redirect("/product");
		}else{
			//登录失败  回到登录页面
			res.redirect("/admin/login");
		}
	})
})

router.get("/register",function(req,res){
	res.render("admin/register.ejs");
})

router.post("/registerDo",function(req,res){
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
					res.redirect("/admin/login");
				}
			}  )
		}else{
			res.send("<script>alert('用户名已存在');location.href='/admin/register'</script>");
		}
	} )
})
module.exports = router;