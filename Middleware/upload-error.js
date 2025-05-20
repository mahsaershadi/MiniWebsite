const multer = require('multer');
const uploadError = (err, req, res, next) => {
    if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'The file size is greater than 5 MB' });
        }
        return res.status(400).json({ error: err.message || 'Error uploading file' });
    }
    next(); 
};

module.exports = uploadError;