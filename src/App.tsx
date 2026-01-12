import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastContainer } from '@/components/Toast';
import { Header } from '@/components/Header';
import { MainPage } from '@/pages/MainPage';
import { SignupPage } from '@/pages/SignupPage';
import { AdminSignupPage } from '@/pages/AdminSignupPage';
import { LoginPage } from '@/pages/LoginPage';
import { ClubListPage } from '@/pages/ClubListPage';
import { ItemListPage } from '@/pages/ItemListPage';
import { AdminFAB } from '@/components/AdminFAB';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Header는 container 밖에서 렌더링 - position: fixed가 제대로 작동 */}
        <Header />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin/signup" element={<AdminSignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/clubs" element={<ClubListPage />} />
          <Route path="/clubs/:clubId/items" element={<ItemListPage />} />
        </Routes>
        <AdminFAB />
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;
