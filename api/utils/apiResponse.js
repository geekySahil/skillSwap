class APIResponse {
    constructor(statusCode, data, message = 'success'){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message
    }

}

export {APIResponse}