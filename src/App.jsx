import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme';
import Layout from './components/Layout';
import { initStore } from './data/store';

initStore();

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Schedule = lazy(() => import('./pages/Schedule'));
const ClassPackages = lazy(() => import('./pages/ClassPackages'));
const Retention = lazy(() => import('./pages/Retention'));
const Email = lazy(() => import('./pages/Email'));
const TextMessages = lazy(() => import('./pages/TextMessages'));
const SocialMedia = lazy(() => import('./pages/SocialMedia'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Waivers = lazy(() => import('./pages/Waivers'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const Referrals = lazy(() => import('./pages/Referrals'));
const Memberships = lazy(() => import('./pages/Memberships'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Portal = lazy(() => import('./pages/Portal'));
const BookOnline = lazy(() => import('./pages/BookOnline'));
const Pricing = lazy(() => import('./pages/Pricing'));
const WorkoutBuilder = lazy(() => import('./pages/WorkoutBuilder'));
const Progress = lazy(() => import('./pages/Progress'));
const Habits = lazy(() => import('./pages/Habits'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const Automations = lazy(() => import('./pages/Automations'));
const Challenges = lazy(() => import('./pages/Challenges'));
const VirtualSessions = lazy(() => import('./pages/VirtualSessions'));
const Community = lazy(() => import('./pages/Community'));

function Loader() {
  return <div style={{ padding: 60, textAlign: 'center', color: '#999', font: "400 14px 'Inter', sans-serif" }}>Loading...</div>;
}

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public pages — no sidebar */}
          <Route path="/" element={<Home />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/book" element={<BookOnline />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Admin — with sidebar */}
          <Route path="/admin/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/checkin" element={<CheckIn />} />
                <Route path="/members" element={<Members />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/classes" element={<ClassPackages />} />
                <Route path="/workouts" element={<WorkoutBuilder />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/waivers" element={<Waivers />} />
                <Route path="/memberships" element={<Memberships />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/retention" element={<Retention />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/email" element={<Email />} />
                <Route path="/texts" element={<TextMessages />} />
                <Route path="/social" element={<SocialMedia />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/virtual" element={<VirtualSessions />} />
                <Route path="/community" element={<Community />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
