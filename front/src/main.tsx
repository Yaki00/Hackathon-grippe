import { createRoot } from "react-dom/client";
import "./index.css";
import "@ant-design/v5-patch-for-react-19";
import { Dashboard } from "./pages/Dashboard.tsx";
import { CoutPage } from "./pages/CoutPage.tsx";
import { UrgencesPage } from './pages/UrgencesPage.tsx';
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./components/Layout.tsx";
import "mapbox-gl/dist/mapbox-gl.css";
import "@ant-design/v5-patch-for-react-19";
import ContentMap from "./components/map/ContentMap/ContentMap.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/geographique"
        element={
          <Layout>
            <ContentMap />
          </Layout>
        }
      />
      <Route
        path="/urgence"
        element={
          <Layout>
            <UrgencesPage />
          </Layout>
        }
      />
      <Route
        path="/couts"
        element={
          <Layout>
            <CoutPage />
          </Layout>
        }
      />
    </Routes>
  </BrowserRouter>
);
