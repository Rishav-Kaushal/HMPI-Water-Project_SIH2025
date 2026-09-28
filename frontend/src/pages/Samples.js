import React, { useCallback, useEffect, useState } from "react";
import { Container, Card, Form, InputGroup, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { FaSearch, FaPlus, FaDownload, FaEye } from "react-icons/fa";
import PageShell from "../components/PageShell";
import QualityBadge from "../components/QualityBadge";
import { waterAPI } from "../utils/api";

export default function Samples() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [data, setData] = useState({results:[]});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (q = query) => {
    setLoading(true);
    setError("");
    try {
      const response = await waterAPI.samples(q ? { q } : {});
      setData(response.data);
    } catch {
      setError("Could not load samples.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load(params.get("q") || "");
  }, [params, load]);

  const search = (e) => { e.preventDefault(); setParams(query.trim()?{q:query.trim()}:{}); };

  const download = async () => {
    const res = await waterAPI.exportCsv();
    const url = window.URL.createObjectURL(new Blob([res.data], {type:"text/csv"}));
    const a = document.createElement("a"); a.href=url; a.download="hmpi_samples.csv"; a.click(); window.URL.revokeObjectURL(url);
  };

  const list = data.results || [];

  return <PageShell>
    <Container className="py-5">
      <div className="page-head d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div><span className="eyebrow">DATABASE</span><h1>Water samples</h1><p>Search and inspect stored field records.</p></div>
        <div className="d-flex gap-2"><Button variant="outline-secondary" onClick={download}><FaDownload className="me-1"/> Export CSV</Button><Button as={Link} to="/samples/new"><FaPlus className="me-1"/> Add sample</Button></div>
      </div>
      <Card className="content-card mb-4"><Card.Body>
        <Form onSubmit={search}><InputGroup><Form.Control value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by sample ID or location"/><Button type="submit"><FaSearch/></Button></InputGroup></Form>
      </Card.Body></Card>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="table-card">
        <Card.Header>{data.count ?? list.length} records</Card.Header>
        <Card.Body className="p-0">
          {loading ? <div className="text-center p-5"><Spinner animation="border"/></div> :
          <div className="table-responsive"><table className="table app-table mb-0">
            <thead><tr><th>Sample ID</th><th>Location</th><th>Date</th><th>Type</th><th>HMPI</th><th>Quality</th><th></th></tr></thead>
            <tbody>{list.map(s=><tr key={s.id}>
              <td className="fw-semibold">{s.sample_id}</td><td>{s.location_name}</td><td>{s.collection_date}</td>
              <td><Badge bg="light" text="dark">{s.sample_type}</Badge></td>
              <td>{s.hmpi_value == null ? "—" : Number(s.hmpi_value).toFixed(2)}</td>
              <td>{s.hmpi_calculation ? <QualityBadge category={s.hmpi_calculation.quality_category}/> : <span className="text-muted">—</span>}</td>
              <td><Button size="sm" variant="outline-primary" as={Link} to={`/samples/${s.id}`}><FaEye/></Button></td>
            </tr>)}</tbody>
          </table></div>}
        </Card.Body>
      </Card>
    </Container>
  </PageShell>;
}
