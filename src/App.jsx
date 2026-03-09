import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./Components/Dashboard";
import DashboardOverview from "./Components/DashboardOverview";
import Patient from "./Components/Patient";
import FoodDatabase from "./Components/FoodDatabase";
import DietChart from "./Components/DietChart";
import Recipies from "./Components/Recipies";
import AddRecipe from "./Components/AddRecipe";
import CreateDietChart from "./Components/CreateDietChart";
import NewPatient from "./Components/NewPatient";
import Agnimeter from "./Components/Agnimeter";
import Community from "./Components/Community";
import CreateFromDietChart from "./Components/Crete_From_Diet_Chart";

import Login from "./Components/Login";
import Signup from "./Components/Signup";

function App() {
  return (
    <Router>
      <Routes>

        {/* Default page */}
        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardOverview />} />
          <Route path="patients" element={<Patient />} />
          <Route path="food-database" element={<FoodDatabase />} />
          <Route path="diet-charts" element={<DietChart />} />
          <Route path="recipes" element={<Recipies />} />
          <Route path="recipes/add" element={<AddRecipe />} />
          <Route path="diet-chart" element={<CreateDietChart />} />
          <Route path="add-patient" element={<NewPatient />} />
          <Route path="agnimeter" element={<Agnimeter />} />
          <Route path="community" element={<Community />} />
          <Route path="recipes/create-from-diet-chart" element={<CreateFromDietChart />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;