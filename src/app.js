import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { SERVER_PORT } from './constants/env.constant.js';
import UserRouter from './routers/user.router.js';
import PostRouter from './routers/post.router.js';
import CommentRouter from './routers/comment.router.js';
import { validatePost } from './middlewares/validators/validation.middleware.js';
import AuthRouter from './routers/auth.router.js';
import likesRouter from './routers/likes.js'

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.use('/auth', AuthRouter);
app.use('/user', UserRouter);
app.use('/til', [PostRouter, CommentRouter]); // PostRouter와 CommentRouter 사용하는 부분

// 게시글 생성과 수정에 대한 미들웨어 추가
app.post('/til', validatePost); // 게시글 생성 시 유효성 검사
app.put('/til/:id', validatePost); // 게시글 수정 시 유효성 검사

app.get('/posts', authenticateToken, async (req, res) => {
    const sort = req.query.sort || 'desc';
    try {
        const posts = await prisma.til.findMany({
            orderBy: {
                createdAt: sort
            },
            include: {
                LikeLogs: true,
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        const response = posts.map(post => ({
            id: post.id,
            userId: post.userId,
            userName: post.user.name,
            title: post.title,
            content: post.content,
            category: post.category,
            visibility: post.visibility,
            likeNumber: post.LikeLogs.length,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        }));

        res.status(200).json({
            status: 200,
            message: "게시글 목록 조회에 성공했습니다.",
            data: response
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
});

app.get('/post/:id', authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.id);
    try {
        const post = await prisma.til.findUnique({
            where: { id: postId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                LikeLogs: true,
                Comments: true
            }
        });

        if (!post) {
            return res.status(400).json({
                status: 400,
                message: "게시글이 존재하지 않습니다."
            });
        }

        res.status(200).json({
            status: 200,
            message: "게시글 상세 조회에 성공했습니다.",
            data: {
                id: post.id,
                userId: post.user.id,
                userName: post.user.name,
                title: post.title,
                content: post.content,
                category: post.category,
                visibility: post.visibility,
                likeNumber: post.LikeLogs.length,
                comments: post.Comments,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            }
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
});

app.use('/til/:til_id', likesRouter);

app.listen(SERVER_PORT, () => {
    console.log(`${SERVER_PORT} 포트로 서버가 열렸어요!`);
});
