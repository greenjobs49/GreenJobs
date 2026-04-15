const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/otp");
const generateOtp = require("../utils/generateOtp");
const sendOtpEmail = require("../utils/sendOtpEmail");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "Email required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login.",
      });

    const otp = generateOtp();

    await Otp.deleteMany({ email, purpose: "signup" });
    await Otp.create({
      email,
      otp,
      purpose: "signup",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("sendSignupOtp error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp, role, firstName, lastName, mobile } = req.body;

    if (!email || !otp || !role || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${!email ? "email " : ""}${!otp ? "otp " : ""}${!role ? "role " : ""}${!firstName ? "firstName " : ""}${!lastName ? "lastName" : ""}`,
      });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const otpDoc = await Otp.findOne({ email, otp, purpose: "signup" });
    if (!otpDoc)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: "User already exists. Please login." });

    const userData = {
      email,
      name:       fullName,
      role,
      mobile:     mobile || "",
      password:   "OTP_AUTH",
      isVerified: true,
      status:     "active",
    };

    if (role === "jobseeker") {
      userData.jobSeekerProfile = {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        fullName,
      };
    }

    const user = await User.create(userData);

    await otpDoc.deleteOne();

    const token    = createToken(user);
    const fullUser = await User.findById(user._id).select("-password");

    return res.json({
      success: true,
      message: "Signup successful",
      user:    fullUser,
      token,
    });

  } catch (err) {
    console.error("verifySignupOtp error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already registered. Please login." });
    }

    return res.status(500).json({ success: false, message: err.message || "Signup failed. Please try again." });
  }
};

exports.sendLoginOtp = async (req, res) => {
  try {
    const { email, expectedRole } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "No account found with this email." });

    // ── Role guard at OTP send stage ────────────────────────────────────────
    if (expectedRole && user.role !== expectedRole) {
      const portalMap = {
        jobseeker: "/login",
        recruiter: "/recruiter/login",
        business:  "/business/login",
        admin:     "/admin/login",
      };
      const roleLabel = {
        jobseeker: "Job Seeker",
        recruiter: "Recruiter",
        business:  "Business Owner",
        admin:     "Administrator",
      };
      return res.status(403).json({
        success: false,
        message: `This email belongs to a ${roleLabel[user.role] || user.role} account. Please sign in from the correct portal.`,
        correctPortal: portalMap[user.role] || "/login",
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    const otp = generateOtp();

    await Otp.deleteMany({ email, purpose: "login" });
    await Otp.create({
      email,
      otp,
      purpose:   "login",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("sendLoginOtp error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, expectedRole } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email & OTP required" });

    const otpDoc = await Otp.findOne({ email, otp, purpose: "login" });
    if (!otpDoc)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const user = await User.findOne({ email }).select("-password");
    if (!user)
      return res.status(400).json({ success: false, message: "User not found" });

    // ── Role guard ──────────────────────────────────────────────────────────
    if (expectedRole && user.role !== expectedRole) {
      // Do NOT delete the OTP — user may retry on the correct portal
      const portalMap = {
        jobseeker: "/login",
        recruiter: "/recruiter/login",
        business:  "/business/login",
        admin:     "/admin/login",
      };
      return res.status(403).json({
        success: false,
        message: `This email is registered as a "${user.role}" account. Please use the correct login portal.`,
        correctPortal: portalMap[user.role] || "/login",
      });
    }
    // ───────────────────────────────────────────────────────────────────────

    await otpDoc.deleteOne();

    const token = createToken(user);

    res.json({ success: true, message: "Login successful", user, token });

  } catch (err) {
    console.error("verifyLoginOtp error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token)
      return res.status(400).json({ success: false, message: "Google token required" });

    const ticket = await googleClient.verifyIdToken({
      idToken:  token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload         = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      if (!role)
        return res.json({
          success:     false,
          requireRole: true,
          message:     "Role required for first-time signup",
        });

      user = await User.create({
        email,
        name,
        role,
        password:   "GOOGLE_AUTH",
        isVerified: true,
        status:     "active",
      });
    }

    const jwtToken = createToken(user);
    const fullUser = await User.findById(user._id).select("-password");

    res.json({
      success: true,
      message: "Google authentication successful",
      user:    fullUser,
      token:   jwtToken,
    });

  } catch (err) {
    console.error("googleAuth error:", err);
    res.status(500).json({ success: false, message: "Google authentication failed" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};