const express  = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs')
const { default: mongoose } = require('mongoose');
const User  = require("./models/User");
const Post  = require("./models/Post");
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer  = require('multer')
const uploadMiddleWare = multer({ dest: 'uploads/' })
const fs = require('fs')

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfjladsifhaisduhfasdjkfnajdfibiasdufb';

app.use(cors({credentials: true, origin: "http://localhost:3000"}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+ '/uploads'));

mongoose.connect('mongodb+srv://Preetham17:YqRTOjYVP5VIrOOn@cluster0.hrjwsmm.mongodb.net/?retryWrites=true&w=majority');

app.post('/register', async (req, res)=>{
    const {username, password} = req.body;
   // res.json({requestData:{username, password}});
   try{
    const UserDoc = await User.create({
        username,
        password: bcrypt.hashSync(password, salt),
    });
    res.json(UserDoc)
   }catch(e){
    console.log(e);
    res.status(400).json(e)
   }
})

app.post('/login', async (req, res)=>{
    const {username, password} = req.body;
   // res.json({requestData:{username, password}});
   const UserDoc = await User.findOne({username});
   const passOK = bcrypt.compareSync(password, UserDoc.password);
   //res.json(passOK);
   if(passOK){
    //logged in
        jwt.sign({username, id:UserDoc._id}, secret, {}, (err, token)=>{
            if(err){
                throw err;
            } 
            // res.json(token);
            res.cookie('token', token).json({
                id: UserDoc._id,
                username
            });
        });
   }else{
    res.status(400).json("Wrong Credentials");
   }
})

app.get('/profile', (req,res)=>{
    //res.json(req.cookies);
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info)=>{
        if(err) throw err
        res.json(info)
    });

})

app.post('/logout', (req, res)=>{
    res.cookie('token', "").json('ok');
})

app.post('/createNewPost', uploadMiddleWare.single('file'), async(req, res)=>{
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length-1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info)=>{
        if(err) throw err
        const {title, summary, content} = req.body;
        const postDoc = await Post.create({
            title, 
            summary, 
            content, 
            cover: newPath,
            author: info.id
    
        });
        res.json(postDoc);
    });
})

app.get('/createNewPost', async(req, res)=>{
    //const Posts = await Post.find();
    //console.log("Am i Here");
    //console.log(await Post.find());
    //console.log(res.statusCode);s
    res.json(await Post.find()
    .populate('author', ['username'])
    .sort({createdAt: -1})
    );
})

app.get('/post/:id', async(req, res)=>{
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
    //console.log("I am here");
})


app.get('/',(req, res)=>{
    res.json("Test OKK")
})

app.listen(4000);



//MongoDB Cluster credentials
//Preetham17
//YqRTOjYVP5VIrOOn

//Connection link
