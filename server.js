'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var crypto = require('crypto');

var cors = require('cors');
const { URL } = require('url');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);

app.use(cors());


var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

//set up schemas n' shit

const shortUrlSchema = mongoose.Schema({
  hashedUrl: {type: String, required: true},
  originalUrl: {type: String, required: true}

})

const ShortUrlModel = mongoose.model("Shortened Url", shortUrlSchema);

app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});




//get the new shorturl
app.post("/api/shorturl/new", function (req, res) {
  
  let newUrl = req.body.url

  console.log("newUrl: " + newUrl);

  //check if it's a valid url

  let urlResult = async () => {
    try {
      return await dnsPromises.lookup(newUrl);
    } catch (err) {
      console.log(err)
    }
  };
 
    //if not send {"error":"invalid URL"} back
  if (!urlResult) return res.json({"error":"invalid URL"});

  //otherwise create hash and check if it already exists in the db
  var hash = crypto.createHash('sha1').update(newUrl).digest('base64')

  ShortUrlModel.findOne({hashedUrl: hash}, (err,data) => {
    if(err) return console.log(err);
    
    //if it doesn't exist, add it to the db
    if(!data) 
    {
      let urlDoc = ShortUrlModel({originalUrl: newUrl, hashedUrl: hash})
      urlDoc.save();
    }
    console.log("added url to db");
  })

  //return the object
  let shortUrlStr = "https:www.https://fcc-microservices.herokuapp.com/api/shorturl/" + hash;
  return res.write('<a href="'+ shortUrlStr+ '">' + shortUrlStr + '</a>'); 

});

app.get("/api/shorturl/:short_url", function (req, res) {
    
  let searchShortenedUrl = req.params.short_url;

  //check for the short url
  ShortUrlModel.findOne({hashedUrl: searchShortenedUrl}, (err,data) => {
    if(err) return console.log(err);
    
    if(data) 
    {
      //if it exists then redirect
      return res.redirect(data.originalUrl)
    }
    else
    {
      //if not send invalid
      return res.json({"error":"invalid URL"});
    }
  })

});

app.listen(port, function () {
  console.log('Node.js listening ...');
});