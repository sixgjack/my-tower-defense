// src/App.tsx
import { MenuScreen } from './components/MenuScreen';
import { TeacherDashboard } from './pages/TeacherDashboard';

function App() {
  // Check if user is accessing teacher dashboard via URL
  const isTeacherPage = window.location.pathname === '/admin' || window.location.pathname === '/admin/' || window.location.pathname === '/teacher';

  if (isTeacherPage) {
    return <TeacherDashboard />;
  }

  return (
    <div className="App">
      <MenuScreen />
    </div>
  );
}

export default App;
