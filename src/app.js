import express from "express";
import cookieParser from "cookie-parser";
import { SEVER_PORT } from "./constants/env.constant.js";
import UserRouter from "./routers/user.router.js";
import PostRouter from "./routers/post.router.js";
import CommentRouter from "./routers/comment.router.js";

const app = express();

app.use(express.json()); //body에 있는거 json으로 바꾸는 기능
app.use(express.urlencoded({ extended: true })); //form으로 들어오는 데이터를 body로 넘겨주는 기능
app.use(cookieParser());
app.use("/user", [UserRouter]);
app.use("/til", [PostRouter, CommentRouter]);

app.listen(SEVER_PORT, () => {
  console.log(SEVER_PORT, "포트로 서버가 열렸어요!");
});
