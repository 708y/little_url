var mongo = require('mongodb').MongoClient
var express = require('express')
var validUrl = require('valid-url');

var url = process.env.MONGOLAB_URI;
var collectionArg = "shortUrl";

var app = express();

var randToken = function() {
    return Math.random().toString(10).substr(2,4); // remove `0.`
};

mongo.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);

    var collection = db.collection(collectionArg);

    app.get('/new/*', function(req, res){
        console.log("new "+req.params[0]);
        if (validUrl.isUri(req.params[0])){
            var original = req.params[0];
            
            collection.insert({'original_url': original}, function(err, data) {
                if (err) throw err;
                var short = randToken(data.insertedIds[0]);
                collection.update({
                    _id: data.insertedIds[0]
                }, {
                    $set: {
                        short_url: short
                    }
                }, function(err, data){
                    if (err) throw err;
                    res.send({"original_url":original,"short_url":"https://"+req.headers.host+"/"+short});
                });
            });
        } else {
            res.send(JSON.stringify({"error":"Wrong url format, make sure you have a valid protocol and real site."}));
        }
    });
    
    app.get('/*', function(req, res){
        console.log("/ "+req.params[0]);
        collection.find({short_url: req.params[0]}).toArray(function(err, documents){
            if (err) throw err;
            if (documents.length == 0)
                res.send(JSON.stringify({"error":"This url is not on the database."}));
            else
                res.redirect(documents[0].original_url)
        })
    });
  }
});

app.listen(process.env.PORT || 8080, function () {
  console.log('App listening ...');
});