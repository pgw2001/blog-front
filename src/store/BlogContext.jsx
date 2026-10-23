import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { api, ApiError } from '../api/index.js'
import { getAccessToken } from '../api/client.js'
import { emptyPage } from '../api/mappers.js'
import { CATEGORY_FETCH_SIZE, PROVIDER_LABELS } from '../ui.js'

/**
 * 화면이 쓰는 상태가 전부 여기 있습니다.
 *
 * 서버를 부르는 일은 이 파일에서만 일어납니다. 각 동작은
 *   1. api 를 부르고
 *   2. 돌아온 값으로 dispatch 해서 화면을 맞춥니다.
 *
 * 지금 api 는 가짜 응답(src/data/mock.js)을 돌려줍니다.
 * api 폴더의 함수들이 실제 서버를 부르게 되면 이 파일은 손대지 않아도 됩니다.
 */

const BlogContext = createContext(null)

const initialState = {
  // 로그인 전에는 null
  session: null,

  categories: [],

  // 읽는 쪽 글 목록. 한 쪽 분량만 들고 있습니다 (거르기도 끊기도 서버가 합니다)
  posts: [],
  postPage: emptyPage,
  postsLoading: true,

  // 글 id 별 댓글. 댓글은 글과 따로 받아 오므로 따로 들고 있습니다
  comments: {},

  ...emptyUserLists(),

  loading: true,   // 첫 로딩
  error: null,     // 마지막으로 실패한 요청의 메시지
}

/**
 * 로그인한 사람에 따라 달라지는 목록. 로그아웃하면 비웁니다.
 *
 * ...Loaded 는 한 번이라도 받아 왔는지입니다. 받아 오기 전에는 "글이 없습니다" 대신
 * 스켈레톤을 보여 줘야 하는데, 빈 배열만으로는 "아직 안 받음"과 "받았는데 없음"을 구분할 수 없습니다.
 */
function emptyUserLists() {
  return {
    // 마이페이지 — 내가 쓴 글
    myPosts: [],
    myPostPage: emptyPage,
    myPostsLoaded: false,

    // 관리자 — 감춘 글까지 포함한 전체 글
    adminPosts: [],
    adminPostPage: emptyPage,
    adminPostsLoaded: false,

    // 관리자 — 회원
    members: [],
    memberPage: emptyPage,
    membersLoaded: false,
  }
}

/** 목록 안의 글 하나만 바꿔 끼웁니다. */
function patchIn(list, id, patch) {
  return list.map((p) => (String(p.id) === String(id) ? { ...p, ...patch } : p))
}

function removeIn(list, id) {
  return list.filter((p) => String(p.id) !== String(id))
}

