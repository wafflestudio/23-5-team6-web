import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainPage } from '@/pages/MainPage';
import { SignupPage } from '@/pages/SignupPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} /> {/* Placeholder */}
      </Routes>
    </Router>
  );
}

export default App;
