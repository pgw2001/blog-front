import { CommentBubble, Heart } from './Icons.jsx'
import { Tag } from './Chrome.jsx'

/** 목록 행의 [카테고리] 작성자 · 날짜 ♡ n 💬 n */
export function PostMeta({ post }) {
  return (
    <span className="post-item__meta">
      <Tag>{post.category}</Tag>
      <span className="post-item__author">{post.author}</span>
      <span className="post-item__sep" aria-hidden="true">·</span>
      <span className="post-item__date">{post.date}</span>
      <Counts likes={post.likes} comments={post.commentCount} />
    </span>
  )
}

export function Counts({ likes, comments }) {
  return (
    <span className="post-item__counts">
      <span className="count"><Heart /><span>{likes}</span></span>
      <span className="count"><CommentBubble /><span>{comments}</span></span>
    </span>
  )
}