function reducer(state, action) {
  switch (action.type) {
    /* ── 불러오기 ─────────────────────────────────────────── */
    case 'load/start':
      return { ...state, loading: true, error: null }
    case 'load/done':
      return { ...state, ...action.payload, loading: false }
    case 'load/fail':
      return { ...state, loading: false, error: action.message }
    case 'error/set':
      return { ...state, error: action.message }
    case 'error/clear':
      return { ...state, error: null }
    /** 받아 오다 실패해도 "받아 옴"으로 칩니다. 스켈레톤이 끝없이 남지 않게 합니다. */
    case 'loaded/mark':
      return { ...state, [action.key]: true }

    /* ── 세션 ─────────────────────────────────────────────── */
    case 'session/set':
      return action.session
        ? { ...state, session: action.session }
        : { ...state, ...emptyUserLists(), session: null }
    case 'session/patch':
      return { ...state, session: { ...state.session, ...action.patch } }

    /* ── 글 ───────────────────────────────────────────────── */
    case 'posts/loading':
      return { ...state, postsLoading: true }
    case 'posts/set':
      return { ...state, posts: action.items, postPage: action.page, postsLoading: false }
    case 'posts/fail':
      return { ...state, postsLoading: false }
    case 'myPosts/set':
      return { ...state, myPosts: action.items, myPostPage: action.page, myPostsLoaded: true }
    case 'adminPosts/set':
      return { ...state, adminPosts: action.items, adminPostPage: action.page, adminPostsLoaded: true }

    /** 목록에 있으면 갈아 끼우고, 없으면 더합니다 (주소로 바로 들어온 경우). */
    case 'post/upsert': {
      const known = state.posts.some((p) => String(p.id) === String(action.post.id))
      return {
        ...state,
        posts: known
          ? patchIn(state.posts, action.post.id, action.post)
          : [...state.posts, action.post],
      }
    }
    case 'post/patch':
      return {
        ...state,
        posts: patchIn(state.posts, action.id, action.patch),
        myPosts: patchIn(state.myPosts, action.id, action.patch),
        adminPosts: patchIn(state.adminPosts, action.id, action.patch),
      }
    case 'post/remove':
      return {
        ...state,
        posts: removeIn(state.posts, action.id),
        myPosts: removeIn(state.myPosts, action.id),
        adminPosts: removeIn(state.adminPosts, action.id),
      }

    /* ── 댓글 ─────────────────────────────────────────────── */
    case 'comments/set':
      return { ...state, comments: { ...state.comments, [String(action.id)]: action.items } }
    case 'comments/add':
      return {
        ...state,
        comments: {
          ...state.comments,
          [String(action.id)]: [...(state.comments[String(action.id)] ?? []), action.comment],
        },
      }
    case 'comments/patch':
      return {
        ...state,
        comments: {
          ...state.comments,
          [String(action.id)]: patchIn(state.comments[String(action.id)] ?? [], action.comment.id, action.comment),
        },
      }
    case 'comments/remove':
      return {
        ...state,
        comments: {
          ...state.comments,
          [String(action.id)]: removeIn(state.comments[String(action.id)] ?? [], action.commentId),
        },
      }

    /* ── 카테고리 ─────────────────────────────────────────── */
    case 'categories/set':
      return { ...state, categories: action.items }
    case 'categories/add':
      return { ...state, categories: [...state.categories, action.category] }
    case 'categories/replace':
      return { ...state, categories: patchIn(state.categories, action.category.id, action.category) }
    case 'categories/remove':
      return { ...state, categories: removeIn(state.categories, action.id) }

    /* ── 회원 ─────────────────────────────────────────────── */
    case 'members/set':
      return { ...state, members: action.items, memberPage: action.page, membersLoaded: true }
    case 'member/patch':
      return {
        ...state,
        members: state.members.map((m) => (String(m.id) === String(action.id) ? { ...m, ...action.patch } : m)),
      }

    default:
      return state
  }
}

