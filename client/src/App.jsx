import React from "react";
import { Navigate } from "react-router-dom";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/home/Home";
import Header from "./components/header/Header";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import Footer from "./components/footer/Footer";
import Account from "./pages/account/Account";
import { UserData } from "./context/UserContext";
import Loading from "./components/loading/Loading";
import Courses from "./pages/courses/Courses";
import CourseDescription from "./pages/coursedescription/CourseDescription";
import PaymentSuccess from "./pages/paymentsuccess/PaymentSuccess";
import Dashbord from "./pages/dashbord/Dashbord";
import CourseStudy from "./pages/coursestudy/CourseStudy";
import Lecture from "./pages/lecture/Lecture";
import AdminDashbord from "./admin/Dashboard/AdminDashbord";
import AdminCourses from "./admin/Courses/AdminCourses";
import AdminUsers from "./admin/Users/AdminUsers";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RoadmapPage from "./components/header/RoadmapPage"; // Import the new component
import ReviewPage from "./pages/review/ReviewPage"; // Import the ReviewPage component
import TestDomain from "./pages/Test/TestDomain"; // Import the Test component
import TestSection from "./pages/Test/TestSection";
import { useEffect } from "react";
import Progress from "./pages/progress/Progress";
import UserSidebar from "./components/sidebar/UserSidebar";
import InterviewPage from "./pages/interview/InterviewPage";

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

const AppContent = () => {
  const { isAuth, user, loading } = UserData();
  const location = useLocation();
  const [isUserSidebarOpen, setIsUserSidebarOpen] = React.useState(false);
  const isTestTakingPage =
    location.pathname.startsWith("/test/") && location.pathname !== "/test";

  useEffect(() => {
    if (isTestTakingPage) {
      document.body.classList.add("no-app-header");
    } else {
      document.body.classList.remove("no-app-header");
    }

    return () => {
      document.body.classList.remove("no-app-header");
    };
  }, [isTestTakingPage]);

  useEffect(() => {
    setIsUserSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isUserSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isUserSidebarOpen]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          {!isTestTakingPage && (
            <>
              <Header
                onToggleSidebar={() => setIsUserSidebarOpen((prev) => !prev)}
              />
              <UserSidebar
                isOpen={isUserSidebarOpen}
                onClose={() => setIsUserSidebarOpen(false)}
                isAuth={isAuth}
                user={user}
              />
            </>
          )}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/progress" element={isAuth ? <Progress user={user} /> : <Login />} />
            <Route path="/courses" element={<Courses />} />
            <Route
              path="/account"
              element={isAuth ? <Account user={user} /> : <Login />}
            />
            <Route path="/login" element={isAuth ? <Home /> : <Login />} />
            <Route
              path="/register"
              element={isAuth ? <Home /> : <Register />}
            />
            <Route path="/verify" element={isAuth ? <Home /> : <Verify />} />
            <Route
              path="/forgot"
              element={isAuth ? <Home /> : <ForgotPassword />}
            />
            <Route
              path="/reset-password/:token"
              element={isAuth ? <Home /> : <ResetPassword />}
            />
            <Route
              path="/course/:id"
              element={isAuth ? <CourseDescription user={user} /> : <Login />}
            />
            <Route
              path="/payment-success/:id"
              element={isAuth ? <PaymentSuccess user={user} /> : <Login />}
            />
            <Route
              path="/:id/dashboard"
              element={isAuth ? <Dashbord user={user} /> : <Login />}
            />
            <Route
              path="/course/study/:id"
              element={isAuth ? <CourseStudy user={user} /> : <Login />}
            />
            <Route
              path="/lectures/:id"
              element={isAuth ? <Lecture user={user} /> : <Login />}
            />
            <Route
              path="/admin/dashboard"
              element={isAuth && user?.role === "admin" ? <AdminDashbord user={user} /> : <Navigate to="/" />}
            />
            <Route
              path="/admin/course"
              element={isAuth && user?.role === "admin" ? <AdminCourses user={user} /> : <Navigate to="/" />}
            />
            <Route
              path="/admin/users"
              element={isAuth && user?.role === "admin" ? <AdminUsers user={user} /> : <Navigate to="/" />}
            />
            <Route path="/roadmap/:roadmapName" element={<RoadmapPage />} />{" "}
            {/* Add the new route */}
            <Route path="/reviews" element={<ReviewPage />} /> {/* New route */}
            <Route path="/interview" element={isAuth ? <InterviewPage /> : <Login />} />
            <Route path="/test" element={<TestDomain />} />{" "}
            {/* Test Domain Selection */}
            <Route
              path="/test/:domain"
              element={isAuth ? <TestSection /> : <Login />}
            />
          </Routes>
          {!isTestTakingPage && <Footer />}
        </>
      )}
    </>
  );
};

export default App;
