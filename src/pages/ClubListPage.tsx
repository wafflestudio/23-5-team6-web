import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { dummyClubs } from '@/mocks/data';
import '@/styles/App.css';

export function ClubListPage() {
    const navigate = useNavigate();

    const handleClubClick = (clubId: number) => {
        navigate(`/clubs/${clubId}/items`);
    };

    return (
        <div className="container">
            <Header />

            <main className="main-content">
                <h2>내 동아리</h2>
                <p className="page-subtitle">가입한 동아리 목록입니다. 동아리를 선택하면 물품을 확인할 수 있습니다.</p>

                <div className="club-list">
                    {dummyClubs.map(club => (
                        <div
                            key={club.id}
                            className="club-card"
                            onClick={() => handleClubClick(club.id)}
                        >
                            <div className="club-info">
                                <h3 className="club-name">{club.name}</h3>
                                <p className="club-member-count">멤버 {club.memberCount}명</p>
                            </div>
                            <span className="club-arrow">→</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
