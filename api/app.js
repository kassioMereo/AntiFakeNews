var app = require ("./config/server.js");

var http = require('http').createServer(app);
var io = require("socket.io")(http);

io.origins('*:*');

http.listen(8080, function(){
	console.log('Server side instagram_clone_v01 online');
});


io.on('connect', function(socket){
	console.log("socket.id"+socket.id);	
});

io.on('newPhoto', function(){
	console.log("recebeu");	
});

var flatten = require('flat');

var mongodb = require("mongodb");

let db = new mongodb.Db(
		'anti_fake_news',
		new mongodb.Server(
			'localhost',
			27017,
			{}),
		{}
	);

let fs = require("fs");

let objectId = require('mongodb').ObjectId;

//insert comentario do post by id do db
app.put("/api_comentario/", function(req,res){
	console.log("aloooou");
	var link = req.body.link_news;
	var comentario = req.body.comentario;
	var user = req.body.user;

	console.log("COMENTARIO+"+JSON.stringify(comentario));

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('news', function(err,collection){
			collection.update(
				{ link_news : link },
				{ $push : {  
						comentarios : {
							id_comentario : new objectId(),
							comentario : comentario,
							user : user
						}
					}	
				},
				function(err, records){
					if (err){

						console.log("NÃO ADICIONOU COMENTARIO:"+err);
						res.json(err);
					} else {
						console.log("ADICIONOU COMENTARIO");
						res.json(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});



//delete post by id do db
app.delete("/api_comentario/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.update(
				{ },
				{ $pull : {
						comentarios : { id_comentario : objectId(req.params.id) }
					}
				},
				{multi:true},
				function(err, records){
					if (err){
						res.json(err);
					} else {
						res.json(records);
					}
					mongoclient.close();
				}
			);
		});
	});
});

var mongoose = require('mongoose');
let db_ = mongoose.connect('mongodb://localhost:27017/anti_fake_news',  { useNewUrlParser: true })
    .catch(err => console.error('Something went wrong', err));


const newsSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    link_news: String,
    fake_news: Array,
    true_news: Array,
    comentarios: Array
},{
    versionKey: false
});
 
const News = mongoose.model('News', newsSchema);

app.post("/api_get_noticia", function(req,res){
	var link = req.body.link;
	res.setHeader("Access-Control-Allow-Origin","*");
	News.findOne({link_news : link}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			console.log(req);
			res.json(req);
		}
	});
	
});

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    name: String,
    password: String,
    cnpj: String
},{
    versionKey: false
});
 
const User = mongoose.model('User', userSchema);

//get user by id
app.get("/api_users_by_id/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({_id : req.params.id}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});



//get all users by id
app.get("/api_users/", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	User.find().exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

app.get("/api_users/:username", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({username : req.params.username}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

app.post("/api_users/", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
		var newUser = new User();
		newUser._id = mongoose.Types.ObjectId();
		newUser.username = req.body.username;
		newUser.name = req.body.name;
		newUser.password = req.body.password;
		newUser.cnpj = req.body.cnpj;
		newUser.save(function(err, new_user){
	        if(err) {
	            res.send('error saving new user');
	        } else {
	        	console.log(newUser);
	            res.json(new_user);
	        }
		});
});

app.post("/insert_fake_news_into", function(req,res){

	var link = req.body.link;
	var user = req.body.user;

	News.findOne({link_news : req.body.link}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			if (isEmpty(req)){
				db.open( function(err,mongoclient){
						var data = {
						_id : new objectId(),
						link_news: link,
						fake_news : [],
						true_news : []
					}

					var fake_news = {
						_id : mongoose.Types.ObjectId(),
						user : user
					}

					data.fake_news.push(fake_news);

					mongoclient.collection('news', function(err,collection){
						collection.insert(data, function(err,records){

							mongoclient.close();

							if (err){
							} else {

								console.log("inseriu fake_news_into");
								res.json({"ok":0})
							}
						});
					});
				});
			} else {

			var arrayOfNewspapers = [];

			for (var i = 0 ; i < req.fake_news.length; i++){
				console.log("lol");
				arrayOfNewspapers.push(req.fake_news[i].user);
			}
			console.log(arrayOfNewspapers);

			if (arrayOfNewspapers.includes(user)){
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
				collection.update(
					{link_news : link},
					{ $pull : {
					fake_news : { user : user }
					}
					},
					{multi:true},
					function(err, records){
					if (err){
					console.log("nao excluiu");
					res.json(err);
					} else {
					console.log("excluiu");
					res.json({"ok":1})
					}
					mongoclient.close();
					}
					);
					});
				});
			} else {
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
					collection.update(
						{ link_news : link },
						{ $push : {  
							fake_news : {
							_id : new objectId(),
							user : user							}
						}	
					},
					function(err, records){
						mongoclient.close();
						if (err){
							console.log("err"+err);
							res.json(err);
						} else {
							console.log("inseriu into_fake_news");
							res.json({"ok":2})
						}
							mongoclient.close();
						}
					);
				});
			});
			}													
			}
		}
	});
});

