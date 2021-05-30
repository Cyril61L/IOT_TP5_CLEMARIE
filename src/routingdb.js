const queues = {
    1: "Internal queue",
    2: "External queue 1",
    3: "External queue 2"
}

exports.queues = Object.values(queues)

exports.get_queue = code => queues[code]

exports.code_valid = code => Object.keys(queues).includes(code.toString())