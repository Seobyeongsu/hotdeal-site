# 🚀 Vercel 무료 배포 가이드

## 1단계: GitHub 저장소 만들기

```bash
cd hotdeal-site
git init
git add .
git commit -m "Initial commit: Hotdeal monitoring site"
```

GitHub에서 새 저장소를 만들고 push하세요.

## 2단계: Vercel 연결

1. [vercel.com](https://vercel.com) 접속
2. "New Project" 클릭
3. GitHub 저장소 선택
4. "Deploy" 클릭

## 3단계: 환경 변수 설정

Vercel 대시보드 > Settings > Environment Variables:

```
COUPANG_ACCESS_KEY=your_key (선택)
COUPANG_SECRET_KEY=your_key (선택)
COUPANG_AFFILIATE_ID=your_id (선택)
```

## 4단계: 데이터베이스

Vercel은 서버리스이므로 SQLite 사용 불가. 업그레이드 시:

1. **PlanetScale** (무료 tier)
2. **Neon PostgreSQL** (무료 tier)
3. **Supabase** (무료 tier)

 중 하나로 전환 필요.

## 로컬 개발

```bash
npm install
npm run seed    # 샘플 데이터 삽입
npm run dev     # 개발 서버 시작
```

http://localhost:3000 에서 확인 가능.