function isEmpty(obj) {
    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }

	    return true;
}

//get user by username
app.get("/api_get_profile/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({username : req.params.id}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

app.post("/insert_true_news_into", function(req,res){

	var link = req.body.link;
	var user = req.body.user;

	News.findOne({link_news : link}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			if (isEmpty(req)){
				db.open( function(err,mongoclient){
						var data = {
						_id : new objectId(),
						link_news: link,
						fake_news : [],
						true_news : []
					}

					var true_news = {
						_id : mongoose.Types.ObjectId(),
						user : user
					}

					data.true_news.push(true_news);

					mongoclient.collection('news', function(err,collection){
						collection.insert(data, function(err,records){

							mongoclient.close();

							if (err){
							} else {
								io.sockets.emit('update');
								console.log("inseriu true_news_into");
								res.json({"ok":0})
							}
						});
					});
				});
			} else {

			var arrayOfNewspapers = [];

			for (var i = 0 ; i < req.true_news.length; i++){
				console.log("lol");
				arrayOfNewspapers.push(req.true_news[i].user);
			}
			console.log(arrayOfNewspapers);

			if (arrayOfNewspapers.includes(user)){
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
				collection.update(
					{link_news : link},
					{ $pull : {
					true_news : { user : user }
					}
					},
					{multi:true},
					function(err, records){
					if (err){
					console.log("nao excluiu true_news_into");
					res.json(err);
					} else {
					io.sockets.emit('update');
					res.json({"ok":1})
					}
					mongoclient.close();
					}
					);
					});
				});
			} else {
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
					collection.update(
						{ link_news : link },
						{ $push : {  
							true_news : {
							_id : new objectId(),
							user : user							
							}
						}	
					},
					function(err, records){
						mongoclient.close();
						if (err){
							console.log("err"+err);
							res.json(err);
						} else {
							io.sockets.emit('update');
							res.json({"ok":2})
						}
							mongoclient.close();
						}
					);
				});
			});
			}													
			}
		}
	});
});

app.post("/api_get_noticia_", function(req,res){

	var link = req.body.link;
	console.log("link:"+link);
	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('news', function(err,collection){
			collection.find({link_news : link}).toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					console.log("results"+results);
					
					res.json(results);
					mongoclient.close();
				}
				
			});
		});
	});
});

app.get("/api_get_top_fake_news", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('news', function(err,collection){
			collection.aggregate([
		    {
		        $project : { fake_news: {$size: { "$ifNull": [ "$fake_news", [] ] } } }
		    }, 
		    {   
		        $sort: {"fake_news":-1} 
		    },
		    { $limit : 10 }
		    ], function(err,response){
		    	mongoclient.close();
		    	console.log(response);
		    	res.send(response);
		    });
		});
	});
});


//get user by username
app.post("/api_get_noticia_by_id", function(req,res){

	var id = req.body.id;
	console.log("iddd"+id);
	res.setHeader("Access-Control-Allow-Origin","*");
	News.findOne({_id : mongoose.Types.ObjectId(id)}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
			console.log("REQQQ"+req);
		}
	});
	
});



