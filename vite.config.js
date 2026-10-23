import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 프런트는 5173, 서버는 8080 에서 각각 돕니다.
// 출처가 다르므로 서버 쪽에서 CORS 를 열어 줘야 합니다 (프록시는 쓰지 않습니다).
export default defineConfig({
  plugins: [react()],
})
