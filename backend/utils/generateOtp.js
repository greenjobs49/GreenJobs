const crypto = require("crypto");

module.exports = () => {
  // ✅ Cryptographically secure random 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};