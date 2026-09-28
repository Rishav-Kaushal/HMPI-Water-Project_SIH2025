import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import PageShell from "../components/PageShell";
import { waterAPI } from "../utils/api";

const metals=[["As","Arsenic"],["Cd","Cadmium"],["Cr","Chromium"],["Cu","Copper"],["Fe","Iron"],["Pb","Lead"],["Mn","Manganese"],["Ni","Nickel"],["Zn","Zinc"],["Hg","Mercury"]];

export default function SampleForm(){
  const navigate=useNavigate();
  const [form,setForm]=useState({sample_id:"",location_name:"",latitude:"",longitude:"",sample_type:"groundwater",collection_date:new Date().toISOString().slice(0,10),ph_level:"",temperature:"",notes:""});
  const [metalsState,setMetals]=useState(Object.fromEntries(metals.map(([s])=>[s,""])));
  const [error,setError]=useState(""),[saving,setSaving]=useState(false);

  const submit=async(e)=>{
    e.preventDefault();setError("");setSaving(true);
    try{
      const readings=metals.filter(([s])=>metalsState[s]!=="").map(([s])=>({metal_type:s,concentration:Number(metalsState[s]),unit:"mg/L"}));
      const payload={...form,latitude:Number(form.latitude),longitude:Number(form.longitude),ph_level:form.ph_level===""?null:Number(form.ph_level),temperature:form.temperature===""?null:Number(form.temperature),readings};
      const r=await waterAPI.createSample(payload); navigate(`/samples/${r.data.id}`);
    }catch(err){setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save sample.");}finally{setSaving(false);}
  };

  const set=(k,v)=>setForm({...form,[k]:v});
  return <PageShell><Container className="py-5">
    <Link to="/samples" className="small text-decoration-none"><FaArrowLeft/> Back</Link>
    <div className="page-head mt-2"><span className="eyebrow">DATA ENTRY</span><h1>Add water sample</h1><p>Authenticated users can create a sample and its readings in one request.</p></div>
    <Card className="content-card"><Card.Body>{error&&<Alert variant="danger">{error}</Alert>}<Form onSubmit={submit}>
      <Row className="g-3"><Col md={6}><Form.Group><Form.Label>Sample ID *</Form.Label><Form.Control required value={form.sample_id} onChange={e=>set("sample_id",e.target.value)}/></Form.Group></Col><Col md={6}><Form.Group><Form.Label>Location *</Form.Label><Form.Control required value={form.location_name} onChange={e=>set("location_name",e.target.value)}/></Form.Group></Col>
      <Col md={3}><Form.Group><Form.Label>Latitude *</Form.Label><Form.Control required type="number" step="0.000001" min="-90" max="90" value={form.latitude} onChange={e=>set("latitude",e.target.value)}/></Form.Group></Col>
      <Col md={3}><Form.Group><Form.Label>Longitude *</Form.Label><Form.Control required type="number" step="0.000001" min="-180" max="180" value={form.longitude} onChange={e=>set("longitude",e.target.value)}/></Form.Group></Col>
      <Col md={3}><Form.Group><Form.Label>Sample type</Form.Label><Form.Select value={form.sample_type} onChange={e=>set("sample_type",e.target.value)}><option value="groundwater">Groundwater</option><option value="surface">Surface Water</option><option value="treated">Treated Water</option></Form.Select></Form.Group></Col>
      <Col md={3}><Form.Group><Form.Label>Collection date *</Form.Label><Form.Control required type="date" value={form.collection_date} onChange={e=>set("collection_date",e.target.value)}/></Form.Group></Col>
      <Col md={3}><Form.Group><Form.Label>pH</Form.Label><Form.Control type="number" step="0.01" min="0" max="14" value={form.ph_level} onChange={e=>set("ph_level",e.target.value)}/></Form.Group></Col>
      <Col md={3}><Form.Group><Form.Label>Temperature °C</Form.Label><Form.Control type="number" step="0.01" value={form.temperature} onChange={e=>set("temperature",e.target.value)}/></Form.Group></Col>
      </Row>
      <hr className="my-4"/><h5>Metal readings (mg/L)</h5><p className="small text-muted">Leave a metal empty when it was not measured.</p>
      <Row className="g-3">{metals.map(([s,n])=><Col md={4} key={s}><Form.Group><Form.Label>{n} ({s})</Form.Label><Form.Control type="number" min="0" step="0.000001" value={metalsState[s]} onChange={e=>setMetals({...metalsState,[s]:e.target.value})}/></Form.Group></Col>)}</Row>
      <div className="mt-3"><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={3} value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
      <Button type="submit" className="rounded-pill px-4 mt-4" disabled={saving}>{saving?"Saving…":"Save & calculate"}</Button>
    </Form></Card.Body></Card>
  </Container></PageShell>
}
