#!/usr/bin/nodemon

/* jshint sub:true */

var https = require('https');
var http = require('http')

var fs = require('fs')
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;

var express = require('express')
var app = express()

var session = require('express-session');

var lti = require('ims-lti')
var _ = require('lodash')
var bodyParser = require('body-parser')
var marked = require('marked');

var rp = require('request-promise-native');

var arr = require('./compilers');
var sandBox = require('./DockerSandbox');

const dirTree = require("directory-tree");
var jsdiff = require('diff');


app.use(session({
  secret: 'Work Hard and Enjoy the Fruits at SPU',
  resave: true,
  saveUninitialized: false
}));


var Busboy = require('busboy')

// var multer = require('multer');
// var upload = multer({ dest: './uploads/' })

//var storage = multer.memoryStorage()
//var upload = multer({ storage: storage })

var ltiKey = '7de2ba53fd4af87c19e79d7c5717e3cd98910ec8'
var ltiSecret = '76186446c84e6e5a70d710cbf14758717a19001d'

const testFolder = './files/'

app.engine('pug', require('pug').__express)

// app.use(express.bodyParser())
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json())

app.set('view engine', 'pug')
app.use(express.static('files'))
app.use(express.static('public'))

app.get('/test1/:userId/:fileName', function (req, res, next) {
  res.render('image', {
    filepath: '/' + req.params.userId + '/' + req.params.fileName
  });
});

app.get('/initiateDB', function(req, res, next) {
  var url = "mongodb://localhost:27017/autograder";
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
  });
  
  url = "mongodb://localhost:27017/";
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("autograder");
    dbo.createCollection("assignments", function(err, res) {
      if (err) throw err;
      console.log("Collection created!");
      db.close();
    });
  });

  res.status(200).send('DB is working and collection created');
});

function random(size) {
  //returns a crypto-safe random
  return require("crypto").randomBytes(size).toString('hex');
}

