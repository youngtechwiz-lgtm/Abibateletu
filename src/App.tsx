import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { CmsProvider } from './context/CmsContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';

const PortfolioPage = lazy(() =>
  import('./pages/PortfolioPage.tsx').then((m) => ({ default: m.PortfolioPage }))
);
const DigitalsPage = lazy(() =>
  import('./pages/DigitalsPage.tsx').then((m) => ({ default: m.DigitalsPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage.tsx').then((m) => ({ default: m.AboutPage }))
);
const ExperiencePage = lazy(() =>
  import('./pages/ExperiencePage.tsx').then((m) => ({ default: m.ExperiencePage }))
);
const RepresentationPage = lazy(() =>
  import('./pages/RepresentationPage.tsx').then((m) => ({ default: m.RepresentationPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage.tsx').then((m) => ({ default: m.ContactPage }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage.tsx').then((m) => ({ default: m.AdminPage }))
);

function RouteSkeletonFallback({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-3 text-center">
          <p className="font-serif text-2xl tracking-[0.14em] uppercase text-[#141414]">ABIBAT</p>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/50">
            Loading Admin Studio
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#F3F1ED] flex flex-col justify-between pt-28 pb-16 px-6 sm:px-12">
      <div className="mx-auto w-full max-w-[1440px] space-y-5">
        <div className="h-3 w-32 bg-white/10 animate-pulse" />
        <div className="h-14 w-3/4 max-w-xl bg-white/10 animate-pulse" />
        <div className="h-4 w-2/3 max-w-md bg-white/10 animate-pulse" />
      </div>
      <div className="mx-auto w-full max-w-[1440px] grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
        <div className="aspect-[3/4] bg-white/[0.04] animate-pulse" />
        <div className="aspect-[3/4] bg-white/[0.04] animate-pulse hidden md:block" />
        <div className="aspect-[3/4] bg-white/[0.04] animate-pulse hidden md:block" />
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={<RouteSkeletonFallback isAdmin={isAdminRoute} />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/digitals" element={<DigitalsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/experience" element={<ExperiencePage />} />
                <Route path="/representation" element={<RepresentationPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/*" element={<AdminPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CmsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AnimatedRoutes />
        </BrowserRouter>
      </CmsProvider>
    </MotionConfig>
  );
}
