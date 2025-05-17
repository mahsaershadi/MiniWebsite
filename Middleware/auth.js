const authenticateUser = (req, res, next) => {
    console.log('Middleware executing...');
    const userId = req.headers['user-id'];
    console.log('Received user-id:', userId);
    if (!userId) {
        return res.status(401).json({ error: 'User ID is required in header' });
    }
    req.userId = userId; 
    console.log('Setting req.userId to:', userId);
    next();
};

module.exports = authenticateUser;