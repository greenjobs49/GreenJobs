const User = require("../models/User");
const email = require("../services/emailService");

const BATCH_SIZE = 10; // send 10 emails at a time, not 1-by-1

const sendEmailForUser = async (user) => {
  if (user.role === "jobseeker") {
    await email.sendJobseekerProfileReminderEmail(user.email, user.name);
  } else if (user.role === "recruiter") {
    await email.sendRecruiterProfileReminderEmail(user.email, user.name);
  } else if (user.role === "business") {
    await email.sendBusinessProfileReminderEmail(user.email, user.name);
  }
};

const processBatches = async (users) => {
  let sent = 0;
  const errors = [];

  // Process in batches of BATCH_SIZE (parallel within each batch)
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((user) => sendEmailForUser(user))
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        errors.push({
          user: batch[idx].email,
          error: result.reason?.message || "Unknown error",
        });
      }
    });
  }

  return { sent, errors };
};

/**
 * POST /api/admin/send-profile-reminders
 * Returns immediately with a count of users queued,
 * then processes emails in the background.
 */
exports.sendProfileReminders = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const incompleteUsers = await User.find({
      profileCompleted: { $ne: true },
      createdAt: { $lte: oneDayAgo },
      role: { $in: ["jobseeker", "recruiter", "business"] },
    }).select("name email role");

    if (incompleteUsers.length === 0) {
      return res.json({
        success: true,
        message: "No incomplete users to remind.",
        sent: 0,
        failed: 0,
      });
    }

    //Respond immediately so the HTTP request doesn't time out
    res.json({
      success: true,
      message: `Sending reminders to ${incompleteUsers.length} user(s) in the background.`,
      sent: incompleteUsers.length, // optimistic count
      failed: 0,
    });

    //Process emails AFTER responding (fire-and-forget, won't block the client)
    processBatches(incompleteUsers)
      .then(({ sent, errors }) => {
        console.log(`[Reminders] Done: ${sent} sent, ${errors.length} failed`);
        if (errors.length > 0) {
          console.error("[Reminders] Failures:", errors);
        }
      })
      .catch((err) => {
        console.error("[Reminders] Fatal error in background processing:", err);
      });

  } catch (err) {
    console.error("REMINDER SEND ERROR:", err);
    // Only reachable if the User.find() itself fails (before res.json)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
exports.sendIndividualProfileReminder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reminderKey } = req.body; // Optional: "1hr", "1day", "2days", "1week"
 
    // Validate user exists and has email
    const user = await User.findById(userId).select("name email role profileCompleted");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 
    if (!user.email) {
      return res.status(400).json({ 
        success: false, 
        message: "User has no email address on file" 
      });
    }
 
    if (!["jobseeker", "recruiter", "business"].includes(user.role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot send reminder to ${user.role} accounts` 
      });
    }
 
    const key = reminderKey || "1day"; // default to 1day
 
    // Send role-specific reminder email
    if (user.role === "jobseeker") {
      await email.sendJobseekerProfileReminderEmail(user.email, user.name, key);
    } else if (user.role === "recruiter") {
      await email.sendRecruiterProfileReminderEmail(user.email, user.name, key);
    } else if (user.role === "business") {
      await email.sendBusinessProfileReminderEmail(user.email, user.name, key);
    }
 
    return res.json({
      success: true,
      message: `Profile reminder sent to ${user.name} (${user.email})`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Send individual reminder error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to send reminder" 
    });
  }
};