require('dotenv').config();


const {get_queue, code_valid} = require("../db/routingdb")
const userFile = require("../db/authdb");



function checkValidQueue(code, username){

    const found = userFile.userTab.find(user => user.username === username);
    const check = found.authorizedQueues.includes(code);

    if(check)  console.log("Trafic valide \n")
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
            console.log(" Routeur receive %s \n", msg.content.toString());

            const valid = checkValidQueue(parseInt(data.destinataire), data.username);

            if(valid){
                const queue = get_queue(data.destinataire)

                channel.assertQueue(queue, {
                    durable: true
                });

                channel.sendToQueue(queue, Buffer.from(JSON.stringify({
                    client : data.username,
                    data : data.data
                })));
            }


        }, {
            noAck: true
        });
    });
}

exports.routeur = routeur