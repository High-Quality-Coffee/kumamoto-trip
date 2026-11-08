import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app">
      <header className="marquee gut">
        <p className="px">Game over</p>
        <h1>찾을 수 없어요</h1>
        <p className="sub">삭제됐거나 주소가 잘못된 여행이에요.</p>
      </header>
      <div className="app-body gut">
        <Link className="btn primary wide" href="/">여행 목록으로</Link>
      </div>
    </main>
  );
}
