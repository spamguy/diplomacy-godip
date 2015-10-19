var express = require('express'),
    judge = require('./judge'),
    app = express(),
    server = app.listen(3000,function(){
        console.log("Server started on port 3000");
    });
