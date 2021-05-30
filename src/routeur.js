require('dotenv').config();

const {check_code} = require('./authdb')
const {get_queue, code_valid} = require("./routingdb")
const userFile = require("./authdb");
//var amqp = require('amqplib/callback_api');

//const IP = process.env.IP || "127.0.0.1";
//const username = process.env.username || 'guest';
//const password = process.env.password || 'guest';

function checkValidQueue(code, username){

    const found = userFile.userTab.find(user => user.username === username);
    const check = found.authorizedQueues.includes(code);

    if(check)  console.log("Trafic valide")
    else console.log("Trafic illégale")

    return check;

}

function routeur(amqp_connection, queue){

    amqp_connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(queue, {
            durable: true
        });

        channel.consume(queue, function(msg) {
            const data = JSON.parse(msg.content.toString())
            console.log(" Routeur reçoit ", msg.content.toString());

            const valid = checkValidQueue(parseInt(data.destinataire), data.username);

            if(valid){
                const queue = get_queue(data.destinataire)

                channel.assertQueue(queue, {
                    durable: true
                });
                channel.sendToQueue(queue, Buffer.from(data.toString()));
            }


        }, {
            noAck: true
        });
    });
}

exports.routeur = routeur