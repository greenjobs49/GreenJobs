const router = require("express").Router();
const auth = require("../middleware/auth");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit"); // ✅ import ipKeyGenerator

const {
  googleAuth,
  sendSignupOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
  logout
} = require("../controllers/auth.controller");

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => ipKeyGenerator(req), // ✅ handles IPv6 correctly
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests from this device. Please wait 10 minutes."
  }
});

router.post("/google", googleAuth);
router.post("/signup/send-otp", otpLimiter, sendSignupOtp);
router.post("/signup/verify-otp", verifySignupOtp);
router.post("/login/send-otp",  otpLimiter, sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/logout", auth, logout);

module.exports = router;