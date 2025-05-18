const JWT = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication token not provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = JWT.verify(token, process.env.ACCESS_TOKEN);
        console.log('SECRET:', process.env.ACCESS_TOKEN);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(403).json({ error: 'The token is invalid' });
    }
};

module.exports = authenticateUser;