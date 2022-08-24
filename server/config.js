exports.JWT_SECRET = process.env.JWT_SECRET || `${Math.random()}`
exports.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'
exports.PORT = parseInt(process.env.PORT || "8000")