const app = require('express')();

// Cors is for limiting the access of unrecognized ip addressess and users.
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:8080']
}));

//This is my express. My Handler
const PORT = process.env.PORT || 5000;

const bodyParser = require('body-parser')
const axios = require('axios');
const fs = require('fs');

var PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-upsert'))
PouchDB.plugin(require('pouchdb-find'))

// This is my database
//const localDB = new PouchDB('localDB',)
const remotedb = new PouchDB("http://admin:Sword-9-Code@178.128.122.138:5984/library_db")

/* 
// This will only by used if you are trying to sync the local and the remotedb together. 
const remotedb = new PouchDB('https://admin:pass@ip:5984/databasename', )
console.log(remotedb.info())
db.sync(remotedb, {
  live: true 
}).on('change', function (change) {
  console.log(change)
}).on('error', function (err) {
  console.log(err)
  // yo, we got an error! (maybe the user went offline?)
});
//This links to the database in CouchDB
//const remotedb = new pouchdb("http:/admin:pass@178.128.122.138:5984/library_db");
//console.log(remotedb.info())
*/


app.set('trust proxy', true)
app.use(bodyParser.json({verify: (req, res, buf)=>{req.rawBody = buf}}))
app.use(bodyParser.urlencoded({extended:false}))

app.listen(PORT)

//Confirmation for login
app.post('/login', (req, res)=>{
  console.log(req.body)
  //console.log(localDB)
  res.header("Content-Type", 'application/json')
  res.send(JSON.stringify({status:'ok'}))
}) 

// This is for adding borrowers and users to the database.
app.post('/saveName', (req, res)=>{
  remotedb.upsert('names', (doc)=>{
    if(!doc.hasOwnProperty('names')){
      doc.names = []
    }
    doc.names.push({
    "uid": req.body.borrowerid,
    "type": req.body.type,
    "firstName": req.body.firstName,
    "lastName": req.body.lastName,
    "phoneNumber": req.body.phoneNumber,
    "email": req.body.email,
    "birthdate": req.body.birthdate,
    "status": req.body.status})
    return doc;
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Saved ' + req.body.firstName + ' ' + req.body.lastName + ' ' + req.body.phoneNumber + ' ' + req.body.email + ' ' + req.body.birthdate}))
  })
})


const viewUrl = "_utils/#database/library_db/names/all?limit=20&reduce=false"
app.get('/getNames', (req, res) =>{
  remotedb.get('names', viewUrl).then((result) =>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify(result))
  })
})

const viewUrl2 = "_utils/#database/library_db/books/all?limit=20&reduce=false"
app.get('/getBooks',(req, res) =>{
  remotedb.get('books', viewUrl).then((result) =>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify(result))
  })
})




//Global testing
app.get('*', (req, res)=>{
  console.log(req.url)
  if(req.url.startsWith('/saveName')){

  }else if(req.url.startsWith('/list')){
    localDB.get('names').then((names)=>{
      res.header("Content-Type", 'application/json')
      res.send(JSON.stringify({status:'success', name:names}))
    }).catch((err)=>{
      console.log(err)
      res.header("Content-Type", 'application/json')
      res.send(JSON.stringify({status:'error', err:err}))
    })

  }else if(req.url.startsWith('/see')){
    localDB.info().then(function (info) {
      console.log(info);
    })
  }else{

    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'what are you looking for?'}))
  }

  

})