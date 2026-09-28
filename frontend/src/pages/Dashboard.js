import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, ProgressBar } from "react-bootstrap";
import { FaDatabase, FaFlask, FaChartLine, FaArrowUp, FaExclamationTriangle } from "react-icons/fa";
import PageShell from "../components/PageShell";
import QualityBadge from "../components/QualityBadge";
import { waterAPI } from "../utils/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    waterAPI.dashboard().then(r => setData(r.data)).catch(() => setError("Could not load dashboard data."));
  }, []);

  if (error) return <PageShell><Container className="py-5"><Alert variant="danger">{error}</Alert></Container></PageShell>;
  if (!data) return <PageShell><Container className="py-5 text-center"><Spinner animation="border" /></Container></PageShell>;

  const quality = data.quality_counts || {};
  const trend = data.monthly_trend || [];
  const maxTrend = Math.max(...trend.map(x => x.average_hmpi), 1);

  return (
    <PageShell>
      <Container className="py-5">
        <div className="page-head">
          <span className="eyebrow">MONITORING</span>
          <h1>Water quality dashboard</h1>
          <p>Every number below is calculated from the stored sample records.</p>
        </div>

        <Row className="g-3 mb-4">
          {[
            [FaDatabase, "Total samples", data.total_samples],
            [FaFlask, "Analyzed", data.analyzed_samples],
            [FaChartLine, "Average HMPI", Number(data.average_hmpi).toFixed(2)],
            [FaArrowUp, "Maximum HMPI", Number(data.max_hmpi).toFixed(2)],
          ].map(([Icon,label,value]) => (
            <Col md={6} xl={3} key={label}>
              <Card className="stat-card h-100"><Card.Body><div className="stat-icon"><Icon/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></Card.Body></Card>
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          <Col xl={5}>
            <Card className="content-card h-100">
              <Card.Header>Quality distribution</Card.Header>
              <Card.Body>
                {[
                  ["excellent","Excellent"],["good","Good"],["poor","Poor"],["very_poor","Very Poor"],["unsuitable","Unsuitable"]
                ].map(([key,label]) => {
                  const count = quality[key] || 0;
                  const pct = data.analyzed_samples ? (count / data.analyzed_samples) * 100 : 0;
                  return <div className="mb-3" key={key}><div className="d-flex justify-content-between small mb-1"><span>{label}</span><strong>{count}</strong></div><ProgressBar now={pct} /></div>;
                })}
              </Card.Body>
            </Card>
          </Col>
          <Col xl={7}>
            <Card className="content-card h-100">
              <Card.Header>Monthly HMPI trend</Card.Header>
              <Card.Body>
                {trend.length === 0 ? <div className="empty-state">No calculated samples yet.</div> :
                trend.map(item => (
                  <div className="trend-row" key={item.month}>
                    <div className="trend-label">{item.month}</div>
                    <div className="trend-track"><div className="trend-bar" style={{width:`${(item.average_hmpi/maxTrend)*100}%`}}/></div>
                    <div className="trend-value">{item.average_hmpi}</div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mt-1">
          <Col xl={7}>
            <Card className="content-card">
              <Card.Header>Reference-limit exceedance</Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 app-table">
                  <thead><tr><th>Metal</th><th>Samples</th><th>Exceedances</th><th>Rate</th></tr></thead>
                  <tbody>
                    {(data.metal_exceedance || []).map(m => <tr key={m.symbol}><td><strong>{m.name}</strong> <span className="text-muted">({m.symbol})</span></td><td>{m.samples}</td><td>{m.exceedances}</td><td>{m.exceedance_rate}%</td></tr>)}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={5}>
            <Card className="content-card">
              <Card.Header>Highest recorded HMPI</Card.Header>
              <Card.Body>
                {(data.top_samples || []).map((s, i) => (
                  <div className="top-sample" key={s.id}>
                    <div><strong>{i+1}. {s.sample_id}</strong><div className="small text-muted">{s.location_name}</div></div>
                    <div className="text-end"><strong>{Number(s.hmpi_value).toFixed(2)}</strong><br/><QualityBadge category={s.quality_category}/></div>
                  </div>
                ))}
                {!data.top_samples?.length && <div className="empty-state"><FaExclamationTriangle className="me-2"/>No analysis records yet.</div>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </PageShell>
  );
}
