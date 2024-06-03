import express from 'express';
import cookieParser from 'cookie-parser';
import { SEVER_PORT } from './constants/env.constant.js';
import UserRouter from './routers/user.router.js';
import PostRouter from './routers/post.router.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/user', UserRouter);
app.use('/post', PostRouter);

app.listen(SEVER_PORT, () => {
  console.log(`${SEVER_PORT} 포트로 서버가 열렸어요!`);
});