app.post('/submit', function(req, res) {
  var files = {}
  var testinfo = req.session.testinfo;
  
  if (testinfo == null) {
    res.json({ message: 'test info is missing. contact to the instructor or admin'});
    res.end();
    return;
  }

  var busboy = new Busboy({ 
    headers: req.headers,
    limits: {
      fileSize: 128*1024
    }
    // 128kb file size limit
  });

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
    file.on('data', function(data) {
      console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      if(files[filename] == null) {
        files[filename] = data;
      }
      else {
        files[filename] = Buffer.concat([files[filename], data]);
      }
    });
    file.on('limit', function(){
      console.log('Size limit exceeded');
    });

    file.on('end', function() {
      console.log('File [' + fieldname + '] Finished');
    });
  });
  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    console.log('Field [' + fieldname + ']: value: ' + inspect(val));
  });
  busboy.on('finish', function() {
    console.log('submit: done parsing form, ' + Object.keys(files).length + ' files received');

    // check files
    // var msg = 'files received: '
    // for(var i in files) {
    //   msg += i + ',';
    // }

    var msg = '';

    missingFiles = testinfo.submissionfiles.filter(x => !Object.keys(files).includes(x));

    if (missingFiles.length > 0) {
      msg = 'The following files are missing: ';
      for(var i in missingFiles) {
        msg += missingFiles[i]
        if (i+1 < missingFiles.length)
          msg += ', ';
      }
      msg += '. Check if you have correctly submitted those files with size > 0.'
      
      res.json({ passed: false, output: 'Missing File(s)', errors: msg});
      res.end();
    }
    else {
      var language = 7; //req.body.language;
      var code = files['main.cpp']; //req.body.code;
      var stdin = ''; //req.body.stdin;
   
      // we got correct filenames and ready to run compilation
      var folder= 'temp/' + random(10); //folder in which the temporary folder will be saved
      var path=__dirname+"/"; //current working path
      var vm_name='virtual_machine'; //name of virtual machine that we want to execute
      var timeout_value=5;//Timeout Value, In Seconds
  
      //details of this are present in DockerSandbox.js
      var sandboxType = new sandBox(timeout_value,path,folder,req.session.testPath,testinfo,files,
        vm_name,arr.compilerArray[language][0],arr.compilerArray[language][1],code,arr.compilerArray[language][2],
        arr.compilerArray[language][3],arr.compilerArray[language][4],stdin);
  
  
      //data will contain the output of the compiled/interpreted code
      //the result maybe normal program output, list of error messages or a Timeout error
      sandboxType.run(function(passed,data,files,exec_time,err)
      {
        //console.log("Data: received: "+ data)
        
        // result.??? 와 result.???.current
        

        var totalweights = 0;
        var earnedgrades = 0;
        for(var i in testinfo['gradeweights']) {
          totalweights += testinfo['gradeweights'][i];
          if (files.pass[i])
            earnedgrades += testinfo['gradeweights'][i];
        }

        var reportable = (totalweights == earnedgrades) ? true : testinfo['allowpartialgrade'];
        req.session.reportable = reportable;
        req.session.totalweights = totalweights;
        req.session.earnedgrades = earnedgrades;
        req.session.grade = earnedgrades / totalweights;

        var gradepresentation = '' + (Math.round(earnedgrades / totalweights * 1000) / 10) + '%';

        if (err != null || err != '') {
          err = err.replace(/(?:\r\n|\r|\n)/g, '<br>');
        }
        
        var testcases = null;

        if (files != null) {
          testcases = [];

          for(let i = 0; i < files.pass.length; i++) {
            var thiscase = {};
            thiscase.passed = files.pass[i];
            thiscase.id = i+1;
            thiscase.weight = 'Weight: ' + (Math.round(testinfo.gradeweights[i] / totalweights * 1000) / 10) + '%';
            thiscase.in = files.in[i].replace(/(?:\r\n|\r|\n)/g, '<br>');
            var ans = '', out = '';

            var diff = jsdiff.diffChars(files.ans[i], files.out[i]);
            
            diff.forEach(function(part){
              // green for additions, red for deletions
              // grey for common parts
              
              if (part.added) {
                var style1 = 'color: red; background-color: yellow;';
                out += '<span style="' + style1 + '">'
                  + part.value.replace(/(?:\r\n|\r|\n)/g, '<br>') + '</span>';
              }
              else if (part.removed) {
                // only ans
                var style1 = 'color: red; background-color: yellow;';// : 'color: black';
                ans += '<span style="' + style1 + '">'
                  + part.value.replace(/(?:\r\n|\r|\n)/g, '<br>') + '</span>';
              }
              else {
                // both
                ans += '<span style="color: black;">'
                  + part.value.replace(/(?:\r\n|\r|\n)/g, '<br>') + '</span>';
                out += '<span style="color: black;">'
                  + part.value.replace(/(?:\r\n|\r|\n)/g, '<br>') + '</span>';
              }
            });

            thiscase.ans = ans;
            thiscase.out = out;
            testcases.push(thiscase);
          }
        }
        
        res.render('submitres',
          {
            passed: passed,
            result: data,
            errors: err,
            time: exec_time,
            testcases: testcases,
            reportable: reportable,
            totalweights:totalweights,
            earnedgrades:earnedgrades,
            grade: gradepresentation
          });
        // res.send({passed:passed, totalweights:totalweights, earnedgrades:earnedgrades,
        //   weights: testinfo['gradeweights'], reportable:reportable, output:data,
        //   files:files, langid: language, code:code, errors:err, time:exec_time});
      });
    }
  });

  req.pipe(busboy);

});

app.get('/assignmentlink/*', function (req, res, next) {
  console.log(req.params[0]);
  console.log(req.session);

  if (req.session.courseid == null || req.session.assignmentid == null) {
    var msg = 'Invalid Link Request - Failed.';
    res.render('deadendmsg',
      {
        message: msg,
        header: 'Assignment Linked',
        title: 'Assignment Link Failed'
      });
    return;
  }

  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("autograder");
    var myobj = {
      custom_canvas_course_id: req.session.courseid,
      custom_canvas_assignment_id: req.session.assignmentid,
      assignment_folder: req.params[0]
    };

    dbo.collection("assignments").insertOne(myobj, function(err, result) {
      if (err) throw err;
      db.close();
      var msg = 'Course ' + req.session.coursename + ' (' + req.session.courseid + ') - Assignment '
        + '"' + req.session.assignmentname + ' (' + req.session.assignmentid + ')" has been mapped into '
        + 'folder ' + req.params[0] + '. You can close this window now.';
      res.render('deadendmsg',
        {
          message: msg,
          header: 'Assignment Linked',
          title: 'Assignment Linked'
        });
    });
  });  
});

function dirFlatten(result, dirNode) {
  result.push(dirNode.path);
  if (dirNode.children.length > 0) {
    dirNode.children.forEach(element => {
      dirFlatten(result, element);
    });
  }
}

