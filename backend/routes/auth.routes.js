const router = require("express").Router();
const auth = require("../middleware/auth");

const {
  googleAuth,
  sendSignupOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
  logout
} = require("../controllers/auth.controller");
router.post("/google", googleAuth);
router.post("/signup/send-otp", sendSignupOtp);
router.post("/signup/verify-otp", verifySignupOtp);
router.post("/login/send-otp", sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/logout", auth, logout);

module.exports = router;
