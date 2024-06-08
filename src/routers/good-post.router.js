import express from "express";
import requireAccessToken from "../middlewares/require-access-token.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

router.get('/aggregate', requireAccessToken, async (req, res, next) => {
    try{
        //접속일로부터 7일전 날짜 저장
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        //프리즈마 로우쿼리 사용해서 접속일로부터 7일전까지의 모든 til에서 가장 좋아요가 많은 퍼블릭 게시글 뽑는 쿼리 수행
        const getPost = await prisma.$queryRaw`
        select
            a.til_id ,
            c.name ,
            a.title,
            a.content,
            a.created_at,
            max(b.like_count) as like_count
        from
            (
            select
                til_id,
                user_id ,
                title,
                content,
                created_at
            from
                til
            where created_at >= NOW() - INTERVAL 7 DAY
            and visibility = 'PUBLIC') a
        join 
        (
            select
                til_id,
                count(*) as like_count
            from
                like_log
            group by
                til_id) b
        on
            a.til_id = b.til_id
        join user c
        on
            a.user_Id = c.user_id;
      `;

        //좋아요가 같은 게시글 2개가 나올 수 있으므로 배열 -> map
        //좋아요: Number로 다시 숫자 선언해준 이유 : bigint타입으로 출력되어서 화면에 출력이 안되는 오류가 있었음. 그래서 넘버로 다시 선언해줌
        const printPost = getPost.map((post) => ({
            '작성자': post.name,
            '제목': post.title,
            '내용': post.content,
            '작성일자': post.created_at,
            '좋아요': Number(post.like_count)
        }));

        return res.status(200).json({
            status: 200,
            message: '이번주 좋아요가 가장 많은 TIL 입니다.',
            data: printPost,
        });
    }catch(error){
        next(error);
    }
})

export default router;