const cron = require("node-cron");  
const User = require("../models/userModel.js")
const Borrow = require("../models/borrowModel.js")

const notifyUsers = () => {
    // Run every 30 minutes. Disable "missed execution" recovery to avoid noisy
    // node-cron warnings when the event loop is briefly blocked or the process restarts.
    cron.schedule(
        "*/30 * * * *",
        async () => {
            try {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const borrowers = await Borrow.find({
                    dueDate: {
                        $lt: oneDayAgo,
                    },
                    returnDate: null,
                    notified: false,
                });

                for (const element of borrowers) {
                    if (element.user && element.user.email) {
                        // Mark as notified without sending email
                        element.notified = true;
                        await element.save();
                    }
                }
            } catch (error) {
                console.error("Some error occurred while notifying the users.", error);
            }
        },
        {
            recoverMissedExecutions: false,
        }
    );
};

module.exports = { notifyUsers };
