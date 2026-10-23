import { GoogleMark } from './Icons.jsx'

/**
 * 소셜 로그인 버튼.
 *
 * 우리 서버는 구글만 연결해 두었습니다.
 * 카카오 · 깃허브를 붙이려면 서버에 provider 를 추가하고 여기에 한 줄 더하면 됩니다.
 */
const list = [
  { key: 'google', label: 'Google로 시작하기', className: 'btn-social btn-social--google', Mark: GoogleMark },
]

export default function SocialButtons({ onPick }) {
  return (
    <div className="social-list">
      {list.map(({ key, label, className, Mark }) => (
        <button key={key} className={className} type="button" onClick={() => onPick(key)}>
          <span className="btn-social__icon"><Mark /></span>
          {label}
        </button>
      ))}
    </div>
  )
}
