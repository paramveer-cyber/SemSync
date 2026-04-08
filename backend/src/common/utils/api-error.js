class ApiError extends Error {
    constructor(status, msg) {
        super(msg);
        this.statusCode = status;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static notFound(msg = "Not Found") {
        return new ApiError(404, msg);
    }

    static badRequest(msg = "Bad Request") {
        return new ApiError(400, msg);
    }

    static unAuthorized(msg = "Unauthorized") {
        return new ApiError(401, msg);
    }

    static forbidden(msg = "Forbidden") {
        return new ApiError(403, msg);
    }

    static unknown(msg = "Unknown"){
        return new ApiError(404, msg);
    }
}

export default ApiError;