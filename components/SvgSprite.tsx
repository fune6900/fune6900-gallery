/**
 * SVGスプライト。ここの図形はすべてこのテーマのために描いたもので、
 * 第三者のアセットや版権物は使っていない。マスコットもジャンルに着想を得た
 * オリジナルで、特定のキャラクターではない。
 *
 * 抜き色は --cut 変数で差し替えられる（貼る面の色に合わせるため）。
 */
export default function SvgSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        {/* ペンキの垂れ。上辺は面に密着し、下に雫が伸びる */}
        <symbol id="fg-i-drip" viewBox="0 0 300 30" preserveAspectRatio="none">
          <path fill="currentColor" d="M0 0h300v6H0z" />
          <g fill="currentColor">
            <path d="M14 4v12a5 5 0 0 0 10 0V4z" /><circle cx="19" cy="16" r="5" />
            <path d="M52 4v20a4 4 0 0 0 8 0V4z" /><circle cx="56" cy="24" r="4" />
            <path d="M96 4v7a6 6 0 0 0 12 0V4z" /><circle cx="102" cy="11" r="6" />
            <path d="M140 4v16a4.5 4.5 0 0 0 9 0V4z" /><circle cx="144.5" cy="20" r="4.5" />
            <path d="M186 4v9a5.5 5.5 0 0 0 11 0V4z" /><circle cx="191.5" cy="13" r="5.5" />
            <path d="M228 4v22a3.5 3.5 0 0 0 7 0V4z" /><circle cx="231.5" cy="26" r="3.5" />
            <path d="M268 4v6a5 5 0 0 0 10 0V4z" /><circle cx="273" cy="10" r="5" />
          </g>
        </symbol>

        {/* スプレーの飛沫 */}
        <symbol id="fg-i-spatter" viewBox="0 0 200 200">
          <g fill="currentColor">
            <circle cx="34" cy="52" r="9" /><circle cx="72" cy="28" r="4" />
            <circle cx="110" cy="60" r="6" /><circle cx="150" cy="34" r="3" />
            <circle cx="58" cy="96" r="12" /><circle cx="120" cy="118" r="5" />
            <circle cx="166" cy="92" r="7" /><circle cx="26" cy="140" r="4" />
            <circle cx="88" cy="160" r="8" /><circle cx="140" cy="172" r="3.5" />
            <circle cx="180" cy="140" r="5" /><circle cx="12" cy="88" r="2.5" />
            <circle cx="98" cy="14" r="2" /><circle cx="184" cy="60" r="2.5" />
            <circle cx="46" cy="182" r="2.5" /><circle cx="158" cy="128" r="2" />
          </g>
        </symbol>

        {/* 手描きのマーカー下線 */}
        <symbol id="fg-i-marker" viewBox="0 0 200 14" preserveAspectRatio="none">
          <path fill="currentColor" d="M2 9c40-5 92-7 142-4 22 1 42 3 54 5-14 3-34 4-56 4-52 1-104-2-140-5z" />
        </symbol>

        {/* マスコット。丸い筐体 + アンテナ + 液晶の顔 + ジッパー */}
        <symbol id="fg-i-boo" viewBox="0 0 100 100">
          <path d="M30 26 22 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M70 26 78 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="22" cy="8" r="6" fill="currentColor" />
          <circle cx="78" cy="8" r="6" fill="currentColor" />
          <rect x="14" y="24" width="72" height="66" rx="22" fill="currentColor" />
          <rect x="26" y="38" width="48" height="30" rx="11" fill="#101013" />
          <circle cx="40" cy="53" r="5.5" fill="#D8FA00" />
          <circle cx="60" cy="53" r="5.5" fill="#D8FA00" />
          <path d="M50 70v14" stroke="#101013" strokeWidth="3" strokeLinecap="round"
                strokeDasharray="3 4" fill="none" opacity=".55" />
        </symbol>

        {/* スケートボード（側面） */}
        <symbol id="fg-i-skate" viewBox="0 0 200 66">
          <path fill="currentColor" d="M18 22c-8-10-16-14-16-6 0 7 6 12 14 14h172c8-2 14-7 14-14 0-8-8-4-16 6z" />
          <circle cx="52" cy="50" r="11" fill="currentColor" />
          <circle cx="52" cy="50" r="4.5" fill="var(--cut,#EFEFEF)" />
          <circle cx="150" cy="50" r="11" fill="currentColor" />
          <circle cx="150" cy="50" r="4.5" fill="var(--cut,#EFEFEF)" />
          <rect x="46" y="34" width="12" height="8" rx="2" fill="currentColor" />
          <rect x="144" y="34" width="12" height="8" rx="2" fill="currentColor" />
        </symbol>

        {/* スニーカー（側面） */}
        <symbol id="fg-i-sneaker" viewBox="0 0 200 110">
          <path fill="currentColor"
                d="M22 30c10-4 20 2 27 12l17 22c5 6 11 9 19 10l77 8c14 1 24 8 24 17 0 6-5 9-13 9H26c-9 0-16-5-16-13z" />
          <path d="M14 84h176" stroke="var(--cut,#EFEFEF)" strokeWidth="7" fill="none" />
          <g stroke="var(--cut,#EFEFEF)" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M52 50l22 8" /><path d="M62 40l22 8" /><path d="M74 31l20 9" />
          </g>
          <circle cx="150" cy="70" r="7" fill="var(--cut,#EFEFEF)" />
        </symbol>
      </defs>
    </svg>
  );
}
