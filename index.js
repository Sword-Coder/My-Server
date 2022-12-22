const app = require('express')();
const express = require('express')
const path = require('path');
//const uuid = require('uuid')();
// Cors is for limiting the access of unrecognized ip addressess and users.
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:8080','http://localhost:8081']
}));
//'http://localhost:8080 or 8082 for my home'

const PORT = process.env.PORT || 5000;

const bodyParser = require('body-parser')
const axios = require('axios');
const fs = require('fs');

var PouchDB = require('pouchdb');
const { randomUUID } = require('crypto');
PouchDB.plugin(require('pouchdb-upsert'))
PouchDB.plugin(require('pouchdb-find'))

// This is my database
//const localDB = new PouchDB('localDB',)
const remotedb = new PouchDB("http://admin:Sword-9-Code@178.128.122.138:5984/library_db")
const paboothdb = new PouchDB("http://admin:Sword-9-Code@178.128.122.138:5984/pa")
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
app.use('/images', express.static('./Images')) //Making the images public so that it's accessible. // Work an api that sends a photo.
app.use(bodyParser.json({verify: (req, res, buf)=>{req.rawBody = buf}}))
app.use(bodyParser.urlencoded({extended:false}))

app.listen(PORT)

/*app.get('/', (req, res) => {
  res.render('Images')
})
*/

// Sign up
app.post('login', (req,res) => {
  console.log(req.body)
})

//Confirmation for login
app.get('/login', (req, res)=>{
  console.log(req.body)
  //console.log(localDB)
  res.header("Content-Type", 'application/json')
  res.send(JSON.stringify({status:'ok'}))
}) 



// Add Borrowers >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// This is for adding borrowers and users to the database.
app.post('/saveName', (req, res)=>{
  /*remotedb.uuid().then((ids) => {
    const id = ids[0]
    couch.insert('names', {
    "_uid": req.body.borrowerid,
    "type": req.body.type,
    "firstName": req.body.firstName,
    "lastName": req.body.lastName,
    "phoneNumber": req.body.phoneNumber,
    "email": req.body.email,
    "birthdate": req.body.birthdate,
    "status": req.body.status
    }).then((result)=>{
      console.log(result)
      res.header("Content-Type", 'application/json')
      res.send(JSON.stringify({status:'Saved ' + req.body.firstName + ' ' + req.body.lastName + ' ' + req.body.phoneNumber + ' ' + req.body.email + ' ' + req.body.birthdate}))
    })
  })*/
  remotedb.upsert(req.body.borrowerid, (doc)=>{
    /*if(!doc.hasOwnProperty('names')){
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
    return doc;*/
    doc.uid = req.body.borrowerid,
    doc.type = req.body.type,
    doc.firstName = req.body.firstName,
    doc.lastName = req.body.lastName,
    doc.phoneNumber = req.body.phoneNumber,
    doc.email = req.body.email,
    doc.birthdate = req.body.birthdate,
    doc.status = req.body.status
    return doc
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Saved ' + req.body.firstName + ' ' + req.body.lastName + ' ' + req.body.phoneNumber + ' ' + req.body.email + ' ' + req.body.birthdate}))
  })
})

// This is my api to update names
app.post('/updateName', (req, res)=>{
  remotedb.get(req.body.borrowerid, (err, doc)=>{
    if (err) {return consonle.log(err);}
    remotedb.put({
      _id: req.body.borrowerid,
      _rev: doc._rev,
      type: req.body.type,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      birthdate: req.body.birthdate,
      status:req.body.status
      })
      doc.updates.push({time: new Date().getTime(), updateBy: this.loginid})
    return doc;
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Updated ' + req.body.firstName + ' ' + req.body.lastName + ' ' + req.body.phoneNumber + ' ' + req.body.email + ' ' + req.body.birthdate}))
  })
})


//Need to make an api that removes or deletes a library user in the database and respond back with a new array list of users.
app.post('/removeBorrowers', (req, res) => {
  console.log(req)
  remotedb.get(req.body.id, function(err, doc) {
    if (err) { return console.log(err); }
    remotedb.remove(doc, (err, response) => {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Successfully Removed User: ' + req.body.id}))
  });
})


//This is my api for getting the data list for the names of my library users
const viewUrl = "_utils/#database/library_db/names/all?limit=20&reduce=false"
app.get('/getNames', (req, res) =>{
  //This is my first alternative to getting my array of users
  /*remotedb.get('names', viewUrl).then((result) =>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify(result))
  })*/
  remotedb.query('temp/borrowers', {key:'borrower', include_docs: true}).then((result) => {
    console.log(result)
    const borrowers = []
    result.rows.sort((a, b)=> {return a.value.toLowerCase() < b.value.toLowerCase() ? -1 : 0}).forEach((borrower) => {
    borrowers.push(borrower.doc)
    })
    res.header("Content-Type", 'application/json')
    res.send(borrowers)
  })  
})

//Multer >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//This is will be the package needed for uploading an image. I will be using the images for the display of top rated books.
const { dirname } = require('path');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //cb(null, file.originalname + '-' + uniqueSuffix + '.png')
    //cb(null, file.fieldname + '-' + path.extname(file.originalname))
    cb(null, file.originalname)
  }
})
const maxSize = 20 * 1024 * 1024
const upload = multer({storage: storage});

