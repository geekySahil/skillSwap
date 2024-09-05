class APIError extends Error{
    constructor(statusCode, message = "something went wrong"){
        super();
        this.statusCode = statusCode,
        this.message = message
    }
}

export {APIError}