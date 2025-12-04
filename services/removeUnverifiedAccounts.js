const cron = require("node-cron");
const User  = require("../models/userModel.js");

const removeUnverifiedAccounts = () => {
  // Run every 5 minutes. Disable recovery of missed executions so node-cron
  // doesn't log warnings if the process was busy or restarted.
  cron.schedule(
    "*/5 * * * *",
    async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      try {
        await User.deleteMany({
          accountVerified: false,
          createdAt: { $lt: thirtyMinutesAgo },
        });
      } catch (error) {
        console.error(
          "Some error occurred while removing unverified accounts.",
          error
        );
      }
    },
    {
      recoverMissedExecutions: false,
    }
  );
};

module.exports = { removeUnverifiedAccounts };
