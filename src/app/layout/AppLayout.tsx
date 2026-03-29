import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const LandingPage = lazy(() =>
  import("@/app/routes/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const EditorPage = lazy(() =>
  import("@/app/routes/EditorPage").then((m) => ({ default: m.EditorPage })),
);
const GalleryPage = lazy(() =>
  import("@/app/routes/GalleryPage").then((m) => ({ default: m.GalleryPage })),
);
const ImageConverterPage = lazy(() =>
  import("@/app/routes/ImageConverterPage").then((m) => ({ default: m.ImageConverterPage })),
);
const CalculatorsPage = lazy(() =>
  import("@/app/routes/CalculatorsPage").then((m) => ({ default: m.CalculatorsPage })),
);
const SettingsPage = lazy(() =>
  import("@/app/routes/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const SharedPatternPage = lazy(() =>
  import("@/app/routes/SharedPatternPage").then((m) => ({ default: m.SharedPatternPage })),
);

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-craft-200 border-t-craft-600" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/image-converter" element={<ImageConverterPage />} />
        <Route path="/calculators" element={<CalculatorsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/shared/:id" element={<SharedPatternPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface p-8">
      <h1 className="text-6xl font-bold text-craft-600">404</h1>
      <p className="text-lg text-text-secondary">Page not found</p>
      <a
        href="/"
        className="rounded-lg bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
      >
        Go home
      </a>
    </div>
  );
}
