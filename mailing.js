var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host:  "corpsmtp.ultimatesoftware.com",
    port: 25,
    secure: false
});

var send = function(mailOptions) {
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      console.log('Message sent: ' + info.response);
  });
}

var generateOptions = function(email, parentString, commitCounter){
  return {
    from: '"Postmaster" <postmaster@ultimatesoftware.com>',
    to: email,
    subject: 'Merge Reminder',
    text: `Merge in ${parentString} to your branch. Your branch is more than ${commitCounter} commits behind.`
  }
};

module.exports = {
  transporter: transporter,
  send: send,
  generateOptions: generateOptions
};
