import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { FaCalculator, FaInfoCircle } from "react-icons/fa";
import PageShell from "../components/PageShell";
import QualityBadge from "../components/QualityBadge";
import { waterAPI } from "../utils/api";

const metals = [
  ["As","Arsenic"],["Cd","Cadmium"],["Cr","Chromium"],["Cu","Copper"],["Fe","Iron"],
  ["Pb","Lead"],["Mn","Manganese"],["Ni","Nickel"],["Zn","Zinc"],["Hg","Mercury"]
];

export default function Analysis() {
  const [values, setValues] = useState(Object.fromEntries(metals.map(([s]) => [s,""])));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    const payload = {};
    for (const [symbol] of metals) if (values[symbol] !== "") payload[symbol] = Number(values[symbol]);
    try {
      const r = await waterAPI.calculate({ metal_concentrations: payload });
      setResult(r.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Calculation failed.");
    } finally { setLoading(false); }
  };

  return (
    <PageShell>
      <Container className="py-5">
        <div className="page-head">
          <span className="eyebrow">HMPI-V1</span>
          <h1>HMPI calculator</h1>
          <p>Enter one or more concentrations. The API performs the calculation and returns the per-metal breakdown.</p>
        </div>
        <Row className="g-4">
          <Col xl={8}>
            <Card className="content-card">
              <Card.Header><FaCalculator className="me-2"/> Metal concentrations (mg/L)</Card.Header>
              <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={submit}>
                  <Row>
                    {metals.map(([symbol,name]) => (
                      <Col md={6} key={symbol} className="mb-3">
                        <Form.Label>{name} <span className="text-muted">({symbol})</span></Form.Label>
                        <Form.Control type="number" step="0.000001" min="0" value={values[symbol]} onChange={e=>setValues({...values,[symbol]:e.target.value})} placeholder="0.000000" />
                      </Col>
                    ))}
                  </Row>
                  <Button type="submit" size="lg" className="rounded-pill px-4" disabled={loading}>
                    {loading ? <><Spinner size="sm" className="me-2"/>Calculating…</> : <>Calculate HMPI</>}
                  </Button>
                  <Button variant="link" onClick={()=>{setValues(Object.fromEntries(metals.map(([s])=>[s,""])));setResult(null);setError("")}}>Reset</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={4}>
            <Card className="content-card h-100">
              <Card.Header><FaInfoCircle className="me-2"/> Method</Card.Header>
              <Card.Body>
                <p className="small text-muted">Each active reference standard is stored in the database. The shipped HMPI-v1 method uses:</p>
                <div className="formula-box">Qᵢ = ((Cᵢ − Iᵢ) / (Sᵢ − Iᵢ)) × 100</div>
                <div className="formula-box">Wᵢ = 1 / (Sᵢ − Iᵢ)</div>
                <div className="formula-box">HMPI = Σ(WᵢQᵢ) / ΣWᵢ</div>
                <p className="small text-muted mt-3 mb-0">Default ideal value is 0. Reference values and source/version are editable from Django Admin.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {result && <Card className="content-card mt-4">
          <Card.Body>
            <Row className="align-items-center g-3">
              <Col md={4}><div className="result-number">{Number(result.hmpi_value).toFixed(2)}</div><div className="text-muted">HMPI value</div><QualityBadge category={result.quality_category}/></Col>
              <Col md={8}>
                <div className="table-responsive">
                  <table className="table app-table mb-0">
                    <thead><tr><th>Metal</th><th>Concentration</th><th>% of limit</th><th>Sub-index</th></tr></thead>
                    <tbody>{Object.entries(result.individual_metal_scores || {}).map(([sym,m]) => <tr key={sym}><td><strong>{m.name}</strong> ({sym})</td><td>{m.concentration_mg_l}</td><td>{m.percent_of_limit?.toFixed(1)}%</td><td>{m.sub_index?.toFixed(2)}</td></tr>)}</tbody>
                  </table>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>}
      </Container>
    </PageShell>
  );
}
