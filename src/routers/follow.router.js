import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import accessMiddleware from '../middlewares/require-access-token.middleware.js';

const router = express.Router();

//구독 생성 /follow/:user_id
router.post('/:user_id', accessMiddleware, async (req, res, next) => {
    const { userId } = req.user;
    const params = req.params;
    const followeeId = params.user_id;

    const findFollower = await prisma.Follow.findFirst({
        where: { FollowerId: userId,
            FolloweeId: +followeeId}
    });

    if(findFollower){
        return res.status(400).json({
            status: 400,
            message: '이미 구독한 사용자 입니다.'
        });
    };

    const follower = await prisma.Follow.create({
        data: {
            FollowerId: userId,
            FolloweeId: +followeeId,
        }
    });

    return res.status(201).json({
        status: 201,
        message: '구독 신청에 성공했습니다.',
        data: follower,
      });
});

export default router;