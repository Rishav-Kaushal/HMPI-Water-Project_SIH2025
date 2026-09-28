import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FaFlask, FaDatabase, FaShieldAlt, FaCode } from "react-icons/fa";
import PageShell from "../components/PageShell";

export default function About(){
  return <PageShell><Container className="py-5"><div className="page-head"><span className="eyebrow">ABOUT</span><h1>HMPI Water</h1><p>A research-oriented full-stack application for storing water samples and calculating heavy-metal pollution indices.</p></div>
    <Row className="g-4"><Col md={6}><Card className="content-card h-100"><Card.Body><FaFlask className="feature-icon"/><h5>Scientific transparency</h5><p className="text-muted">The calculation method, reference profile and individual metal scores are stored alongside the result. There is no hardcoded “prediction” number on the dashboard.</p></Card.Body></Card></Col>
    <Col md={6}><Card className="content-card h-100"><Card.Body><FaDatabase className="feature-icon"/><h5>Database first</h5><p className="text-muted">Samples, metal readings, reference standards and calculations are normal Django models, so the React UI reads real records through the REST API.</p></Card.Body></Card></Col>
    <Col md={6}><Card className="content-card h-100"><Card.Body><FaShieldAlt className="feature-icon"/><h5>Controlled writes</h5><p className="text-muted">Browsing and calculation are public. Data creation, updates, deletion and CSV upload require token authentication.</p></Card.Body></Card></Col>
    <Col md={6}><Card className="content-card h-100"><Card.Body><FaCode className="feature-icon"/><h5>Developer ready</h5><p className="text-muted">Django admin, API endpoints, management commands, migrations, tests, React source and a demo CSV are included.</p></Card.Body></Card></Col></Row>
    <Card className="content-card mt-4"><Card.Header>HMPI-v1 reference</Card.Header><Card.Body><p className="text-muted mb-2">The shipped reference profile is explicitly labelled as application reference data. It is editable from Django Admin and should be replaced with the standards required by your institution/research protocol before formal publication.</p><pre className="formula-box mb-0">Qᵢ = ((Cᵢ − Iᵢ) / (Sᵢ − Iᵢ)) × 100{"\n"}Wᵢ = 1 / (Sᵢ − Iᵢ){"\n"}HMPI = Σ(WᵢQᵢ) / ΣWᵢ</pre></Card.Body></Card>
  </Container></PageShell>
}
