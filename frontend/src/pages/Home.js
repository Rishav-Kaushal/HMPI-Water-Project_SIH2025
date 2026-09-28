import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight, FaFlask, FaMapMarkerAlt, FaChartLine, FaDatabase, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import PageShell from "../components/PageShell";
import { waterAPI } from "../utils/api";

export default function Home() {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    waterAPI.samples({ page_size: 5 })
      .then(({ data }) => setRecent(data.results || data))
      .catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(`/samples${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <PageShell className="home-page">
      <section className="hero">
        <Container className="py-5">
          <Row className="align-items-center g-5">
            <Col lg={7}>
              <Badge className="hero-chip mb-3">REAL DATA • REAL HMPI • REAL API</Badge>
              <motion.h1 initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
                Understand groundwater quality <span>from the data.</span>
              </motion.h1>
              <p className="hero-copy">
                A full-stack platform to calculate the Heavy Metal Pollution Index,
                store field samples, compare reference limits, and explore pollution patterns.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Button as={Link} to="/dashboard" size="lg" className="rounded-pill px-4 btn-light-primary">
                  Open Dashboard <FaArrowRight className="ms-2"/>
                </Button>
                <Button as={Link} to="/analysis" size="lg" variant="outline-light" className="rounded-pill px-4">
                  Calculate HMPI
                </Button>
              </div>
            </Col>
            <Col lg={5}>
              <Card className="hero-panel shadow-lg">
                <Card.Body className="p-4">
                  <div className="panel-kicker"><FaDatabase/> LIVE DATABASE LOOKUP</div>
                  <h5 className="mb-3">Find a sample or location</h5>
                  <Form onSubmit={search}>
                    <InputGroup>
                      <Form.Control
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Sample ID or location"
                      />
                      <Button type="submit"><FaSearch/></Button>
                    </InputGroup>
                  </Form>
                  <small className="text-muted d-block mt-3">
                    Search is served directly by the Django API.
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        <Row className="g-4 mb-5">
          {[
            [FaFlask, "Scientific core", "Transparent HMPI calculation with per-metal indices and reference limits."],
            [FaMapMarkerAlt, "Field data", "Store coordinates, collection dates, sample types and metal readings."],
            [FaChartLine, "Real analytics", "Dashboard metrics and trends are computed from database records."],
          ].map(([Icon,title,desc], i) => (
            <Col md={4} key={title}>
              <Card className="feature-card h-100">
                <Card.Body>
                  <div className="feature-icon"><Icon/></div>
                  <h5>{title}</h5>
                  <p>{desc}</p>
                  <span className="text-primary small">Integrated in this build</span>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="section-heading d-flex justify-content-between align-items-end mb-3">
          <div><span className="eyebrow">DATABASE</span><h2>Recent samples</h2></div>
          <Link to="/samples" className="text-decoration-none">View all <FaArrowRight/></Link>
        </div>
        <Card className="table-card">
          <Card.Body className="p-0">
            {recent.length === 0 ? (
              <div className="empty-state p-5 text-center">No samples yet. Load the demo CSV to see the full workflow.</div>
            ) : (
              <div className="table-responsive">
                <table className="table app-table mb-0">
                  <thead><tr><th>Sample</th><th>Location</th><th>Date</th><th>HMPI</th><th>Quality</th></tr></thead>
                  <tbody>
                    {recent.map((s) => (
                      <tr key={s.id}>
                        <td className="fw-semibold">{s.sample_id}</td>
                        <td><FaMapMarkerAlt className="text-primary me-1"/>{s.location_name}</td>
                        <td>{s.collection_date}</td>
                        <td>{s.hmpi_value == null ? <span className="text-muted">—</span> : Number(s.hmpi_value).toFixed(2)}</td>
                        <td><Quality category={s.hmpi_calculation?.quality_category} fallback={s.pollution_level}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </PageShell>
  );
}

function Quality({category, fallback}) {
  if (category) return <Badge bg={category === "excellent" || category === "good" ? "success" : category === "poor" ? "warning" : "danger"}>{category.replace("_"," ")}</Badge>;
  return fallback ? <Badge bg="secondary">{fallback}</Badge> : <span className="text-muted">—</span>;
}
