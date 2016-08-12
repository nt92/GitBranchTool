var Git = require("nodegit");
var path = "C:/projects/recruiting";

var commitCounter = 5;

var getParentsFromCommit = function(parents, ourCommits) {
  ourCommits.push(parents[0].id());
  return parents[0].getParents();
}

var compareArrays = function(a, b) {
  var flag = false;
  a.forEach(function(item) {
    b.forEach(function(item1) {
      if(item.equal(item1)) {
        flag = true;
      }
    })
  })
  return flag;
}

var getCommitList = function(commit) {
  var ourCommits = [];
  return new Promise(function(resolve, reject) {
    var parentsPromise = Git.Repository.open(path)
    .then(function(repo) {
      if(!commit) {
        return repo.getHeadCommit();
      }
      else {
        return repo.getCommit(commit);
      }
    })
    .then(function(commit) {
      var parents = commit.getParents();
      return parents;
    });

    var counter = commitCounter;
    while (counter-- > 1) {
      parentsPromise = parentsPromise.then(function(parents) {
        return getParentsFromCommit(parents, ourCommits);
      })
    }

    parentsPromise.then(function(parents) {
      ourCommits.push(parents[0].id());
    })
    .then(function() {
      resolve(ourCommits);
    })
    .catch(function(err) {
      reject(err);
    });
  });
}

module.exports = {
  getParentsFromCommit: getParentsFromCommit,
  compareArrays: compareArrays,
  getCommitList: getCommitList,
  commitCounter: commitCounter
};
