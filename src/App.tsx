import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ToastContainer from './components/ui/Toast';
import Home from './pages/Home';
import TeacherHoursSimulator from './pages/assignment/TeacherHoursSimulator';
import TeacherHoursDetail from './pages/assignment/TeacherHoursDetail';
import TeacherList from './pages/data/TeacherList';

// Placeholder 컴포넌트 (추후 개발)
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="glass-card p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        {title}
      </h1>
      <p className="text-slate-500 dark:text-slate-400">
        이 페이지는 개발 중입니다 🚧
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* 홈 */}
          <Route index element={<Home />} />

          {/* 데이터 */}
          <Route path="data">
            <Route path="school" element={<PlaceholderPage title="학교정보" />} />
            <Route path="subjects" element={<PlaceholderPage title="교과정보" />} />
            <Route path="teachers" element={<TeacherList />} />
            <Route path="rooms" element={<PlaceholderPage title="장소정보" />} />
            <Route path="import-export" element={<PlaceholderPage title="가져오기/내보내기" />} />
          </Route>

          {/* 시간표 */}
          <Route path="timetable">
            <Route path="class" element={<PlaceholderPage title="학급 시간표" />} />
            <Route path="slots" element={<PlaceholderPage title="전담교시 설정" />} />
            <Route path="template" element={<PlaceholderPage title="시간표 템플릿" />} />
          </Route>

          {/* 배정 */}
          <Route path="assignment">
            <Route path="auto" element={<PlaceholderPage title="자동 배정" />} />
            <Route path="manual" element={<PlaceholderPage title="수동 조정" />} />
            <Route path="conflict" element={<PlaceholderPage title="충돌 검사" />} />
            <Route path="simulator" element={<TeacherHoursSimulator />} />
            <Route path="teacher/:teacherId" element={<TeacherHoursDetail />} />
          </Route>

          {/* 결과 */}
          <Route path="results">
            <Route path="teacher" element={<PlaceholderPage title="교사별 시간표" />} />
            <Route path="class" element={<PlaceholderPage title="학급별 시간표" />} />
            <Route path="room" element={<PlaceholderPage title="장소별 현황" />} />
            <Route path="stats" element={<PlaceholderPage title="통계 대시보드" />} />
            <Route path="export" element={<PlaceholderPage title="인쇄/내보내기" />} />
          </Route>

          {/* 설정 */}
          <Route path="settings">
            <Route path="general" element={<PlaceholderPage title="기본 설정" />} />
            <Route path="rules" element={<PlaceholderPage title="시수 규칙" />} />
            <Route path="theme" element={<PlaceholderPage title="테마" />} />
            <Route path="help" element={<PlaceholderPage title="도움말" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
