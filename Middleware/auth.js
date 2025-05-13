const authenticateUser = (req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'User ID is required in header' });
    }
    req.userId = userId; 
    next();
};

module.exports = authenticateUser;