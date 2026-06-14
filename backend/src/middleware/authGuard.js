const jwt = require('jsonwebtoken');

const authGuard = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access Denied. Invalid or expired authentication token.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access Denied. Invalid or expired authentication token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Inject decoded payload straight into req.user
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Access Denied. Invalid or expired authentication token.' });
  }
};

module.exports = authGuard;
