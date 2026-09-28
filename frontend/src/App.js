import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analysis from "./pages/Analysis";
import Samples from "./pages/Samples";
import SampleDetail from "./pages/SampleDetail";
import SampleForm from "./pages/SampleForm";
import Upload from "./pages/Upload";
import Login from "./pages/Login";
import About from "./pages/About";
import MapPage from "./pages/Map";

export default function App(){
  return <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/dashboard" element={<Dashboard/>}/>
    <Route path="/analysis" element={<Analysis/>}/>
    <Route path="/samples" element={<Samples/>}/>
    <Route path="/samples/new" element={<SampleForm/>}/>
    <Route path="/samples/:id" element={<SampleDetail/>}/>
    <Route path="/upload" element={<Upload/>}/>
    <Route path="/map" element={<MapPage/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/about" element={<About/>}/>
    <Route path="*" element={<Home/>}/>
  </Routes>;
}
