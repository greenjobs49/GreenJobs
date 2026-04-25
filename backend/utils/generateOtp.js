const crypto = require("crypto");

module.exports = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};