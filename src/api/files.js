import { request } from './client.js'

/**
 * 이미지 올리기
 *
 *   POST /api/files
 *   보내는 것 multipart/form-data, 칸 이름 file
 *   응답 201 FileUploadResponse { url }   (+ Location 헤더에 같은 주소)
 *
 * 받은 url 은 http://.../api/public/files/{이름} 처럼 서버 주소까지 붙은 절대 주소입니다.
 * 이 주소를 글의 thumbnail 이나 프로필의 profileImage 에 그대로 넣어 저장합니다.
 * 이미지를 보는 주소(/api/public/files/**)는 로그인 없이 열립니다. <img src> 로 바로 씁니다.
 *
 * PNG · JPEG · GIF · WebP 만, 5MB 까지 받습니다.
 *   다른 형식   400 { message: "PNG, JPEG, GIF, WebP 이미지만 올릴 수 있습니다." }
 *   5MB 초과    413 { message: "파일은 5MB 이하만 올릴 수 있습니다." }
 *
 * JSON 이 아니라 FormData 로 보냅니다. client.js 가 FormData 를 받으면
 * Content-Type 을 직접 붙이지 않고 브라우저에게 맡깁니다.
 */
export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await request('/api/files', { method: 'POST', body: form })
  return res.url
}
