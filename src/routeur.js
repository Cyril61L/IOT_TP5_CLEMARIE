require('dotenv').config();

var amqp = require('amqplib/callback_api');

const IP = process.env.IP || "127.0.0.1";
const username = process.env.username || 'guest';
const password = process.env.password || 'guest';

function routeur(amqp_connection, queue){

    amqp_connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(queue, {
            durable: false
        });

        channel.consume(queue, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
        }, {
            noAck: true
        });
    });
}

exports.routeur = routeur