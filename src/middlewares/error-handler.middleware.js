export default function (err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    let errorMessage;
    switch (err.message) {
      case '"email" must be a string':
        errorMessage = "이메일을 문자열로 입력해 주세요.";
        break;
      case '"email" is required':
      case '"email" is not allowed to be empty':
        errorMessage = "이메일을 입력해 주세요.";
        break;
      case '"email" must be a valid email':
        errorMessage = "이메일 형식이 올바르지 않습니다.";
        break;
      case '"name" must be a string':
        errorMessage = "이름을 문자열로 입력해 주세요.";
        break;
      case '"name" is required':
      case '"name" is not allowed to be empty':
        errorMessage = "이름을 입력해 주세요.";
        break;
      case '"password" must be a string':
        errorMessage = "비밀번호를 문자열로 입력해 주세요.";
        break;
      case '"password" is required':
      case '"password" is not allowed to be empty':
        errorMessage = "비밀번호를 입력해 주세요.";
        break;
      case '"password" length must be at least 6 characters long':
        errorMessage = "비밀번호는 6자리 이상이어야 합니다.";
        break;
      case '"passwordConfirm" must be a string':
        errorMessage = "확인 비밀번호를 문자열로 입력해 주세요.";
        break;
      case '"passwordConfirm" is not allowed to be empty':
      case '"passwordConfirm" is required':
        errorMessage = "확인 비밀번호를 입력해 주세요.";
        break;
      case '"phoneNumber" must be a string':
        errorMessage = "전화번호 형식에 맞게 입력해 주세요.";
        break;
      case '"phoneNumber" is required':
      case '"phoneNumber" is not allowed to be empty':
        errorMessage = "전화번호를 입력해 주세요.";
        break;
      case '"profileImage" is required':
      case '"profileImage" is not allowed to be empty':
        errorMessage = "프로필 이미지 URL을 입력해 주세요.";
        break;
      case '"profileImage" length must be less than or equal to 500 characters long':
        errorMessage = "프로필 이미지 URL은 최대 500자까지 입력할 수 있습니다.";
        break;
      case '"description" is required':
      case '"description" is not allowed to be empty':
        errorMessage = "자기소개를 입력해 주세요.";
        break;
      case '"description" length must be less than or equal to 500 characters long':
        errorMessage = "자기소개는 500자까지 입력할 수 있습니다.";
        break;
      case '"content" is required':
      case '"content" must be a string':
        errorMessage = "내용을 문자열로 입력해 주세요.";
        break;
      case '"content" is not allowed to be empty':
        errorMessage = "내용을 입력해 주세요.";
        break;
      case '"category" must be a string':
        errorMessage = "카테고리를 문자열로 입력해 주세요.";
        break;
      case '"visibility" must be a string':
      case '"visibility" must be one of [PUBLIC, FOLLOWER, MANAGER, PRIVATE]':
        errorMessage = "공개 범위를 정확히 입력해 주세요.";
        break;
      case '"sort" must be one of [asc, desc, likes]':
        errorMessage = "정렬 방식은 'asc', 'desc' 또는 'likes' 이여야 합니다.";
        break;
      default:
        if (err.message.includes('"phoneNumber" with value')) {
          errorMessage =
            "전화번호 형식에 맞게 입력해 주세요. (예: 010-1234-5678)";
        } else if (
          err.message.includes('"name" with value') &&
          err.message.includes("fails to match the required pattern")
        ) {
          errorMessage = "이름은 한글만 입력 가능합니다.";
        } else {
          errorMessage = "에러가 발생했습니다.";
        }
    }
    return res.status(400).json({
      status: 400,
      errorMessage,
    });
  }

  if (err.name === "SyntaxError") {
    return res.status(400).json({
      status: 400,
      message: "JSON 형식이 올바르지 않습니다.",
    });
  }
  return res.status(500).json({
    status: 500,
    message: "예상치 못한 에러가 발생했습니다. 관리자에게 문의해 주세요.",
  });
}
