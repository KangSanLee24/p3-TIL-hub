import express from "express";
import cookieParser from "cookie-parser";
import { SEVER_PORT } from "./constants/env.constant.js";
import UserRouter from "./routers/user.router.js";
import PostRouter from "./routers/post.router.js";
import AuthRouter from "./routers/auth.router.js";
import FollowRouter from "./routers/follow.router.js";
import errorHandingMiddleware from "./middlewares/error-handler.middleware.js";
import deleteExpiredUsers from "./routers/delete-user.router.js";

const app = express();

app.use(express.json()); //body에 있는거 json으로 바꾸는 기능
app.use(express.urlencoded({ extended: true })); //form으로 들어오는 데이터를 body로 넘겨주는 기능
app.use(cookieParser());

app.use("/auth", [AuthRouter]);
app.use("/user", [UserRouter]);
app.use("/post", [PostRouter]);
app.use("/follow", [FollowRouter]);
app.use(errorHandingMiddleware);

setInterval(deleteExpiredUsers, 60 * 1000); //1분에 한번씩 실행

app.listen(SEVER_PORT, () => {
  console.log(SEVER_PORT, "포트로 서버가 열렸어요!");
});
