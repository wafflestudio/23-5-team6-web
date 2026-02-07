# 🚀 바로바로(borrow)<br>: 공유 공간 자산 관리 시스템

**"누가 가져갔지? 언제 반납하지?"** 바로바로는 동아리방, 공용 오피스 등 공유 공간의 비품 관리를 위해 **사진 인증**과 **위치 기반(GPS) 기술**을 결합한 스마트 자산 관리 솔루션입니다.

[👉 서비스 바로가기](링크를_입력하세요)

---

## 1. 🌟 서비스 소개
기존의 엑셀이나 수기 관리 대장은 데이터 유실이 잦고 실시간 현황 파악이 어렵다는 단점이 있었습니다. 바로바로는 이러한 불편함을 해결하고자 다음과 같은 가치를 제공합니다.

* **간편한 대여/반납**: 복잡한 절차 없이 사진 한 장과 GPS 인증으로 즉시 처리합니다.
* **투명한 자산 관리**: 관리 대장 업로드 기능을 통해 대량의 자산을 손쉽게 등록하고 관리합니다.
* **데이터 기반 운영**: 자산별 대여 횟수, 평균 대여 기간 등 통계 데이터를 시각화하여 효율적인 비품 관리를 돕습니다.

---

## 2. 🔄️ 워크플로우 (Workflow)
사용자와 관리자의 역할을 명확히 분리하여 최적의 동선을 설계했습니다.

* **사용자**: 동아리 가입 신청 → 물품 검색 및 대여 → [위치 인증 + 사진 촬영] → 반납 완료
* **관리자**: 자산 등록(Excel) → 대여 현황 모니터링 → 통계 분석 및 멤버 관리

---

## 3. 👨‍👩‍👦‍👦 개발자 소개
| 이름 | 역할 | 담당 기능 및 기술적 기여 |
| [**맹준호**](https://github.com/s3mng) | Frontend | - React 기반 프론트엔드 아키텍처 및 공통 컴포넌트 설계<br>- 소셜 로그인 및 GPS 위치 기반 반납 인터페이스 구현<br>- AWS Lambda 연동을 통한 연체 안내 이메일 전송 시스템 구축 |
| [**임효리**](https://github.com/alinwinskingsleigh-svg) | Frontend | - 엑셀 기반 자산 업로드 및 다운로드 기능 구현 <br>- 자산 대여 반납 기능 구현 <br>  |
| :--- | :---: | :--- |
| [**김찬우**](https://github.com/swfs0417) | Backend | - JWT 기반 인증 시스템 구축 (Access/Refresh Token, argon2 해싱)<br>- 대여/멤버 CRUD API 및 권한 관리 로직 설계<br>- 통계 API 개발 및 CSV 대량 업로드 시스템 구현<br>- DB 스키마 설계 및 CI/CD 파이프라인 구축 |
| [**남현석**](https://github.com/seaotter316) | Backend | - 자산 CRUD API 및 자산 이미지 업로드 기능 구현<br>- 대여/반납 로직 내 동시 요청 충돌 방지(Concurrency Control) 처리<br>- AWS 기반 인프라 구축(EC2, RDS) 및 서비스 환경 최적화<br>- 도메인 구매 및 DNS 설정을 통한 서비스 연결 |
| [**전동주**](https://github.com/djeon21) | Backend | - 동아리 CRUD 및 Haversine 공식을 활용한 위치 정보 처리 개발<br>- 운영자 전용 회원가입/로그인 및 관리 기능 백엔드 설계<br>- 구글 소셜 로그인 (Auth Code Flow + PKCE) 보안 로직 구현 |

## 4. 💬 우리 팀의 고민 (Technical Challenges)

### 📍 위치 기반 반납의 신뢰성
단순 버튼 클릭 반납의 허점을 보완하기 위해 **Haversine 공식**을 이용해 사용자의 현재 GPS와 동아리 위치 사이의 거리를 계산(15m 이내 제한)하는 로직을 구현했습니다.

### 🔐 역할 기반의 명확한 인터페이스 분리
사용자용 페이지와 관리자용 대시보드를 경로(Route) 수준에서 엄격히 분리하여 보안성을 높였으며, 관리자에게는 **AdminFAB**을 제공하여 빠른 관리 도구 접근을 지원합니다.

### 📊 데이터 관리 자동화 (Bulk Insert)
수백 개의 자산을 효율적으로 처리하기 위해 클라이언트에서 보낸 엑셀 파일을 백엔드에서 직접 파싱하여 DB에 일괄 저장하는 시스템을 구축했습니다.

---

## 5. 🛠️ 기술 스택 (Tech Stack)

### 💻 Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **State & Routing**: React Router 7, Context API
- **Libraries**: xlsx, Kakao Map API

### ⚙️ Backend
- **Framework**: FastAPI (Python 3.12)
- **ORM & DB**: SQLAlchemy, Alembic, pymysql
- **Authentication**: Authlib (OAuth2/OpenID Connect), Pydantic
- **Libraries**: openpyxl (엑셀 파싱), python-multipart (파일 업로드)

### ☁️ Infra & DevOps
- **Infrastructure**: AWS (EC2, RDS, S3, CloudFront)
- **Container**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

---

## 6. 🖼️ 프로젝트 뷰 (Project View)
서비스의 핵심 사용자 경험을 11개의 주요 화면으로 구성했습니다.

1. **랜딩 페이지**: 서비스의 핵심 가치를 소개하는 첫 화면입니다.
<img src="./src/assets/1. 랜딩 페이지.png" width="600">

2. **로그인**: 구글 OAuth 및 일반 계정을 통한 통합 로그인 기능을 제공합니다.
<img src="./src/assets/2. 로그인.png" width="600">

3. **운영자 회원가입**: 동아리 생성 및 관리 권한을 가진 운영자 전용 가입 페이지입니다.
<img src="./src/assets/3. 운영자 회원가입.png" width="600">

4. **사용자 회원가입**: 동아리원들이 물품 대여를 위해 가입하는 페이지입니다.
<img src="./src/assets/4. 사용자 회원가입.png" width="600">

5. **사용자 반납 화면**: GPS 거리 인증과 실물 사진 업로드를 통해 반납의 신뢰성을 확보하는 상세 페이지입니다.
<img src="./src/assets/5. 사용자 반납화면.png" width="600">

6. **동아리 및 물품 목록**: 가입한 동아리를 선택하고 해당 동아리의 대여 가능한 물품 목록을 조회합니다.
<img src="./src/assets/6. 동아리 및 물품 목록.png" width="600">

7. **사용자 대여 항목**: 본인이 현재 대여 중인 물품과 과거 이용 이력을 확인합니다.
<img src="./src/assets/7. 사용자 대여 항목.png" width="600">

8. **운영자 자산 관리**: 보유한 모든 비품의 상태를 모니터링하고 수정/삭제하는 관리자 메인 대시보드입니다.
<img src="./src/assets/8. 운영자 자산 관리.png" width="600">

9. **운영자 물품 추가**: 단일 물품 등록뿐만 아니라 엑셀 대장 업로드를 통한 대량 등록 모달을 포함합니다.
<img src="./src/assets/9. 운영자 물품 추가.png" width="600">

10. **운영자 대여 현황**: 동아리 전체의 대여/반납/연체 현황을 한눈에 파악합니다.
<img src="./src/assets/10. 운영자 대여현황.png" width="600">

11. **운영자 멤버 관리**: 동아리에 가입된 멤버 목록을 관리하고 권한을 조정하거나 삭제합니다.
<img src="./src/assets/11. 운영자 멤버 관리.png" width="600">
