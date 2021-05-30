// Implementation with axios
const axios = require('axios');
const argparser = require('argparse');

const parser = argparser.ArgumentParser({
    description: 'Argparse example'
});

parser.add_argument('-l', '--login');
parser.add_argument('-p', '--password');
parser.add_argument('-t', '--destinataire');


console.dir(parser.parse_args());
var args = parser.parse_args();

// Setting default value
let login = args.login;
let password = args.password;
let destinataire = args.destinataire;


/**
   Apply command received by pull
*/
function apply_command(cmd) {
    if (cmd.error == 0) {
        switch (cmd.message.type) {
        case "print":
            console.log(cmd.message.data);
            break;
        case "end":
            process.exit(0);
            break;
        default:
            console.error("Invalid command:",cmd.message.type);
        }
    } else {
        console.error("Command error",cmd);
    }
}


/*
  action performed each 30 seconds
*/
function action(jwt) {
    axios.post("http://localhost:8000/pushdata",{jwt:jwt,data:{complexdata:'ok'}})
        .then(function(d) {
            console.log("POSTDATA",d.data);
        })
        .catch(function (error) {
            console.log("PUSHDATA ERROR",error);
        });
}


/* Doing POST ... Imbricate them*/
axios.post("http://localhost:8000/login",{username: login, password: password,destinataire:destinataire})
          .then(function(d) {
              var jwt = d.data.message;
              action(jwt);

          }).catch(function (error) {
              // handle error
              console.log("LOGIN ERROR",error);
          });
