import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import QuizDiscovery from './pages/QuizDiscovery';
import QuizRunner from './pages/QuizRunner';
import QuizResult from './pages/QuizResult';
import StudentHistory from './pages/StudentHistory';
import StudentProfile from './pages/StudentProfile';
import Leaderboard from './pages/Leaderboard';
import CertificateVerifier from './pages/CertificateVerifier';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import QuizManagement from './pages/admin/QuizManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import UserManagement from './pages/admin/UserManagement';
import AdminAttempts from './pages/admin/AdminAttempts';

function MainApp() {
  const { user, loading, isAdmin } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Navigation State
  const [activePage, setActivePage] = useState('student-dashboard');

  // Sub-view modes
  const [activeQuizRunnerId, setActiveQuizRunnerId] = useState(null);
  const [quizRunnerMode, setQuizRunnerMode] = useState('EXAM');
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [managingQuestionsQuizId, setManagingQuestionsQuizId] = useState(null);

  // Theme enforcement: Students get custom themes, Admin always gets default indigo theme
  useEffect(() => {
    if (user && isAdmin) {
      document.documentElement.setAttribute('data-theme', 'indigo');
    } else {
      const savedTheme = localStorage.getItem('app_theme') || 'indigo';
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [user, isAdmin]);

  const startQuizRunner = (qId, mode = 'EXAM') => {
    setSelectedAttemptId(null);
    setManagingQuestionsQuizId(null);
    setQuizRunnerMode(mode);
    setActiveQuizRunnerId(qId);
  };

  const handleNavigate = (page) => {
    setSelectedAttemptId(null);
    setManagingQuestionsQuizId(null);
    setActiveQuizRunnerId(null);
    setActivePage(page);
  };

  // Set default initial page on login based on role
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        setActivePage('admin-dashboard');
      } else {
        setActivePage('student-dashboard');
      }
    }
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
          <span>Loading QuizMaster Platform...</span>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  // Quiz Runner Active Mode
  if (activeQuizRunnerId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <QuizRunner
          quizId={activeQuizRunnerId}
          mode={quizRunnerMode}
          onCompleteQuiz={(attemptId) => {
            setActiveQuizRunnerId(null);
            setSelectedAttemptId(attemptId);
          }}
          onCancel={() => setActiveQuizRunnerId(null)}
        />
      </div>
    );
  }

  // Quiz Result Active Mode
  if (selectedAttemptId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
        <Navbar activePage={activePage} setActivePage={handleNavigate} />
        <QuizResult
          attemptId={selectedAttemptId}
          onBackToQuizzes={() => {
            setSelectedAttemptId(null);
            setActivePage(isAdmin ? 'admin-quizzes' : 'quiz-discovery');
          }}
          onRetakeQuiz={(quizId) => {
            setSelectedAttemptId(null);
            startQuizRunner(quizId, 'EXAM');
          }}
        />
      </div>
    );
  }

  // Question Management Active Mode
  if (managingQuestionsQuizId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
        <Navbar activePage={activePage} setActivePage={handleNavigate} />
        <QuestionManagement
          quizId={managingQuestionsQuizId}
          onBack={() => setManagingQuestionsQuizId(null)}
        />
      </div>
    );
  }

  // Render main page layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        <Navbar activePage={activePage} setActivePage={handleNavigate} />
        
        <main className="pb-16">
          {/* Student Pages */}
          {activePage === 'student-dashboard' && (
            <StudentDashboard
              setActivePage={handleNavigate}
              onSelectQuiz={(qId, mode) => startQuizRunner(qId, mode)}
              onSelectAttempt={(attId) => setSelectedAttemptId(attId)}
            />
          )}

          {activePage === 'quiz-discovery' && (
            <QuizDiscovery
              onStartQuiz={(qId, mode) => startQuizRunner(qId, mode)}
            />
          )}

          {activePage === 'history' && (
            <StudentHistory
              onSelectAttempt={(attId) => setSelectedAttemptId(attId)}
            />
          )}

          {activePage === 'leaderboard' && <Leaderboard />}
          {activePage === 'profile' && <StudentProfile />}
          {activePage === 'verify-cert' && <CertificateVerifier />}

          {/* Admin Pages */}
          {activePage === 'admin-dashboard' && (
            <AdminDashboard
              setActivePage={handleNavigate}
              onManageQuestions={(qId) => setManagingQuestionsQuizId(qId)}
            />
          )}

          {activePage === 'admin-quizzes' && (
            <QuizManagement
              onManageQuestions={(qId) => setManagingQuestionsQuizId(qId)}
            />
          )}

          {activePage === 'admin-categories' && <CategoryManagement />}
          {activePage === 'admin-users' && <UserManagement />}
          {activePage === 'admin-attempts' && (
            <AdminAttempts
              onSelectAttempt={(attId) => setSelectedAttemptId(attId)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-serif">
          <p>© 2026 QuizMaster Global Academy. ISO 9001:2015 Certified Board.</p>
          <div className="flex items-center gap-4 font-sans">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Enterprise System Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
