const transporter = require("../config/email");

module.exports = async (email, otp) => {
  await transporter.sendMail({
    from: `"Green Jobs" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code for Verification",
    html: `<h3>Your OTP is <b>${otp}</b></h3><p>Valid for 5 minutes</p>`
  });
};
