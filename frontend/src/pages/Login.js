import React, { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import { waterAPI } from "../utils/api";

export default function Login(){
  const navigate=useNavigate();const [username,setUsername]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError("");try{const r=await waterAPI.login({username,password});localStorage.setItem("hmpi_token",r.data.token);localStorage.setItem("hmpi_user",JSON.stringify(r.data.user));navigate("/dashboard");}catch(err){setError(err.response?.data?.error||"Invalid credentials.");}finally{setBusy(false);}};
  return <PageShell><Container className="py-5"><Card className="content-card mx-auto" style={{maxWidth:460}}><Card.Body className="p-4"><div className="text-center mb-4"><span className="eyebrow">AUTHENTICATION</span><h2>Sign in</h2><p className="text-muted">Required for creating, changing or uploading data.</p></div>{error&&<Alert variant="danger">{error}</Alert>}<Form onSubmit={submit}><Form.Group className="mb-3"><Form.Label>Username</Form.Label><Form.Control autoFocus value={username} onChange={e=>setUsername(e.target.value)} required/></Form.Group><Form.Group className="mb-4"><Form.Label>Password</Form.Label><Form.Control type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></Form.Group><Button type="submit" className="w-100 rounded-pill" disabled={busy}>{busy?"Signing in…":"Sign in"}</Button></Form><div className="text-center mt-3 small text-muted"><Link to="/about">About the platform</Link></div></Card.Body></Card></Container></PageShell>
}
