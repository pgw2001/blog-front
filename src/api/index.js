/**
 * api 모아 두는 곳
 *
 * 화면과 store 에서는 이 파일로만 들여옵니다.
 *
 *   import { api } from '../api/index.js'
 *   const post = await api.posts.fetchPost(id)
 */

import * as posts from './posts.js'
import * as auth from './auth.js'
import * as profile from './profile.js'
import * as admin from './admin.js'
import * as files from './files.js'

export { ApiError } from './client.js'
export { API_BASE_URL } from './config.js'

export const api = { posts, auth, profile, admin, files }
