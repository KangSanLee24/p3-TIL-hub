import { prisma } from "../utils/prisma/index.js";

//유효기간 3분 지나면 데이터 삭제
//이메일 인증을 완료하지 않음
export default async function deleteExpiredUsers() {
  //현재 시간으로부터 3분전 시간 선언
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

  //디비에서 유저를 찾는데, createdAt시간이 3분전 보다 작은 것을 찾음
  const findUser = await prisma.User.findMany({
    where: {
        createdAt: {
            lt: threeMinutesAgo,
        },
        isEmailValid: false,
    },
    select: {userId: true,
             name : true},
  });

  //찾은 유저 배열 for문
  //디비에서 유저 삭제함
  for (const user of findUser) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.userInfo.deleteMany({
          where: { userId: user.userId },
        });

        await tx.user.deleteMany({
          where: { userId: user.userId },
        });
      });

      console.log(`${user.name} 유저 이메일 인증 유효기간 만료로 삭제`);
    } catch (error) {
      console.error(`Error deleting user ${user.name}:`, error);
    }
  }
};