// This is where I get save my book entry. >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/saveBook', upload.single('bookCover'), (req, res)=>{
  console.log(req)
  console.log(req.body)
    
  remotedb.upsert(req.body.bookid, (doc)=>{
    doc.bookid = req.body.bookid,
    doc.type = req.body.type,
    doc.bookTitle = req.body.bookTitle,
    doc.bookAuthor = req.body.bookAuthor,
    doc.bookCategories = req.body.bookCategories,
    doc.bookSubCategories = req.body.bookSubCategories,
    doc.bookDescription = req.body.bookDescription,
    doc.bookCover = req.file.originalname,
    doc.referenceNumber = req.body.referenceNumber

    return doc
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Saved ' + req.body.bookTitle+ ' by ' + req.body.bookAuthor + "! Also Saved the Image."}))
  })
  
})
//const viewUrl2 = "_utils/#database/pa/books/all?limit=20&reduce=false"
app.get('/getBooks',(req, res) =>{
  remotedb.query('temp/booksByTitle', {include_docs: true}).then((result) => {
    books = []
    result.rows.sort((a, b) => { return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 0 }).forEach((book) => {
    books.push(book.doc)
    })
    res.header("Content-Type", "application/json")
    res.send(books)
  })

})

//Need to make an api that removes or deletes a book in the database and respond back with a new array list of users.
app.post('/removeBook', (req, res) => {
  console.log(req) 

  remotedb.get(req.body.bookid, function(err, doc) {
    if (err) { return console.log(err); }
    remotedb.remove(doc, function(err, response) {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Successfully Removed Book: ' + req.body.id}))
  });

  //fs.unlink("")
})

const viewUrl2 = "_utils/#database/library_db/books/all?limit=20&reduce=false"
app.post('/updateBook'), (req, res) => {
  remotedb.get(req.body.bookid, (err, doc)=>{
    if (err) {return console.log(err);}
    remotedb.put({
      _id: req.body.bookid,
      _rev: doc._rev,
      type: req.body.type,
      bookTitle: req.body.bookTitle,
      bookAuthor: req.body.bookAuthor,
      bookCategories: req.body.bookCategories,
      bookSubCategories: req.body.bookSubCategories,
      bookDescription: req.body.bookDescription,
      bookCover: req.body.bookCoverFile,
      referenceNumber: req.body.referenceNumber,
      })
    return doc;
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Updated ' + req.body.bookTitle + ' by ' + req.body.bookAuthor}))
  })
}


//PA API >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/saveSettings', (req, res)=>{
  console.log(req.body)
    
  paboothdb.upsert(req.body.settingId, (doc)=>{
    doc.settingId = req.body.settingId,
    doc.type = "group",
    doc.groupName = req.body.groupName,
    doc.songTitle = req.body.songTitle,
    doc.event = req.body.event,
    doc.mic1 = req.body.mic1
    doc.mic2 = req.body.mic2
    doc.mic3 = req.body.mic3
    doc.mic4 = req.body.mic4
    doc.mic5 = req.body.mic5
    doc.mic6 = req.body.mic6
    doc.mic7 = req.body.mic7
    doc.mic8 = req.body.mic8
    doc.mic9 = req.body.mic9
    doc.mic10 = req.body.mic10
    return doc
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Saved ' + req.body.songTitle+ ' sung by ' + req.body.groupName }))
  })
  
})

app.get('/getSettings', (req, res) =>{
  console.log(req)
  paboothdb.query('temp/group', {include_docs: true}).then((result) => {
    console.log(result)
    const groups = []
    result.rows.sort((a, b) => { return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 0 }).forEach((group) => {
    groups.push(group.doc)
    })
    res.header("Content-Type", "application/json")
    res.send(groups)
  })
})

app.post('/updateSettings'), (req, res) => {

  paboothdb.get(req.body.settingId, (err, doc)=>{
    if (err) {return console.log(err);}
    paboothdb.put({
      _id: req.body.settingId,
      _rev: doc._rev,
      type: "group",
      groupName: req.body.groupName,
      songTitle: req.body.songTitle,
      event: req.body.event,
      mic1: req.body.mic1,
      mic2: req.body.mic2,
      mic3: req.body.mic3,
      mic4: req.body.mic4,
      mic5: req.body.mic5,
      mic6: req.body.mic6,
      mic7: req.body.mic7,
      mic8: req.body.mic8,
      mic9: req.body.mic9,
      mic10: req.body.mic10
      })
    return doc;
  }).then((result)=>{
    console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Updated ' + req.body.songTitle + ' a song sung by ' + req.body.groupName}))
  })
}

app.post('/removeSetting', (req, res) => {
  console.log(req.body) 

  paboothdb.get(req.body.settingId, function(err, doc) {
    if (err) { return console.log(err); }
    paboothdb.remove(doc, function(err, response) {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Successfully Removed Book: ' + req.body.id}))
  });

})



//Global response
//app.use(app.static((path.join(__dirname, 'public'))))
//app.set('views', path.join(__dirname, 'views'))
//app.set('viewengine', 'ejs')

app.get('*', (req, res)=>{
  console.log(req.url)
  if(req.url.startsWith('/upload')){
    res.send("Image Uploaded")
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
    remotedb.info().then(function (info) {
      console.log(info);
    })
  }else{

    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'what are you looking for?'}))
    //res.render('pages/upload')
  }
})