function showAssignment (req, res, next) {
  // User is Auth so pass back when ever we need.
  var username = req.session.username + (req.session.instructor ? ' (instructor)' : '');

  console.log(
    '\n' +
      new Date().toLocaleString('default', {
        timeZone: 'America/Vancouver'
      }) +
      ' test access by ' +
      username
  );

  var testPath = req.session.testPath;

  var infoFile = testPath + 'info.json';
  var fileContent = fs.readFileSync(infoFile);
  var testinfo = JSON.parse(fileContent);

  req.session.testinfo = testinfo;

  var instruction = '';
  console.log('teriouspark: ' + testinfo['instructionfiles']);
  for(var i in testinfo['instructionfiles']) {
    //console.log(testPath + testinfo['instructionfiles'][i])
    var instFileContent = fs.readFileSync(testPath + testinfo['instructionfiles'][i], "utf8");
    instruction += marked(instFileContent);
  }

  console.log('teriouspark: ' + testinfo['submissionfiles']);
  console.log('teriouspark: ' + instruction);

  res.render('submission', {
    title: "SPU CSC Autograder Submission Page",
    // CourseID: 'CourseID: ' + req.body['context_id'],
    // userID: 'UserID: ' + req.body['user_id'],
    // UserRole: 'Course Role: ' + req.body['roles'],
    // FulllogTitle: 'Full Log: ',
    // Fulllog: JSON.stringify(req.body)
    submissionfiles: testinfo['submissionfiles'],
    dependencyfiles: testinfo['dependencyfiles'],
    instruction: instruction,
    username: username
  });
}

app.get('/teriouspark', function (req, res, next) {
  req.session.username = 'twp_test';
  req.session.testpath = './assignments/1229F19/A1/';

  showAssignment(req, res, next);
});

async function LTIOutcomeReportBack(req, url, sourcedid, grade) {
  var url = req.session.outcomeurl;
  var sourcedid = req.session.resultdid;
  var grade = req.session.grade;

  var payload1 = '<?xml version = "1.0" encoding = "UTF-8"?><imsx_POXEnvelopeRequest xmlns = "http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0"><imsx_POXHeader><imsx_POXRequestHeaderInfo><imsx_version>V1.0</imsx_version><imsx_messageIdentifier>999999123</imsx_messageIdentifier></imsx_POXRequestHeaderInfo></imsx_POXHeader><imsx_POXBody><replaceResultRequest><resultRecord><sourcedGUID><sourcedId>';
  var payload2 = '</sourcedId></sourcedGUID><result><resultScore><language>en</language><textString>';
  var payload3 = '</textString></resultScore></result></resultRecord></replaceResultRequest></imsx_POXBody></imsx_POXEnvelopeRequest>';

  var outcomeMsg = payload1 + sourcedid + payload2 + grade + payload3;

  var logMsg = 'Grade Report. UserID: ' + req.session.userid
    + ' CourseID: ' + req.session.courseid + ' AssignmentID: ' + req.session.assignmentid
    + ' Grade: ' + grade + ' Result: ';

  // https://www.npmjs.com/package/request-promise
  var request_promise_native_options = {
    method: 'POST',
    uri: url,
    oauth: {
      consumer_key: ltiKey,
      consumer_secret: ltiSecret,
      body_hash: true
    },
    headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(outcomeMsg)
    },
    body: outcomeMsg,
    json: false // automatically stringifys body to json if true
  };

  try {
    parsedBody = await rp(request_promise_native_options);

    // POST succeeded...
    console.log(logMsg + 'Success');
    console.log(parsedBody);

    return true;
  }
  catch (err) {
    // POST failed...
    console.log(logMsg + 'Failed');
    console.log(err);

    return false;
  }

  return false;
}

app.get('/gradereport', function (req, res, next) {
  if (req.session.reportable == true) {
    if (req.session.outcomeurl && req.session.resultdid) {
      var success = LTIOutcomeReportBack(req);
      
      if (success) {
        res.render('deadendmsg', {
          message: 'Your submission grade was successfully reported. You can close this page.',
          header: 'Grade Reported',
          title: 'Grade Reported'
        });
        return;
      }
      else {
        res.render('deadendmsg', {
          message: 'Your submission grade report has failed. Reach out to your instructor.',
          header: 'Grade Report Failed',
          title: 'Grade Report Failed'
        });
        return;
      }
    }
  }

  res.render('deadendmsg', {
    message: 'Invalid request. Reach out to your instructor.',
    header: 'Grade Report Failed',
    title: 'Grade Report Failed'
  });

});

