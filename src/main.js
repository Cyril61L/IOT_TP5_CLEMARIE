require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const schemas = require("./schemas");
var validate = require('jsonschema').validate;
const userFile = require("./db/authdb");

const {routeur} = require("./router/routeur")
const {afficheur} = require("./display/afficheur")


const IP = process.env.IP || "127.0.0.1";
const username = process.env.username || 'guest';
const password = process.env.password || 'guest';

const opt = { credentials: require('amqplib').credentials.plain(username, password) };

const app = express();
const host = 'localhost'; // Utiliser 0.0.0.0 pour être visible depuis l'exterieur de la machine
const port = 8000;

const ACCESS_TOKEN_SECRET = "123456789";
const ACCESS_TOKEN_LIFE = 1200;


function login(data,res) {

    console.log('Username:',data.username,'Passwd:',data.password,'dest:',data.destinataire);


    let validation = validate(data,schemas.login_schema);
    // Check result is valid
    if (validation.valid) {
        // find the actual user on authdb file
        const found = userFile.userTab.find(user => user.username === data.username);

        if ((data.username === found.username)  && (data.password === found.password)) {

            let j = jwt.sign({"username":data.username,"destinataire":data.destinataire}, ACCESS_TOKEN_SECRET, {
                algorithm: "HS512",
                expiresIn: ACCESS_TOKEN_LIFE
                });
            // Reply to client as error code 200 (no error in HTTP); Reply data format is json
            res.writeHead(200, {'Content-Type': 'application/json'});
            // Send back reply content
            res.end(JSON.stringify({"error":0,"message":j}));
        } else {
            // Reply to client as error code 200 (no error in HTTP); Reply data format is json
            res.writeHead(401, {'Content-Type': 'application/json'});
            // Send back reply content
            res.end(JSON.stringify({"error":-1,"message":"login error"}));
        }
    } else {
        res.writeHead(401, {'Content-Type': 'application/json'});
        // Send back reply content
        res.end(JSON.stringify({"error":-1,
                        "message":"Invalid query: " + validation.errors.map(d => { return d.message + ";";})}));

    }
}


function postdata(data,res,channel,queue) {

    console.log("Post Data",data);
    // Check JWT validity
    let validation = validate(data,schemas.postdata_schema);
    if (validation.valid) {
        jwt.verify(data.jwt, ACCESS_TOKEN_SECRET, function(err, decoded) {
                if (err) { // There is an error: invalid jwt ...
                    res.writeHead(401, {'Content-Type': 'application/json'});
                    // Send back reply content
                    res.end(JSON.stringify({"error":-1,"message":"JWT error"}));
                } else {
                    // Ok no problem: Adding data
                    res.writeHead(201, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({"error":0,"message":"data added"}));

                    sendData(decoded,data,channel,queue);
                }
            });
    } else {
        res.writeHead(401, {'Content-Type': 'application/json'});
        // Send back reply content
        res.end(JSON.stringify({"error":-1,
                        "message":"Invalid query: " + validation.errors.map(d => { return d.message + ";";})}));
    }
}


/**
 *
 * Occur when an unkown url was called
 *
 */
function f404(data,res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(404);
    res.end(JSON.stringify({"error":-1,"message":"404"}));
}

function bail(err) {
    console.error(err);
    process.exit(1);
}

function sendData(client,data,channel,queue) {

            channel.sendToQueue(queue, Buffer.from(JSON.stringify({
                username : client.username,
                destinataire : client.destinataire,
                data : data.data.complexdata
            })));
            console.log(" Backend send the following message into \"from_backend\" queues %s", data);

}

function runExpress(channel,queue) {

    app.use(bodyParser.json());

    app.post('/pushdata', (req, res) => {
        var body = req.body;
        //console.log(body);
        postdata(body,res,channel,queue);

    });

    app.post("/login", (req, res) => {
        var body = req.body;
        //console.log(body);
        login(body,res);
    });

    app.get('/*', (req, res) => {
        //console.log("GET 404", req.originalUrl);
        f404(null,res);
    });
    app.post('/*', (req, res) => {
        console.log("POST 404",req.originalUrl);
        f404(null,res);
    });

    app.listen(port, host, () => {
        console.log(`Server is running at http://${host}:${port}`);
    });
}

function consumer(amqp_connection){

    amqp_connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        const queue = "from_backend";

        channel.assertQueue(queue, {
            durable: true
        });
        runExpress(channel,queue);
    });
}

function run(){

    require('amqplib/callback_api')
        .connect('amqp://' + IP, opt, function(err, conn) {
            if (err != null) bail(err);
            consumer(conn);
            routeur(conn,"from_backend");
            afficheur(conn);

        });

}



exports.run = run;
