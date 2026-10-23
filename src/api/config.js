/**
 * 백엔드 주소.
 *
 * 프로젝트 루트에 .env.local 을 만들고 한 줄만 적어 두면 됩니다.
 *
 *   VITE_API_BASE_URL=http://localhost:8080
 *
 * .env.example 을 복사해서 쓰세요. .env.local 은 깃에 올라가지 않습니다.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
