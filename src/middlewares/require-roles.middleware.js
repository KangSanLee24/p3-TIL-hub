import { prisma } from '../utils/prisma/index.js';

export const requireRoles = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const params = req.params;
    const tilId = params.til_id;

    const user = await prisma.User.findFirst({
      where: { userId: +userId },
      select: { role: true },
    });

    const til = await prisma.TIL.findFirst({
        where: { tilId: +tilId },
        select: { userId: true,
                visibility: true },
      });

    const follower = await prisma.Follow.findMany({
        where: { FolloweeId : til.userId },
        select: { FollowerId : true },
    });

    //private
    if(til.visibility === 'private'){
        if(til.userId != +userId){
            return res.status(403).json({
                status: 403,
                message: '접근 권한이 없습니다.',
              });
        };
        return next();
    };

    //manager
    if(til.visibility === 'manager'){
        if(til.userId != +userId){
            if(user.role != 'MANAGER'){
                return res.status(403).json({
                    status: 403,
                    message: '접근 권한이 없습니다.',
                  });
            };
        };
        return next();
    };

    //follower
    const followerIds = follower.map(f => f.FollowerId);

    if(til.visibility === 'follower'){
        if(!followerIds.includes(+userId)){
            return res.status(403).json({
                status: 403,
                message: '접근 권한이 없습니다.',
              });
        };
        return next();
    };

    return next();

  } catch (error) {
    next(error);
  }
};