import type { ClubItem } from '@/api/client';

// 더미 동아리 데이터
export const dummyClubs = [
    { id: 1, name: '사진동아리 포토클럽', memberCount: 25 },
    { id: 2, name: '음악동아리 하모니', memberCount: 18 },
];

// 동아리 이름 매핑
export const clubNames: Record<number, string> = {
    1: '사진동아리 포토클럽',
    2: '음악동아리 하모니',
};

// 물품 응답 타입
export interface ClubItemsResponse {
    total: number;
    items: ClubItem[];
}

// 더미 물품 데이터
export const dummyItemsData: Record<number, ClubItemsResponse> = {
    1: {
        total: 3,
        items: [
            {
                item_id: 101,
                name: '캐논 DSLR 카메라',
                status: 'available',
                borrowed_at: null,
                expected_return_date: null,
                current_holder: null,
            },
            {
                item_id: 102,
                name: '삼각대 (대형)',
                status: 'borrowed',
                borrowed_at: '2025-01-09T15:30:00Z',
                expected_return_date: '2025-01-16',
                current_holder: '김철수',
            },
            {
                item_id: 103,
                name: '조명 세트',
                status: 'available',
                borrowed_at: null,
                expected_return_date: null,
                current_holder: null,
            },
        ],
    },
    2: {
        total: 2,
        items: [
            {
                item_id: 201,
                name: '무선 마이크',
                status: 'borrowed',
                borrowed_at: '2025-01-10T10:00:00Z',
                expected_return_date: '2025-01-17',
                current_holder: '이영희',
            },
            {
                item_id: 202,
                name: '기타 앰프',
                status: 'available',
                borrowed_at: null,
                expected_return_date: null,
                current_holder: null,
            },
        ],
    },
};
