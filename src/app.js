import express from "express";
import cookieParser from "cookie-parser";
import { SERVER_PORT } from "./constants/env.constant.js";
import UserRouter from "./routers/user.router.js";
import PostRouter from "./routers/post.router.js";
import AuthRouter from "./routers/auth.router.js";
import FollowRouter from "./routers/follow.router.js";
import CommentRouter from "./routers/comment.router.js";
import CommentLikeRouter from "./routers/comment-like.router.js";
import errorHandlerMiddleware from "./middlewares/error-handler.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/auth", AuthRouter);
app.use("/user", UserRouter);
app.use("/til", [PostRouter, CommentRouter, LikesRouter]);
app.use("/comment", [CommentLikeRouter]);
app.use("/follow", FollowRouter);
app.use(errorHandlerMiddleware);

app.listen(SERVER_PORT, () => {
  console.log(`서버가 ${SERVER_PORT} 포트로 열렸어요!`);
});
