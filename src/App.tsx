import { HashRouter, Routes, Route } from 'react-router';
import AppShell from './components/AppShell/AppShell';
import WarbandListPage from './components/WarbandList/WarbandList';
import WarbandForm from './components/WarbandForm/WarbandForm';
import WarbandDetailPage from './components/WarbandDetail/WarbandDetail';
import WarbandEditPage from './components/WarbandDetail/WarbandEditPage';
import HeroDetailPage from './components/HeroDetail/HeroDetail';
import HenchmanGroupDetailPage from './components/HenchmanGroupDetail/HenchmanGroupDetail';
import PrintViewPage from './components/PrintView/PrintView';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* PrintView is an isolated render tree — not wrapped in AppShell */}
        <Route path="/warband/:id/print" element={<PrintViewPage />} />

        {/* All other routes share the AppShell top bar */}
        <Route element={<AppShell />}>
          <Route path="/" element={<WarbandListPage />} />
          <Route path="/warband/new" element={<WarbandForm />} />
          <Route path="/warband/:id" element={<WarbandDetailPage />} />
          <Route path="/warband/:id/edit" element={<WarbandEditPage />} />
          <Route path="/warband/:id/hero/:heroId" element={<HeroDetailPage />} />
          <Route path="/warband/:id/henchman/:groupId" element={<HenchmanGroupDetailPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
