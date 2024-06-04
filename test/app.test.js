import request from 'supertest';
import app from '../src/app';

describe('POST /til', () => {
  test('유효한 게시물을 생성하는지 확인', async () => {
    const validPostData = {
      title: 'Valid Title',
      content: 'Valid Content',
      category: 'Valid Category',
      visibility: 'public'
    };

    const response = await request(app)
      .post('/til')
      .send(validPostData);

    expect(response.status).toBe(200);
    // 여기에서 응답 본문의 구조 및 내용을 확인하는 코드를 추가할 수 있습니다.
  });

  test('유효하지 않은 게시물을 생성하는지 확인', async () => {
    const invalidPostData = {
      // 유효하지 않은 데이터를 보낼 경우
    };

    const response = await request(app)
      .post('/til')
      .send(invalidPostData);

    expect(response.status).toBe(400);
    // 여기에서 응답 본문의 내용이 유효성 오류 메시지인지 확인하는 코드를 추가할 수 있습니다.
  });
});
