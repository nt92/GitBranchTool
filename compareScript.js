var exec = require('child_process').exec;
var mailing = require('./mailing.js');
var gitcomparison = require('./gitcomparison.js');

// var cmd = `git -C C:/projects/recruiting show-branch  | grep '*' | grep -v "$(git -C C:/projects/recruiting rev-parse --abbrev-ref HEAD)" | head -n1 | sed 's/.*\[\(.*\)\].*/\1/' | sed 's/[\^~].*//' | xargs git -C C:/projects/recruiting show $1 | awk "NR==1{print;exit}" | awk -F' ' '{print $2}'`;
var cmdPart1 = "git -C C:/projects/recruiting show-branch";
var cmdPart2 = "grep '*'";
var cmdPart3 = 'grep -v "currentBranch"';
var cmdPart4 = "head -n1";
var cmdPart5 = "sed 's/.*\\[\\(.*\\)\\].*/\\1/'";
var cmdPart6 = "sed 's/[\\^~].*//'";
var cmdPart7 = "git -C C:/projects/recruiting show parentBranch";
var cmdPart8 = 'awk "NR==1{print;exit}"';
var cmdPart9 = "awk -F' ' '{print $2}'";

var cmd1, cmd2, cmd3;
var parentID;

var branchCommits = [];
var parentCommits = [];
var parentString = "master";
var headIsMaster = false;
var upToDate = false;

function executeScript(cmd) {
  return new Promise(function(resolve, reject) {
    exec(cmd, function(error, stdout, stderr) {
      console.log(stdout);
      resolve(stdout);
      reject(error);
    });
  })
}

function sendMail() {
  var cmdGetUserEmail = 'git -C C:/projects/recruiting config user.email';
  executeScript(cmdGetUserEmail)
  .then(function(email) {
    var mailOptions = mailing.generateOptions(email, parentString, gitcomparison.commitCounter);
    mailing.send(mailOptions);
  });
}

(function checkCommits() {
  var cmdGetHeadBranch = 'git -C C:/projects/recruiting rev-parse --abbrev-ref HEAD';
  return executeScript(cmdGetHeadBranch).then(function(currentBranch) {
    var current = currentBranch.replace(/(\r\n|\n|\r)/gm,"");
    if(current == 'master') {
      headIsMaster = true;
    }
    cmdPart3 = `grep -v "${current}"`;
    var cmdGetParentBranch = `${cmdPart1} | ${cmdPart2} | ${cmdPart3} | ${cmdPart4} | ${cmdPart5} | ${cmdPart6}`;
    return executeScript(cmdGetParentBranch);
  })
  .then(function(parentBranch) {
    var parent = parentBranch.replace(/(\r\n|\n|\r)/gm,"");
    parent = parent.replace(/(\^\d)+/,"");
    parent = parent.replace("^","");
    parentString = parent;
    cmdPart7 = `git -C C:/projects/recruiting show ${parent}`;
    var cmdGetParentOID = `${cmdPart7} | ${cmdPart8} | ${cmdPart9}`;
    return executeScript(cmdGetParentOID);
  })
  .then(function(parentOID) {
    parentID = parentOID.replace(/(\r\n|\n|\r)/gm,"");

    var allCommits = [
      gitcomparison.getCommitList(),
      gitcomparison.getCommitList(parentID)
    ]

    Promise.all(allCommits)
      .then(function(results){
         parentCommits = results[0];
         branchCommits = results[1];

         upToDate = gitcomparison.compareArrays(parentCommits, branchCommits);
         if(upToDate || headIsMaster){
           console.log("No need to merge");
         }
         else{
           sendMail();
           console.log("Merge in parent!");
         }
      })
      .catch(function(err) {
        console.log("ERROR: " + err)
      })
  });
})()
