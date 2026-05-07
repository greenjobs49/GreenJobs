const cron = require("node-cron");
const User = require("../models/User");
const email = require("../services/emailService");

const REMINDER_INTERVALS = [
  { key: "1hr",   ms:       60 * 60 * 1000 },
  { key: "1day",  ms:   24 * 60 * 60 * 1000 },
  { key: "2days", ms:   48 * 60 * 60 * 1000 },
  { key: "1week", ms:  168 * 60 * 60 * 1000 },
];

async function sendScheduledReminders() {
  try {
    const now = Date.now();

    const users = await User.find({
      profileCompleted: { $ne: true },
      role: { $in: ["jobseeker", "recruiter", "business"] },
      createdAt: { $lte: new Date(now - REMINDER_INTERVALS[0].ms) },
    }).select("name email role createdAt remindersSent");

    let sent = 0;

    for (const user of users) {
      const age = now - new Date(user.createdAt).getTime();
      const alreadySent = user.remindersSent || [];

      const due = REMINDER_INTERVALS.filter(
        (r) => age >= r.ms && !alreadySent.includes(r.key)
      );

      if (!due.length) continue;

      // Send only the most recent due reminder
      const reminder = due[due.length - 1];

      try {
        if (user.role === "jobseeker") {
          await email.sendJobseekerProfileReminderEmail(user.email, user.name, reminder.key);
        } else if (user.role === "recruiter") {
          await email.sendRecruiterProfileReminderEmail(user.email, user.name, reminder.key);
        } else if (user.role === "business") {
          await email.sendBusinessProfileReminderEmail(user.email, user.name, reminder.key);
        }

        // Mark all elapsed intervals as sent (handles cron downtime catch-up)
        await User.updateOne(
          { _id: user._id },
          { $addToSet: { remindersSent: { $each: due.map((r) => r.key) } } }
        );

        sent++;
      } catch (err) {
        console.error(`[ReminderCron] Failed for ${user.email}:`, err.message);
      }
    }

    if (sent > 0) console.log(`[ReminderCron] Sent ${sent} reminder(s)`);
  } catch (err) {
    console.error("[ReminderCron] Fatal error:", err);
  }
}

function startProfileReminderCron() {
  cron.schedule("*/30 * * * *", sendScheduledReminders);
  console.log("[ReminderCron] Started — runs every 30 minutes");
}

module.exports = { startProfileReminderCron, sendScheduledReminders };