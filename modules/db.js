//引入mongodb模块
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;

//定义连接数据库的字符串
var DbUrl = "mongodb://localhost:27017/productManager";

//将 ObjectID  暴露
exports.ObjectID = ObjectID;

//定义一个函数  功能用来连接数据库  
function connectDB(callback){
	MongoClient.connect( DbUrl , function(err,db){
		if( err ){
			console.log("数据库连接失败");
			return ;
		}
		//如果err不存在   此处 完成增、删、改、查 功能
		//调用回调函数  完成指定功能
		callback( db );
		
	} )
}

//增   
//第一个参数  要操作的集合名称    
//第二个参数 : 对集合添加的数据 是一个json   
//第三个参数  ：添加成功或失败后的回调函数
exports.fnInsert = function(collectionName,json,callback){
	connectDB( function(db){
		//完成添加功能
		//确定集合
		var collection = db.collection(collectionName);
		collection.insert( json , function(err,data){
			db.close();
			callback( err,data );
		} )
	})
}
//删
exports.fnDelete = function(collectionName,json,callback){
	connectDB( function(db){
		//确定集合
		var collection = db.collection(collectionName);
		collection.remove( json , function(err,data){
			db.close();
			callback(err,data);
		} )
	} )
}

//改
// json1 表示修改条件    json2 表示修改的 字段
exports.fnUpdate = function(collectionName,json1,json2,callback){
	connectDB( function(db){
		//确定集合
		var collection = db.collection(collectionName);
		collection.update( json1,{ $set : json2 },function(err,data){
			db.close();
			callback(err,data);
		} )
	} )
}

//查
exports.fnFind = function(collectionName,json,callback){
	connectDB( function(db){
		//确定集合
		var collection = db.collection(collectionName);
		collection.find( json ).toArray( function(err,data){
			db.close();
			callback( err, data );//调用回调函数  将 错误处理参数和查询得到的数据 传回
		} )
	} )
}

//分页  index 表示页码    num   表示 每页数据量
exports.fnPage = function(collectionName,index,num,callback){
	connectDB( function(db){
		//确定集合
		var collection = db.collection(collectionName);
		collection.find().skip( (index-1)*num ).limit( num ).toArray(function( err,data ){
			db.close();
			callback(err,data);
		})
	} )
}