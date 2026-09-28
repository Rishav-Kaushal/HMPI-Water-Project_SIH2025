import React, { useState } from "react";
import { Container, Card, Button, Form, Alert, ProgressBar } from "react-bootstrap";
import { FaUpload, FaFileCsv, FaDownload } from "react-icons/fa";
import PageShell from "../components/PageShell";
import { waterAPI } from "../utils/api";

const csv=`sample_id,location_name,latitude,longitude,sample_type,collection_date,ph_level,temperature,arsenic,cadmium,chromium,copper,iron,lead,manganese,nickel,zinc,mercury
SMP-001,NIT Hamirpur,31.7081,76.5260,groundwater,2026-09-20,7.2,23.4,0.005,0.001,0.020,0.40,0.10,0.006,0.04,0.020,1.2,0.001`;

export default function Upload(){
  const [file,setFile]=useState(null),[message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const submit=async(e)=>{e.preventDefault();if(!file)return;setBusy(true);setMessage("");setError("");try{const r=await waterAPI.uploadCsv(file);setMessage(`Imported ${r.data.created} samples, skipped ${r.data.skipped_duplicates} duplicates, ${r.data.errors?.length||0} row errors.`);}catch(err){setError(err.response?.data?.error||"Upload failed. Sign in first if this is a write operation.");}finally{setBusy(false);}};
  const template=()=>{const blob=new Blob([csv],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hmpi_template.csv";a.click();};
  return <PageShell><Container className="py-5">
    <div className="page-head"><span className="eyebrow">BATCH IMPORT</span><h1>Upload CSV</h1><p>Import field samples in bulk. Duplicated sample IDs are skipped safely.</p></div>
    <Card className="content-card mx-auto" style={{maxWidth:900}}><Card.Body className="p-4">
      {message&&<Alert variant="success">{message}</Alert>}{error&&<Alert variant="danger">{error}</Alert>}
      <Form onSubmit={submit}><div className="upload-drop text-center p-5 mb-4"><FaFileCsv size={46} className="text-primary mb-3"/><h5>Choose a CSV file</h5><p className="text-muted small">UTF-8 CSV, maximum 10 MB.</p><Form.Control type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0]||null)}/></div>
      {busy&&<ProgressBar animated now={70} className="mb-3"/>}
      <div className="d-flex flex-wrap gap-2"><Button type="submit" disabled={!file||busy}><FaUpload className="me-1"/> Import data</Button><Button type="button" variant="outline-secondary" onClick={template}><FaDownload className="me-1"/> Download template</Button></div></Form>
    </Card.Body></Card>
  </Container></PageShell>
}
