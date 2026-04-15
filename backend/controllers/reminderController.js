const User = require("../models/User");
const email = require("../services/emailService");

/**
 * POST /api/admin/send-profile-reminders
 * Can be called manually by admin OR by a cron job.
 * Sends reminder only to users whose profile is still incomplete
 * and who registered more than 24 hours ago (avoids spamming new signups).
 */
exports.sendProfileReminders = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const incompleteUsers = await User.find({
      profileCompleted: { $ne: true },
      createdAt: { $lte: oneDayAgo },
      role: { $in: ["jobseeker", "recruiter", "business"] },
    }).select("name email role");

    let sent = 0;
    const errors = [];

    for (const user of incompleteUsers) {
      try {
        if (user.role === "jobseeker") {
          await email.sendJobseekerProfileReminderEmail(user.email, user.name);
        } else if (user.role === "recruiter") {
          await email.sendRecruiterProfileReminderEmail(user.email, user.name);
        } else if (user.role === "business") {
          await email.sendBusinessProfileReminderEmail(user.email, user.name);
        }
        sent++;
      } catch (err) {
        errors.push({ user: user.email, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Reminders sent to ${sent} user(s).`,
      sent,
      failed: errors.length,
      errors,
    });
  } catch (err) {
    console.error("REMINDER SEND ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};