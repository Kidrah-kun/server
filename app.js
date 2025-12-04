const express = require("express");
const { config } = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const {connectDB} = require("./database/db");
config({ path: "./config/config.env" });
const {errorMiddleware} = require("./middlewares/errorMiddlewares.js");
const authRouter = require("./routes/authRouter.js");
const bookRouter = require("./routes/bookRouter.js")
const borrowRouter = require("./routes/borrowRouter.js");
const userRouter = require("./routes/userRouter.js");
const { notifyUsers } = require("./services/notifyUsers.js") 
const { removeUnverifiedAccounts } = require("./services/removeUnverifiedAccounts.js");
const expressFileUpload = require("express-fileupload");


app.use(cors({
    origin:[process.env.FRONTEND_URL],
    methods:["GET","POST","PUT","DELETE"],
    credentials:true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileUpload({
    useTempFiles:true,
    tempFileDir:"/tmp/"
}));

// here /api/v1/auth is a static uri , ex- authRouter = http://localhost:4000, 
// therefore final result will be http://localhost:4000/api/v1/auth
app.use("/api/v1/auth",authRouter);
app.use("/api/v1/book",bookRouter);
app.use("/api/v1/borrow",borrowRouter);
app.use("/api/v1/user",userRouter);
notifyUsers();
removeUnverifiedAccounts();
connectDB();

app.use(errorMiddleware);
module.exports = { app };