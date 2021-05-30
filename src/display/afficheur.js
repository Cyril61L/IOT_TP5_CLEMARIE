const {queues} = require("../db/routingdb")


function afficheur(amqp_connection) {

    for (const queue of queues)

        amqp_connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(queue, {
                durable: true
            });
            //console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
            channel.consume(queue, function (msg) {
                const data = JSON.parse(msg.content.toString())
                console.log("****************** Message of %s ***********************",queue)
                console.log("Client : ",data.client);
                console.log("Données : ",data.data);
            }, {
                noAck: true
            });
        });

}
exports.afficheur = afficheur