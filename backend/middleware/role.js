const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    //Check if req.user exists before checking role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = authorizeRoles;