app.post('/launch_lti', bodyParser.urlencoded({ extended: true }), bodyParser.json(), function (req, res, next) {
  req.body = _.omit(req.body, '__proto__');
  console.log(JSON.stringify(req.body, null, 2));
  if (req.body['oauth_consumer_key'] === ltiKey) {
    var provider = new lti.Provider(ltiKey, ltiSecret);
    // Check is the Oauth  is valid.
    provider.valid_request(req, function (err, isValid) {
      if (err) {
        console.log('Error in LTI Launch:' + err);
        res.status(403).send(err);
      } else {
        if (!isValid) {
          console.log('\nError: Invalid LTI launch.');
          res.status(500).send({ error: 'Invalid LTI launch' });
        } else {
          // User is Auth so pass back when ever we need.
          // Instructor check: if(req.body['roles'] == 'Instructor')
          // Student check: if(req.body['roles'] == 'Learner')
          
          // test: checking if there's matching assignment ID
          req.session.instructor = (req.body['roles'] == 'Instructor');
          var url = "mongodb://localhost:27017/";
          var username = req.body['lis_person_contact_email_primary'].replace(
            '@spu.edu',
            ''
          );

          MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("autograder");
            var query = {
              custom_canvas_course_id: req.body['custom_canvas_course_id'],
              custom_canvas_assignment_id: req.body['custom_canvas_assignment_id']
            };
            dbo.collection("assignments").find(query).toArray(function(err, result) {
              if (err) throw err;
              console.log(result);
              db.close();

              if (result.length == 0) {
                console.log("No Match");
                if(req.session.instructor) { // no match, instructor: let her choose one.
                  req.session.courseid = req.body['custom_canvas_course_id'];
                  req.session.coursename = req.body['context_title'];
                  req.session.assignmentid = req.body['custom_canvas_assignment_id'];
                  req.session.assignmentname = req.body['custom_canvas_assignment_title'];

                  // leaving only directories, dropping 'solution' dir, all files (by giving always false regex for extensions)
                  const tree = dirTree('assignments', { extensions: /(?=a)b/, exclude: /solution/ });
                  console.log(JSON.stringify(tree, null, 2));

                  var dirs = [];
                  dirFlatten(dirs, tree);
                  console.log(dirs);
                  
                  res.render('selectfolder', {
                    title: "Select Folder for Autograder",
                    // FulllogTitle: 'Full Log: ',
                    // Fulllog: JSON.stringify(req.body),
                    // CourseID: 'CourseID: ' + req.body['context_id'],
                    // userID: 'UserID: ' + req.body['user_id'],
                    // UserRole: 'Course Role: ' + req.body['roles'],
                    username: 'Welcome, ' + username,
                    dirs: dirs,
                    courseid: req.body['custom_canvas_course_id'],
                    coursename: req.body['context_title'],
                    assignmentid: req.body['custom_canvas_assignment_id'],
                    assignmentname: req.body['custom_canvas_assignment_title']
                  });
                }
                else { // no mapping, no instructor: dead end. sorry msg
                  res.render('deadendmsg',
                  {
                    message: 'This assignment is not linked yet. Reach out to your course instructor.',
                    header: 'No Link Exists',
                    title: 'No Link Exists'
                  });
                }
              }
              else { // match exist
                var assignmentpath = result[0].assignment_folder;
                req.session.testPath = './' + assignmentpath + '/';
                req.session.username = username;
                req.session.outcomeurl = req.body['lis_outcome_service_url'];
                req.session.resultdid = req.body['lis_result_sourcedid'];
                req.session.userid = req.body['custom_canvas_user_id'];
                req.session.courseid = req.body['custom_canvas_course_id'];
                req.session.assignmentid = req.body['custom_canvas_assignment_id'];

                showAssignment(req, res, next);
              }
            });
          });

          return;

          // reference for later. grade report.
          if(req.body['roles'] == 'Learner') {
            LTIOutcomeReportBack(req.body['lis_outcome_service_url'], req.body['lis_result_sourcedid'], '0.50');
          }
          
        }
      }
    });
  } else {
    console.log('LTI KEY NOT MATCHED:');
    res.render('deadendmsg',
    {
      message: 'LTI Key Not Matched. Reach out to your course instructor with this message.',
      header: 'LTI KEY NOT MATCHED',
      title: 'LTI KEY NOT MATCHED'
    });
  }
});

// Setup the http server
var server = http
  .createServer(app)
  .listen(process.env.PORT || 9090, function () {
    console.log('http server started')
  });
