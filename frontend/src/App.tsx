import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import Layout from "./layouts/Layout";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
// import SignIn from "./pages/SignIn";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <p>Home Page</p>
            </Layout>
            
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
              <p>Search Page</p>
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout>
              <p> <Register /> </p>
            </Layout>
          }
        />
        <Route
          path="/sign-in"
          element={
            <Layout>
              <p> <SignIn /> </p>
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