export function BlogProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  /**
   * 지금 날아가고 있는 요청들. 같은 요청이 겹쳐 나가는 것을 막습니다.
   * 개발 모드에서는 리액트가 효과를 일부러 두 번 실행하기 때문에,
   * 그대로 두면 화면 하나를 열 때마다 같은 요청이 두 번씩 나갑니다.
   *
   * 뒤에 온 쪽은 먼저 온 요청의 결과를 그대로 받아 갑니다.
   */
  const inflight = useRef(new Map())

  const once = useCallback((key, run) => {
    const running = inflight.current.get(key)
    if (running) return running

    const started = Promise.resolve(run()).finally(() => inflight.current.delete(key))
    inflight.current.set(key, started)
    return started
  }, [])

  const fail = useCallback((e) => {
    const message = e instanceof ApiError ? e.message : '요청을 처리하지 못했습니다.'
    dispatch({ type: 'error/set', message })
    // 콘솔에도 남겨 둡니다 — 연동할 때 어디서 틀렸는지 보기 좋습니다.
    console.error('[api]', e)
    return null
  }, [])

  /**
   * 앱이 켜질 때 한 번. 로그인·회원가입 뒤에도 한 번 더 부릅니다.
   *
   * 1. 손에 액세스 토큰이 없으면 재발급을 불러 봅니다. 리프레시 토큰 쿠키가 살아 있으면
   *    로그인 상태가 돌아옵니다. (구글 로그인도 이 길로 돌아옵니다 —
   *    서버가 쿠키만 심고 우리 화면으로 보냅니다)
   * 2. 그 다음 내가 누구인지 물어봅니다.
   * 3. 로그인하지 않았어도 글 목록과 카테고리는 보입니다.
   */
  const bootstrap = useCallback(async () => {
    dispatch({ type: 'load/start' })

    let session = null
    try {
      if (!getAccessToken()) await api.auth.refresh()
      session = await api.auth.fetchMe()
    } catch {
      // 로그인하지 않은 상태입니다. 오류가 아닙니다.
      session = null
    }

    try {
      // 글 목록은 여기서 받지 않습니다. 어떤 카테고리·검색어·몇 쪽인지는 주소가 알고 있고,
      // 그건 목록 화면이 압니다. 목록 화면이 스스로 부릅니다.
      const categories = await api.admin.fetchCategories({ pageSize: CATEGORY_FETCH_SIZE })
      dispatch({
        type: 'load/done',
        payload: { session, categories: categories.items },
      })
    } catch (e) {
      dispatch({
        type: 'load/fail',
        message: e instanceof ApiError ? e.message : '데이터를 불러오지 못했습니다.',
      })
      console.error('[api] 첫 로딩 실패', e)
    }
  }, [])

  // 개발 모드(StrictMode)에서는 리액트가 효과를 일부러 두 번 실행합니다.
  // 첫 로딩을 두 번 하면 재발급도 두 번 부르게 되는데, 리프레시 토큰은
  // 한 번 쓰면 새것으로 바뀌므로 두 번째 요청은 401 이 됩니다.
  // 그래서 첫 로딩은 한 번만 돌게 막아 둡니다.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    bootstrap()
  }, [bootstrap])

  const value = useMemo(() => {
    const { session } = state

    /**
     * 글 목록 한 쪽을 받아 옵니다.
     * 카테고리·검색어·페이지를 그대로 서버에 넘기고, 돌려받은 것을 그대로 씁니다.
     */
    const loadPosts = ({ categoryId, keyword, pageNumber = 1, pageSize } = {}) =>
      once(`posts:${categoryId ?? ''}|${keyword ?? ''}|${pageNumber}|${pageSize ?? ''}`, async () => {
        dispatch({ type: 'posts/loading' })
        try {
          const res = await api.posts.fetchPosts({ categoryId, keyword, pageNumber, pageSize })
          dispatch({ type: 'posts/set', items: res.items, page: res.page })
          return res
        } catch (e) {
          dispatch({ type: 'posts/fail' })
          return fail(e)
        }
      })

    const loadCategories = async () => {
      try {
        const res = await api.admin.fetchCategories({ pageSize: CATEGORY_FETCH_SIZE })
        dispatch({ type: 'categories/set', items: res.items })
        return res
      } catch (e) { return fail(e) }
    }

    return {
      ...state,

      /* ── 지금 로그인한 사람 ───────────────────────────── */
      memberId: session?.memberId ?? '',
      me: session?.me ?? '',
      email: session?.email ?? '',
      isAdmin: session?.admin ?? false,
      bio: session?.bio ?? '',
      snsLink: session?.snsLink ?? '',
      profileImage: session?.profileImage ?? null,
      provider: session?.provider ?? 'local',
      providerLabel: PROVIDER_LABELS[session?.provider ?? 'local'] ?? '이메일',

      categoryNames: state.categories.map((c) => c.name),

      // id 는 숫자로 오고 주소창 값은 문자열이라 문자열로 비교합니다.
      postById: (id) => state.posts.find((p) => String(p.id) === String(id)) ?? null,
      commentsOf: (id) => state.comments[String(id)] ?? [],
      // 댓글을 한 번이라도 받아 왔는지. 받기 전에는 "첫 댓글" 안내 대신 스켈레톤을 보여 줍니다.
      commentsLoaded: (id) => Object.hasOwn(state.comments, String(id)),

      reload: bootstrap,
      clearError: () => dispatch({ type: 'error/clear' }),
      showError: (message) => dispatch({ type: 'error/set', message }),
      loadPosts,
      loadCategories,

      /* ── 글 ─────────────────────────────────────────────── */

      /** 글 하나를 서버에서 받아 옵니다. 상세 화면에 들어갈 때 부릅니다. */
      loadPost: (id) =>
        once(`post:${id}`, async () => {
          try {
            const post = await api.posts.fetchPost(id)
            if (post) dispatch({ type: 'post/upsert', post })
            return post
          } catch (e) { return fail(e) }
        }),

      /**
       * 댓글은 글과 따로 받아 옵니다.
       *
       * 감춘 글의 댓글은 공개 주소로 받을 수 없습니다(404).
       * 관리자는 관리자용 주소로 받고, 글쓴이에게는 빈 목록을 보여 줍니다.
       */
      loadComments: (id, { hidden = false } = {}) =>
        once(`comments:${id}`, async () => {
          if (hidden && !session?.admin) {
            dispatch({ type: 'comments/set', id, items: [] })
            return null
          }
          try {
            const res = hidden
              ? await api.admin.fetchAdminComments(id)
              : await api.posts.fetchComments(id)
            dispatch({ type: 'comments/set', id, items: res.items })
            dispatch({ type: 'post/patch', id, patch: { commentCount: res.page.totalElements } })
            return res
          } catch (e) {
            dispatch({ type: 'comments/set', id, items: state.comments[String(id)] ?? [] })
            return fail(e)
          }
        }),

      /** 서버가 만들어진 글을 돌려줍니다. 그 글을 그대로 넣어 두고, 화면은 그 글로 갑니다. */
      addPost: async ({ title, body, categoryId, hidden, thumbnail }) => {
        try {
          const post = await api.posts.createPost({ title, body, categoryId, hidden, thumbnail })
          if (post) dispatch({ type: 'post/upsert', post })
          return post
        } catch (e) { return fail(e) }
      },

      updatePost: async (id, { title, body, categoryId, hidden, thumbnail }) => {
        try {
          const post = await api.posts.updatePost(id, { title, body, categoryId, hidden, thumbnail })
          if (post) dispatch({ type: 'post/upsert', post })
          return true
        } catch (e) { return fail(e) }
      },

      deletePost: async (id) => {
        try {
          await api.posts.deletePost(id)
          dispatch({ type: 'post/remove', id })
          return true
        } catch (e) { return fail(e) }
      },

      /** 먼저 화면을 바꿔 놓고, 서버가 알려준 숫자로 맞춥니다. */
      toggleLike: async (id) => {
        const post = state.posts.find((p) => String(p.id) === String(id))
        if (!post) return
        const before = { liked: post.liked, likes: post.likes }
        dispatch({ type: 'post/patch', id, patch: { liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } })
        try {
          const res = post.liked ? await api.posts.unlikePost(id) : await api.posts.likePost(id)
          dispatch({ type: 'post/patch', id, patch: { likes: res.likes, liked: res.liked } })
        } catch (e) {
          dispatch({ type: 'post/patch', id, patch: before })
          fail(e)
        }
      },

      addComment: async (id, text) => {
        try {
          const comment = await api.posts.createComment(id, text)
          const post = state.posts.find((p) => String(p.id) === String(id))
          dispatch({ type: 'comments/add', id, comment })
          dispatch({ type: 'post/patch', id, patch: { commentCount: (post?.commentCount ?? 0) + 1 } })
          return comment
        } catch (e) { return fail(e) }
      },

      /** 고친 댓글을 돌려받으므로 그 한 줄만 갈아 끼웁니다. */
      editComment: async (id, commentId, text) => {
        try {
          const comment = await api.posts.updateComment(commentId, text)
          if (comment) dispatch({ type: 'comments/patch', id, comment })
          return comment
        } catch (e) { return fail(e) }
      },

      removeComment: async (id, commentId) => {
        try {
          await api.posts.deleteComment(commentId)
          const post = state.posts.find((p) => String(p.id) === String(id))
          dispatch({ type: 'comments/remove', id, commentId })
          dispatch({ type: 'post/patch', id, patch: { commentCount: Math.max(0, (post?.commentCount ?? 1) - 1) } })
          return true
        } catch (e) { return fail(e) }
      },

      /** 이미지를 올리고 주소를 돌려받습니다. 실패하면 null */
      uploadImage: async (file) => {
        try {
          return await api.files.uploadImage(file)
        } catch (e) { return fail(e) }
      },

      /** 다른 사람의 프로필. 한 화면에서만 쓰므로 상태에 넣지 않고 돌려주기만 합니다. */
      loadPublicProfile: (memberId) =>
        once(`profile:${memberId}`, async () => {
          try {
            return await api.profile.fetchPublicProfile(memberId)
          } catch (e) { return fail(e) }
        }),

      /* ── 마이페이지 ─────────────────────────────────────── */

      loadMyPosts: ({ pageNumber = 1, pageSize } = {}) =>
        once(`myPosts:${pageNumber}|${pageSize ?? ''}`, async () => {
          try {
            const res = await api.profile.fetchMyPosts({ pageNumber, pageSize })
            dispatch({ type: 'myPosts/set', items: res.items, page: res.page })
            return res
          } catch (e) {
            dispatch({ type: 'loaded/mark', key: 'myPostsLoaded' })
            return fail(e)
          }
        }),

      saveProfile: async ({ nickname, bio, snsLink, profileImage }) => {
        try {
          // 닉네임은 회원 정보라 프로필과 저장하는 곳이 다릅니다.
          if (nickname && nickname !== session?.me) {
            await api.auth.updateMe({ nickname })
          }
          const saved = await api.profile.updateProfile({ bio, snsLink, profileImage })
          dispatch({ type: 'session/patch', patch: { me: nickname, ...saved } })
          return true
        } catch (e) { return fail(e) }
      },

      /* ── 관리자 ─────────────────────────────────────────── */

      loadAdminPosts: ({ pageNumber = 1, pageSize } = {}) =>
        once(`adminPosts:${pageNumber}|${pageSize ?? ''}`, async () => {
          try {
            const res = await api.admin.fetchAllPosts({ pageNumber, pageSize })
            dispatch({ type: 'adminPosts/set', items: res.items, page: res.page })
            return res
          } catch (e) {
            dispatch({ type: 'loaded/mark', key: 'adminPostsLoaded' })
            return fail(e)
          }
        }),

      toggleHidden: async (id) => {
        const post = state.adminPosts.find((p) => String(p.id) === String(id))
        if (!post) return
        const hidden = !post.hidden
        dispatch({ type: 'post/patch', id, patch: { hidden } })
        try {
          // 바뀐 글을 돌려받습니다. 서버가 알려 준 값으로 맞춥니다
          const saved = await api.admin.setPostHidden(id, hidden)
          if (saved) dispatch({ type: 'post/patch', id, patch: { hidden: saved.hidden } })
        } catch (e) {
          dispatch({ type: 'post/patch', id, patch: { hidden: post.hidden } })
          fail(e)
        }
      },

      loadMembers: ({ pageNumber = 1, pageSize } = {}) =>
        once(`members:${pageNumber}|${pageSize ?? ''}`, async () => {
          try {
            const res = await api.admin.fetchMembers({ myId: session?.memberId, pageNumber, pageSize })
            dispatch({ type: 'members/set', items: res.items, page: res.page })
            return res
          } catch (e) {
            dispatch({ type: 'loaded/mark', key: 'membersLoaded' })
            return fail(e)
          }
        }),

      toggleMemberRole: async (id) => {
        const member = state.members.find((m) => String(m.id) === String(id))
        if (!member) return
        const admin = !member.admin
        dispatch({ type: 'member/patch', id, patch: { admin } })
        try {
          await api.admin.setMemberRole(id, admin)
        } catch (e) {
          dispatch({ type: 'member/patch', id, patch: { admin: member.admin } })
          fail(e)
        }
      },

      /** 탈퇴 처리. 서버가 이름 · 이메일을 바꾸므로, 부른 쪽에서 그 쪽을 다시 받아 옵니다. */
      deleteMember: async (id) => {
        try {
          await api.admin.deleteMember(id)
          return true
        } catch (e) { return fail(e) }
      },

      // 추가 · 이름 바꾸기는 바뀐 카테고리를 돌려받으므로 목록을 다시 받지 않습니다.
      addCategory: async (name) => {
        try {
          const category = await api.admin.createCategory(name)
          dispatch({ type: 'categories/add', category })
          return true
        } catch (e) { return fail(e) }
      },

      renameCategory: async (id, name) => {
        try {
          const category = await api.admin.renameCategory(id, name)
          dispatch({ type: 'categories/replace', category })
          return true
        } catch (e) { return fail(e) }
      },

      deleteCategory: async (id) => {
        try {
          await api.admin.deleteCategory(id)
          dispatch({ type: 'categories/remove', id })
          return true
        } catch (e) { return fail(e) }
      },

      /* ── 로그인 ─────────────────────────────────────────── */

      login: async ({ email, password }) => {
        try {
          await api.auth.login({ email, password })
          await bootstrap()
          return true
        } catch (e) { return fail(e) }
      },

      signup: async ({ email, password, nickname }) => {
        try {
          await api.auth.signup({ email, password, nickname })
          await bootstrap()
          return true
        } catch (e) { return fail(e) }
      },

      logout: async () => {
        try {
          await api.auth.logout()
        } catch (e) { fail(e) }
        // 실패해도 화면은 로그아웃 상태로 보냅니다.
        dispatch({ type: 'session/set', session: null })
      },

      /** 회원 탈퇴. 성공하면 로그아웃 상태가 됩니다. */
      withdraw: async () => {
        try {
          await api.auth.withdraw()
          dispatch({ type: 'session/set', session: null })
          return true
        } catch (e) { return fail(e) }
      },

      /** 구글 로그인 — 브라우저가 서버 주소로 떠납니다. */
      startSocialAuth: (provider = 'google') => api.auth.startSocialAuth(provider),
    }
  }, [state, bootstrap, fail])

  return <BlogContext value={value}>{children}</BlogContext>
}

export function useBlog() {
  const value = useContext(BlogContext)
  if (!value) throw new Error('useBlog 는 BlogProvider 안에서만 쓸 수 있습니다.')
  return value
}
