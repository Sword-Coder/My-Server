const app = require('express')();
const express = require('express')
const path = require('path');
//const uuid = require('uuid')();
// Cors is for limiting the access of unrecognized ip addressess and users.
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:8080','http://localhost:8081',]
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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('trust proxy', true)
app.use('/images', express.static('./Images')) //Making the images public so that it's accessible. // Work an api that sends a photo.
app.use(bodyParser.json({verify: (req, res, buf)=>{req.rawBody = buf}}))
app.use(bodyParser.urlencoded({extended:false}))

app.listen(PORT)


//Someday this is where I will put my function to display my app, electron, pwa, so on.
app.get('/', (req, res) => {
  res.render('upload.ejs')
})


// Sign up
app.post('login', (req,res) => {
  //console.log(req.body)
})

//Confirmation for login
app.get('/login', (req, res)=>{
  //console.log(req.body)
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
    return doc;*/ //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> The outcome of this code can be seen in the database called "names."
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
    //console.log(result)
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
    //console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Updated ' + req.body.firstName + ' ' + req.body.lastName + ' ' + req.body.phoneNumber + ' ' + req.body.email + ' ' + req.body.birthdate}))
  })
})


//Need to make an api that removes or deletes a library user in the database and respond back with a new array list of users.
app.post('/removeBorrowers', (req, res) => {
  //console.log(req)
  remotedb.get(req.body.id, function(err, doc) {
    if (err) { return console.log(err); }
    remotedb.remove(doc, (err, response) => {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    //console.log(result)
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
    //console.log(result)
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
  //console.log(req)
  //console.log(req.body)
    
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
    //console.log(result)
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
  //console.log(req) 

  remotedb.get(req.body.bookid, function(err, doc) {
    if (err) { return console.log(err); }
    //console.log(doc)
    
    remotedb.remove(doc, function(err, response) {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Successfully Removed Book: ' + req.body.bookid}))
  });
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
    //console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Updated ' + req.body.bookTitle + ' by ' + req.body.bookAuthor}))
  })
}

//Book Requests >>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/bookrequest', (req, res) => {
  //console.log(req.body)
  /*reqId: uid(),
            user: this.firstName + " " + this.lastName,
            requestedBook: this.checkoutDetails,*/
  remotedb.upsert(req.body.reqId, (doc)=>{
    doc.type = req.body.type
    doc.user = req.body.user
    doc.requestedBook = req.body.requestedBook
    return doc
  }).then((result)=>{
   // console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Registered the request ' + req.body.reqId}))
  })
})

app.get('/bookrequestlist', (req, res) => {
  //console.log()
  remotedb.query('temp/reqbook', {include_docs: true}).then((result) => {
    books = []
    result.rows.sort((a, b) => { return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 0 }).forEach((book) => {
    books.push(book.doc)
    })
    res.header("Content-Type", "application/json")
    res.send(books)
  })

})

app.post('/disapprove', (req, res) => {
  //console.log(req.body)
  //console.log(req.body.disapprovedbook._id) 
  remotedb.get(req.body.disapprovedbook._id, function(err, doc) {
    if (err) { return console.log(err); }
    //console.log(doc)
    
    remotedb.remove(doc, function(err, response) {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Successfully Removed Book: ' + req.body.disapprovedbook._id}))
  });
})

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
var days = ["Sunday", "Monday", "Tuesday", "Wenesday", "Thursday", "Friday", "Saturday"]

  
  //Expiry date
    let currentDate = new Date(Date.now() + 30);
    var month = currentDate.getMonth() + 1;
    var year = currentDate.getFullYear();
    var date = currentDate.getDate();
    var day = currentDate.getDay();
    var hour = currentDate.getHours();
    var mins = currentDate.getMinutes();
    var secs = currentDate.getSeconds();
    var mils = currentDate.getMilliseconds();
    var getTime = currentDate.getTime();

    let format1 = months[month] + "/" + day + "/" + year;
    var setexpiry = currentDate.setDate(currentDate.getDate() + 30)


    var newDateOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
   }
  var newDate = currentDate.toLocaleString("en-US", newDateOptions );
  //res.send(JSON.stringify({status:"Please Return on " + currentDate.setDate(currentDate.getDate() + 30)}))
  //console.log(newDate)

  
  /* 
  getFullYear()	Get year as a four digit number (yyyy)
  getMonth()	Get month as a number (0-11)
  getDate()	Get day as a number (1-31)
  getDay()	Get weekday as a number (0-6)
  getHours()	Get hour (0-23)
  getMinutes()	Get minute (0-59)
  getSeconds()	Get second (0-59)
  getMilliseconds()	Get millisecond (0-999)
  getTime()	Get time (milliseconds since January 1, 1970)*/
    
app.post('/approve', (req, res) => {
//console.log(req.body)
//remove the data from the pending of book approval.
  remotedb.get(req.body.approved._id, function(err, doc) {
    if (err) { return console.log(err); }
    //console.log(doc)
    
    remotedb.remove(doc, function(err, response) {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    //res.header("Content-Type", 'application/json')
    //res.send(JSON.stringify({status:'Successfully Approved Book: ' + req.body.approved._id}))
  }); 
  
  let updateUBooks;
// Approve book and update the users borrowed book.
  remotedb.query('temp/borrowers', {include_docs: true}).then((result) => {
    user = []
    /*for (let i = 0; i < this.user.length; i++) {
      //console.log(this.tempborrowerdata[i].firstName);
      if (
        req.body.approve.user === user.value
      ) {
        console.log("Found a match.")
      } else {
        console.log("Did not find a match.")
      }
    }
    */
    //result.rows.sort((a, b) => { return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 0 }).forEach((borrower) => {
    //user.push(borrower.doc)

     
    //})
    //display array console.log(result)
    result.rows.sort((a,b) => {return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 0}).forEach((borrower) => {
     user.push(borrower)
    })

    const matchedUser = user.filter(item => item.value.indexOf(req.body.approved.user) !== -1);
    //console.log(matchedUser)
    updateUBooks = matchedUser
    //console.log(updateUBooks[0].doc._id)
 
    //console.log(updateUBooks)

    
  remotedb.get(updateUBooks[0].doc._id, (err, doc)=>{
    //console.log(doc)
    if (err) {return console.log(err);}

    var updateuserBorrowedBooks = req.body.approved.requestedBook.title
    var docupdate = doc.borrowed
    console.log(docupdate)
    var constBorrowed = []
    if (!doc.borrowed || doc.borrowed === null) {
      remotedb.put({
        _id: doc._id,
        _rev: doc._rev,
        uid: doc._id,
        type: doc.type,
        firstName: doc.firstName,
        lastName: doc.lastName,
        phoneNumber: doc.phoneNumber,
        email: doc.email,
        birthdate: doc.birthdate,
        status: doc.status,
        borrowed: req.body.approved.requestedBook.title
        })
    }else if(Array.isArray(docupdate)){
      var updateuserBorrowedBooks = [req.body.approved.requestedBook.title]
      var docupdate = doc.borrowed
      constBorrowed = docupdate.concat(updateuserBorrowedBooks)
    remotedb.put({
      _id: doc._id,
      _rev: doc._rev,
      uid: doc._id,
      type: doc.type,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneNumber: doc.phoneNumber,
      email: doc.email,
      birthdate: doc.birthdate,
      status: doc.status,
      borrowed: constBorrowed
      })
    }else{
      constBorrowed.push(updateuserBorrowedBooks)
      constBorrowed.push(docupdate)
      remotedb.put({
        _id: doc._id,
        _rev: doc._rev,
        uid: doc._id,
        type: doc.type,
        firstName: doc.firstName,
        lastName: doc.lastName,
        phoneNumber: doc.phoneNumber,
        email: doc.email,
        birthdate: doc.birthdate,
        status: doc.status,
        borrowed: constBorrowed
        })
    }
    return doc;
  }).then((result)=>{
    //console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Updated User ' + req.body.approved.user}))
  }) 
  })
  
//Add the book to the approvedBook database.
  
  remotedb.upsert(req.body.reqId, (doc)=>{
    doc.id = req.body.reqId
    doc.type = req.body.type
    doc.expiry = newDate,
    doc.bookDetails = req.body.approved
    return doc
  }).then((result)=>{
    //console.log(result)
    //res.header("Content-Type", 'application/json')
    //res.send(JSON.stringify({status:'Approved Book ' + req.body.reqId}))
  })
  
})
// This api disapproves data.

// Make an api that updates the library users borrowed books and updates the copies registered in the database.

app.get('/approvedbooklist', (req, res) => {
  //console.log()
  remotedb.query('temp/approvedBook', {include_docs: true}).then((result) => {
    books = []
    result.rows.sort((a, b) => { return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 0 }).forEach((book) => {
    books.push(book.doc)
    })
    res.header("Content-Type", "application/json")
    res.send(books)
  })
})

//This api approves that the book has been returned.
app.post('/returnbook', (req, res) => {
  //console.log(req.body)

  remotedb.get(req.body.bookborrowed._id, function(err, doc) {
    if (err) { return console.log(err); }
    //console.log(doc)
    
    remotedb.remove(doc, function(err, response) {
      if (err) { return console.log(err); }
      // handle response
    });
  }).then((result)=>{
    //res.header("Content-Type", 'application/json')
    //res.send(JSON.stringify({status:'Successfully Approved Book: ' + req.body.approved._id}))
  });

  let updateBBooks;

// Return book and update the users borrowed book.
  remotedb.query('temp/borrowers', {include_docs: true}).then((result) => {
    user = []
    result.rows.sort((a,b) => {return a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 0}).forEach((borrower) => {
     user.push(borrower)
    })

    const matchedUser = user.filter(item => item.value.indexOf(req.body.bookborrowed.bookDetails.user) !== -1);
    //console.log(matchedUser)
    updateBBooks = matchedUser
    //console.log(updateBBooks[0].doc._id)
 
    //console.log(updateUBooks)

    
  remotedb.get(updateBBooks[0].doc._id, (err, doc)=>{
    if (err) {return console.log(err);}
    var filtered = doc.borrowed
    var bookToBeRemoved
    //console.log(filtered)

    /*for(let i = 0; i < filtered.length; i++){
      if( req.body.bookborrowed.bookDetails.requestedBook.title === filtered[i]){
        //console.log(filtered.indexOf(filtered[i]))
        bookToBeRemoved  = filtered.indexOf(filtered[i])
        //console.log(booksToBeRemoved)
        filtered.splice(filtered[i], 1) 
        //console.log(test)
        //console.log(filtered)
      }
    }*/ // Remove one instance of the same value. E.G. "Pilgrim's Inn; or, The Herb of Grace","All of grace","All of grace"

    var i = 0;
    while (i < filtered.length) {
    if (filtered[i] === req.body.bookborrowed.bookDetails.requestedBook.title) {
      filtered.splice(i, 1);
    } else {
      ++i;
    }
    } // Remove all instance of the same value. E.G. "Pilgrim's Inn; or, The Herb of Grace","All of grace","All of grace"

    //console.log(filtered)
    remotedb.put({
      _id: doc._id,
      _rev: doc._rev,
      uid: doc._id,
      type: doc.type,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneNumber: doc.phoneNumber,
      email: doc.email,
      birthdate: doc.birthdate,
      status: doc.status,
      borrowed: filtered
      })
    return doc;
  }).then((result)=>{
    //console.log(result)
    res.header("Content-Type", 'application/json')
    res.send(JSON.stringify({status:'Updated User ' + req.body.bookborrowed.bookDetails.user}))
  }) 
  })
})


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
  //console.log(req)
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
  //console.log(req.body) 

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
