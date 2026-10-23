import { request } from './client.js'
import { fromProfile, toPageInfo, toPost, toPublicProfile } from './mappers.js'

/**
 * 프로필 · 내가 쓴 글 · 다른 사람의 프로필
 */

/**
 * 프로필 저장
 *
 *   PUT /api/members/me/profile
 *   보내는 것 ProfileRequest { bio, profileImage, snsLink }
 *   응답 ProfileResponse { memberId, nickname, bio, profileImage, snsLink }
 *
 * 프로필이 아직 없으면 서버가 만들어 줍니다.
 * 닉네임은 프로필이 아니라 회원 정보입니다 → auth.updateMe 를 씁니다.
 * 프로필 수정 화면 하나가 API 두 개를 부르는 셈입니다.
 *
 * profileImage 와 snsLink 는 http:// 또는 https:// 로 시작해야 합니다(아니면 400).
 * 사진은 files.uploadImage 로 먼저 올려서 받은 주소를 넣습니다.
 */
export async function updateProfile({ bio, profileImage, snsLink }) {
  const payload = fromProfile({ bio, profileImage, snsLink })
  const res = await request('/api/members/me/profile', { method: 'PUT', body: payload })
  return {
    bio: res.bio ?? '',
    profileImage: res.profileImage ?? null,
    snsLink: res.snsLink ?? '',
  }
}

/**
 * 내가 쓴 글
 *
 *   GET /api/members/me/posts?pageNumber=&pageSize=&sortBy=id&sortOrder=desc
 *   응답 PageResponse<PostResponse>
 *
 * 감춘 글도 들어 있습니다. 글쓴이에게는 "숨김" 표를 달아서 보여 줍니다.
 * 글 목록과 같은 이유로 sortOrder=desc 를 보냅니다.
 */
export async function fetchMyPosts({ pageNumber = 1, pageSize = 10 } = {}) {
  const query = { pageNumber, pageSize, sortBy: 'id', sortOrder: 'desc' }
  const res = await request('/api/members/me/posts', { query })
  return { items: res.content.map(toPost), page: toPageInfo(res) }
}

/**
 * 다른 사람의 회원 정보 (공개)
 *
 *   GET /api/public/members/{memberId}
 *   응답 MemberPublicResponse { id, nickname, createdAt }
 *
 * 탈퇴한 회원이면 404 입니다.
 */
export async function fetchMember(memberId) {
  const res = await request(`/api/public/members/${memberId}`)
  return res
}

/**
 * 다른 사람의 프로필 (공개)
 *
 *   GET /api/public/members/{memberId}/profile
 *   응답 ProfileResponse { memberId, nickname, bio, profileImage, snsLink }
 *
 * 프로필을 입력하지 않은 회원도 404 가 아니라 빈 프로필로 답합니다.
 */
export async function fetchMemberProfile(memberId) {
  const res = await request(`/api/public/members/${memberId}/profile`)
  return res
}

/** 회원 정보와 프로필을 한 화면에 쓸 모양으로 합칩니다. */
export async function fetchPublicProfile(memberId) {
  const [member, profile] = await Promise.all([fetchMember(memberId), fetchMemberProfile(memberId)])
  return toPublicProfile(member, profile)
}
