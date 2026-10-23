/**
 * 화면 전용 상수.
 *
 * 서버와는 상관없는, 한 페이지에 몇 개를 보여 줄지에 대한 값입니다.
 * 목록 API 를 부를 때 pageSize 로 그대로 넘깁니다.
 */

/** 글 목록 한 페이지. 서버에 pageSize 로 그대로 보냅니다 */
export const PAGE_SIZE = 4;

/** 마이페이지는 위에 프로필 블록이 있어 목록보다 작게 끊습니다. */
export const MY_PAGE_SIZE = 3;

/** 관리자 목록은 줄이 촘촘해서 조금 더 담습니다. */
export const ADMIN_PAGE_SIZE = 5;

/** 카테고리 칩은 전부 한 줄에 보여 주므로 넉넉히 받아 옵니다. */
export const CATEGORY_FETCH_SIZE = 100;

/** 로그인에 쓰는 계정 종류. 우리 서버는 구글만 연결합니다. */
export const PROVIDER_LABELS = {
  local: "이메일",
  google: "Google",
};
