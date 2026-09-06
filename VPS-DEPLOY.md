# 오라클 클라우드 VPS 배포 가이드

## 1단계: 기존 인스턴스 정리

1. https://cloud.oracle.com 에 로그인
2. 좌측 메뉴 → Compute → Instances
3. 기존 인스턴스 선택 → Terminate (삭제)
   - 볼륨도 함께 삭제 체크

## 2단계: 새 인스턴스 생성

1. Compute → Instances → Create Instance
2. 설정:
   - 이름: `hotdeal-collector`
   - 이미지: **Canonical Ubuntu 22.04** (또는 최신 LTS)
   -_shape: **VM.Standard.A1.Flex** (Always Free, ARM)
     - OCPU: 4, RAM: 24GB (최대 무료)
   - VCN: 기본값 사용 (자동 생성)
   - 퍼블릭 IP: **Ắn Assign a public IP** 체크 (고정 IP 할당)
   - SSH keys: **SSH 키 파일 업로드** (.pub 파일)
3. Create 클릭 → 2~3분 대기
4. 인스턴스 상세에서 **퍼블릭 IP 확인**

## 3단계: VPS 접속

```bash
# Windows PowerShell에서
ssh -i "C:\path\to\your-key.pem" ubuntu@<퍼블릭IP>

# 접속 확인
curl ifconfig.me
# → 이 IP가 토스 화이트리스트에 등록할 IP
```

## 4단계: 환경 설정

```bash
# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 프로젝트 폴더 생성
mkdir -p ~/hotdeal-collector
cd ~/hotdeal-collector
```

## 5단계: 파일 업로드

```bash
# Windows PowerShell에서 (VPS 접속 전에 실행)
scp -i "path\to\key.pem" scripts/collect-to-kv.mjs ubuntu@<퍼블릭IP>:~/hotdeal-collector/
scp -i "path\to\key.pem" .env.local ubuntu@<퍼블릭IP>:~/hotdeal-collector/
```

## 6단계: 테스트

```bash
# VPS에서
cd ~/hotdeal-collector
node collect-to-kv.mjs
```

성공 시:
- 텔레그램으로 "✅ 수집 완료" 알림 수신
- 오류 시: 토큰/IP/Cloudflare 설정 확인

## 7단계: 자동 실행 (Systemd)

```bash
sudo tee /etc/systemd/system/hotdeal-collector.service << 'EOF'
[Unit]
Description=HotDeal Toss Collector
After=network.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/home/ubuntu/hotdeal-collector
ExecStart=/usr/bin/node collect-to-kv.mjs
StandardOutput=journal
StandardError=journal
EOF

# 2시간마다 실행 (Crontab)
sudo crontab -u ubuntu -l 2>/dev/null | { cat; echo "0 */2 * * * /usr/bin/systemctl start hotdeal-collector.service"; } | sudo crontab -u ubuntu -

# 테스트 시작
sudo systemctl start hotdeal-collector.service
sudo journalctl -u hotdeal-collector.service -f
```

## 8단계: 토스 화이트리스트에 VPS IP 등록

VPS 접속 후 `curl ifconfig.me`로 확인한 IP를
토스 쉐어링크 어드민 → 설정 → 출발 IP 관리에 등록.

## 주의사항
- Always Free 인스턴스는 **이벤트성 사용** 제한 → 2시간마다 API 호출 정도는 문제없음
- 인스턴스 종료 시 **자동 종료 타이머** 설정 (무료 유지 위해)
- SSH 포트는 기본 22만 열어두기
