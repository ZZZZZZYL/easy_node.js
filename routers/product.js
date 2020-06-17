var express = require("express");
var router = express.Router();
var db = require("../modules/db.js");
var fs = require("fs");
var multiparty  =require("multiparty");

var bodyParser = require("body-parser");
//配置body-parser 中间件 （内置中间件）
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json());

//商品列表  （操作数据库 查询product表中的数据）
router.get("/",function(req,res){
	/*db.fnFind( "product",{},function(err,data){
		res.render("product/product.ejs",{
			list : data
		})
	} )*/
	db.fnPage( "product",1,3,function(err,data){
		res.render("product/product.ejs",{
			list : data
		})
	} )
})

router.get("/add",function(req,res){
	res.render("product/productadd.ejs");
})
//添加功能 addDo
router.post("/addDo",function(req,res){
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
router.get("/edit",function(req,res){
	//接收要修改的商品编号
	var id = req.query.id;
	//根据id查找商品的其他信息
	db.fnFind( "product",{"_id": new db.ObjectID(id) },function(err,data){
		console.log( data );
		res.render("product/productedit.ejs",{
			list:data[0]
		});
	} )
})
//确认修改功能
router.post("/editDo",function(req,res){
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
router.get("/delete",function(req,res){
	//接收要删除的商品编号
	var id = req.query.id;
	//操作数据库完成删除
	db.fnDelete( "product",{"_id":new db.ObjectID(id)},function(err,data){
		if( !err ){
			res.redirect("/product");
		}
	} )
})

router.post("/search",function(req,res){
	//接收要搜索的数据
	var title = req.body.title;
		title = eval( "/"+title+"/" ); //  alert(  eval("3+2")  )
	//根据搜索的数据在数据库中进行查询
	db.fnFind( "product",{ "title" : title },function(err,data){
		//console.log( data );
		res.render("product/product.ejs",{
			list : data
		})
	} )
})
//分页功能
router.get("/page",function(req,res){
	//接收页码
	var index = req.query.index;
	//定义每页数据量
	var num = 3;
	//操作数据库执行点击不同的页面 显示不同的数据
	db.fnPage( "product",index,num,function(err,data){
		//将分页的数据传递到商品列表中
		res.render("product/product.ejs",{
			list : data
		});
	} )
})
module.exports = router;