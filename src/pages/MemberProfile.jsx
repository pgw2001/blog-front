import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { Avatar, BackBar, Page } from "../components/Chrome.jsx";
import { Briefcase, LinkIcon } from "../components/Icons.jsx";
import { ErrorNote, Loading } from "../components/Status.jsx";
import { Block, Line } from "../components/Skeleton.jsx";

/**
 * 다른 사람의 프로필 (/members/:id)
 *
 * 글 상세의 글쓴이 · 댓글 쓴 사람 이름을 누르면 옵니다.
 * 로그인하지 않아도 볼 수 있습니다. 서버의 /api/public/members/** 를 씁니다.
 */
export default function MemberProfile() {
  const { id } = useParams();
  const { loadPublicProfile, memberId } = useBlog();
  const [person, setPerson] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setPerson(null);
    setMissing(false);
    Promise.resolve(loadPublicProfile(id)).then((found) => {
      if (!alive) return;
      if (found) setPerson(found);
      else setMissing(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 내 프로필이면 마이페이지로 보냅니다
  if (memberId && String(memberId) === String(id))
    return <Navigate to="/mypage" replace />;

  return (
    <Page>
      <title>{person ? `${person.name} — 수로그` : "프로필 — 수로그"}</title>

      <ErrorNote />

      <BackBar to="/" title="프로필" label="목록으로" />

      <main>
        {!person && !missing && (
          <section className="profile">
            <Loading />
            <div className="profile__top">
              <Block className="avatar avatar--56" />
              <div className="profile__who">
                <p className="profile__name">
                  <Line width="3em" />
                </p>
                <p className="profile__account">
                  <Line width="8em" />
                </p>
              </div>
            </div>
          </section>
        )}

        {missing && (
          <div className="empty">
            <p className="empty__title">찾을 수 없는 회원입니다</p>
            <p className="empty__text">탈퇴했거나 없는 회원입니다</p>
          </div>
        )}

        {person && (
          <section className="profile">
            <div className="profile__top">
              <Avatar name={person.name} size={56} photo={person.profileImage} />
              <div className="profile__who">
                <p className="profile__name">{person.name}</p>
                <p className="profile__account">{person.joined} 가입</p>
              </div>
            </div>

            {(person.bio || person.snsLink) && (
              <div className="profile__extra">
                {person.bio && (
                  <p className="profile__row">
                    <Briefcase />
                    {person.bio}
                  </p>
                )}
                {person.snsLink && (
                  <p className="profile__row">
                    <LinkIcon />
                    <a href={person.snsLink} rel="noopener" target="_blank">
                      {person.snsLink}
                    </a>
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </Page>
  );
}
