const express = require('express');
let cookieParser = require('cookie-parser');
let session = require('express-session');
const sha = require('sha256');
const app = express();

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
app.use(cookieParser());
app.use(session({
    secret: 'qwesda123asdqwe123',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const mongoclient = require('mongodb').MongoClient;
const ObjId = require('mongodb').ObjectId;
const url = 'mongodb+srv://root:1234@mongo.pmdfvzw.mongodb.net/?retryWrites=true&w=majority';
let mydb;
mongoclient.connect(url)
    .then(client => {
        console.log('몽고db 접속 성공');
        mydb = client.db('myboard');
        app.listen(8080, function () {
            console.log("포트 8080실행중")
        });
    })




app.get('/', function (req, res) {
    // console.log(req.session.passport);
    // res.render('index.ejs', { user: req.session.passport });
    res.redirect('/list');
    
})
app.get('/login', function (req, res) {
    if (req.session.passport) {
        console.log('세션 유지');
        res.redirect('/');
    } else {
        res.render('login.ejs');
    }

})
app.post('/login', passport.authenticate("local", {
    failureRedirect: "/fail",
}),
    function (req, res) {
        res.redirect('/');
})
// app.post('/login', function(req,res) {
//     console.log(req.body);
//     mydb.collection("account")
//     .findOne({userid : req.body.userid})
//     .then((result) => {
//         if(result.userpw = sha(req.body.userpw)) {
//             req.session.user = req.body;
//             console.log('new login');
//             res.redirect('/');
//         } else {
//             res.send('잘못된 비밀번호 입니다');
//         }
//     })
// })
passport.use(
    new LocalStrategy(
        {
            usernameField: "userid",
            passwordField: "userpw",
            session: true,
            passReqToCallback: false,
        },
        function(inputid,inputpw,done) {
            mydb.collection("account")
                .findOne({userid :inputid})
                .then((result) => {
                    
                    if(result.userpw == sha(inputpw)) {
                        done(null,result);
                        console.log('new login');
                        
                    } else {
                        done(null,false, {message:'비밀번호 틀렸어요'});
                    }
                })
        }
    )
)
passport.serializeUser(function (user,done) {
    console.log("인증성공")
    done(null,user.userid);
})

passport.deserializeUser(function (puserid,done) {
    mydb
    .collection("account")
    .findOne({userid :puserid})
    .then((result) => {
        done(null,result);
    })
})
app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
})
app.get('/register', function (req, res) {

    res.render('register.ejs');
})
app.post('/register', function (req, res) {
    mydb.collection("account")
        .insertOne({
            userid: req.body.userid,
            userpw: sha(req.body.userpw),
            usergroup: req.body.usergroup,
            useremail: req.body.useremail
        }).then((result) => {
            console.log('회원가입 성공');
            res.redirect("/");
        })

})

app.get('/cookie', function (req, res) {
    let milk = parseInt(req.cookies.milk) + 1000;
    if (isNaN(milk)) {
        milk = 0;
    }
    res.cookie('milk', milk, { maxAge: 1000 });
    res.send(req.cookies.milk);
})



app.get('/write', function (req, res) {
    res.render('write.ejs', {user:req.session.passport});
})

app.get('/post/:id', function (req, res) {
    let id = req.params.id;
    console.log(id);
    let objectId = new ObjId(id);
    mydb.collection("post").findOne({'_id': objectId}).then((result) => {
        console.log(result);
        res.render("showdetail.ejs", {data:result, user:req.session.passport});
    })
})
app.post('/edit', function (req, res) {
    let id = req.body.id;
    
    let objectId = new ObjId(id);

    mydb.collection("post")
        .updateOne({'_id': objectId},{$set : {title: req.body.title, content: req.body.body, date:req.body.someDate}}).then((result) => {
        console.log(result);
        res.redirect(`/post/${objectId}`);
    });

})

app.post("/delete", function(req,res) {
    console.log(req.body._id);
    req.body._id = new ObjId(req.body._id);
    mydb.collection('post').deleteOne(req.body).then(result => {
        console.log('삭제완료');
        res.status(200).send();
    })
    .catch(err => {
        console.log(err);
        res.status(500).send();
    })
})
app.get('/list', function (req, res) {
    mydb.collection('post').find().toArray().then(result => {
        
        // console.log(result);
        res.render('list.ejs', {data:result, user:req.session.passport});
    });
    
})

app.post('/save', function (req, res) {
    console.log(req.body);

    mydb.collection('post').insertOne(
        {title: req.body.title, content: req.body.body, date:req.body.someDate}
    ).then(result=> {
        console.log(result);
        console.log('데이터 추가 성공');
    });
    res.redirect('/list');

})

app.post('/photo', function(req,res) {
    console.log('이미지 첨부');
})