// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import ObjectSelection from "./pages/ObjectSelection";
import WorkReports from "./pages/WorkReports";
import ProtectedRoute from "./components/ProjectedRoute";
import { ObjectSelectionProvider } from "./context/src/context/ObjectSelectionContext";
import AdminUsers from "./pages/AdminUsers";
import AdminRoute from "./components/AdminRoute";
import AdminObjects from "./pages/AdminObjects";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ObjectSelectionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/objects" element={<ObjectSelection />} />
              <Route path="/reports" element={<WorkReports />} />
            </Route>

            {/* ✅ Только для админов */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/objects" element={<AdminObjects />} />{" "}
              {/* ✅ Новый маршрут */}
            </Route>

            <Route path="/" element={<Login />} />
          </Routes>
        </ObjectSelectionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
