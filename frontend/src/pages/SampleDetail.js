import React, { useCallback, useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaRedo,
  FaMapMarkerAlt,
  FaCalculator,
} from "react-icons/fa";

import PageShell from "../components/PageShell";
import QualityBadge from "../components/QualityBadge";
import { waterAPI } from "../utils/api";

export default function SampleDetail() {
  const { id } = useParams();

  const [sample, setSample] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const response = await waterAPI.sample(id);
      setSample(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Could not load sample."
      );
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const recalc = async () => {
    setBusy(true);
    setError("");

    try {
      await waterAPI.recalculate(id);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Recalculation failed."
      );
    } finally {
      setBusy(false);
    }
  };

  if (error && !sample) {
    return (
      <PageShell>
        <Container className="py-5">
          <Alert variant="danger">{error}</Alert>

          <Button as={Link} to="/samples" variant="outline-primary">
            <FaArrowLeft className="me-2" />
            Back to samples
          </Button>
        </Container>
      </PageShell>
    );
  }

  if (!sample) {
    return (
      <PageShell>
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status" />
          <div className="text-muted mt-3">Loading sample...</div>
        </Container>
      </PageShell>
    );
  }

  const calculation = sample.hmpi_calculation;
  const readings = sample.readings || [];

  const hmpiValue =
    sample.hmpi_value !== null && sample.hmpi_value !== undefined
      ? Number(sample.hmpi_value)
      : null;

  const qualityCategory = calculation?.quality_category || null;

  const qualityLabel =
    calculation?.quality_category === "very_poor"
      ? "Very Poor"
      : calculation?.quality_category === "unsuitable"
      ? "Unsuitable"
      : calculation?.quality_category
      ? calculation.quality_category.replace("_", " ")
      : null;

  const calculationDetails =
    calculation?.individual_metal_scores &&
    typeof calculation.individual_metal_scores === "object"
      ? calculation.individual_metal_scores
      : {};

  const detailEntries = Object.entries(calculationDetails);

  const formatNumber = (value, digits = 6) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    return Number.isFinite(number) ? number.toFixed(digits) : "—";
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatSampleType = (value) => {
    if (!value) return "—";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <PageShell>
      <Container className="py-5">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
          <div>
            <Link
              to="/samples"
              className="small text-decoration-none d-inline-flex align-items-center"
            >
              <FaArrowLeft className="me-2" />
              Back to samples
            </Link>

            <h1 className="mt-2 mb-1">{sample.sample_id}</h1>

            <p className="text-muted mb-0">
              <FaMapMarkerAlt className="text-primary me-2" />
              {sample.location_name}
            </p>
          </div>

          <Button
            onClick={recalc}
            disabled={busy}
            variant="outline-primary"
          >
            <FaRedo className={`me-2 ${busy ? "fa-spin" : ""}`} />
            {busy ? "Calculating..." : "Recalculate"}
          </Button>
        </div>

        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError("")}
            className="mb-4"
          >
            {error}
          </Alert>
        )}

        {/* Sample information + HMPI result */}
        <Row className="g-4">
          <Col lg={4}>
            <Card className="content-card h-100">
              <Card.Header>Sample information</Card.Header>

              <Card.Body>
                <Info
                  label="Collection date"
                  value={formatDate(sample.collection_date)}
                />

                <Info
                  label="Sample type"
                  value={formatSampleType(sample.sample_type)}
                />

                <Info
                  label="Coordinates"
                  value={`${sample.latitude}, ${sample.longitude}`}
                />

                <Info
                  label="pH"
                  value={
                    sample.ph_level !== null &&
                    sample.ph_level !== undefined
                      ? formatNumber(sample.ph_level, 2)
                      : "—"
                  }
                />

                <Info
                  label="Temperature"
                  value={
                    sample.temperature !== null &&
                    sample.temperature !== undefined
                      ? `${formatNumber(sample.temperature, 2)} °C`
                      : "—"
                  }
                />

                <Info
                  label="Notes"
                  value={sample.notes || "—"}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="content-card h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <FaCalculator className="text-primary" />
                  <span>HMPI result</span>
                </div>

                {qualityCategory && (
                  <QualityBadge category={qualityCategory} />
                )}
              </Card.Header>

              <Card.Body>
                <div className="result-number mb-2">
                  {hmpiValue === null ? "—" : hmpiValue.toFixed(2)}
                </div>

                {calculation ? (
                  <>
                    <div className="mb-3">
                      <div className="small text-muted mb-1">
                        Water quality classification
                      </div>

                      <div className="fs-5 fw-semibold text-capitalize">
                        {qualityLabel ? qualityLabel : "—"}
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="small text-muted">
                          Calculation method
                        </div>
                        <div className="fw-semibold">
                          {calculation.method_version || "—"}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="small text-muted">
                          Reference profile
                        </div>
                        <div className="fw-semibold">
                          {calculation.reference_profile || "—"}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="small text-muted">
                          Metals included
                        </div>
                        <div className="fw-semibold">
                          {detailEntries.length}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="small text-muted">
                          Last calculated
                        </div>
                        <div className="fw-semibold">
                          {calculation.calculated_at
                            ? formatDate(calculation.calculated_at)
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted mb-0">
                    No HMPI calculation is stored for this sample yet.
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Raw metal readings */}
        <Card className="content-card mt-4">
          <Card.Header>Metal readings</Card.Header>

          <Card.Body className="p-0">
            {readings.length > 0 ? (
              <div className="table-responsive">
                <Table responsive className="app-table mb-0">
                  <thead>
                    <tr>
                      <th>Metal</th>
                      <th>Measured value</th>
                      <th>Converted</th>
                      <th>Unit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {readings.map((reading) => (
                      <tr key={reading.id}>
                        <td>
                          <strong>{reading.metal_name}</strong>{" "}
                          <span className="text-muted">
                            ({reading.metal_type})
                          </span>
                        </td>

                        <td>
                          {formatNumber(reading.concentration, 8)}
                        </td>

                        <td>
                          {formatNumber(reading.concentration_mg_l, 8)} mg/L
                        </td>

                        <td>{reading.unit || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="p-4 text-muted">
                No metal readings available for this sample.
              </div>
            )}
          </Card.Body>
        </Card>

        {/* HMPI calculation breakdown */}
        <Card className="content-card mt-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>HMPI calculation breakdown</span>

            {calculation && (
              <span className="small text-muted">
                {calculation.method_version || "HMPI-v1"}
              </span>
            )}
          </Card.Header>

          <Card.Body className="p-0">
            {detailEntries.length > 0 ? (
              <div className="table-responsive">
                <Table responsive className="app-table mb-0">
                  <thead>
                    <tr>
                      <th>Metal</th>
                      <th>Measured (mg/L)</th>
                      <th>Ideal (mg/L)</th>
                      <th>Reference limit</th>
                      <th>Weight</th>
                      <th>Qi</th>
                      <th>% of limit</th>
                      <th>Weighted contribution</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detailEntries.map(([symbol, item]) => {
                      const weight = Number(item.weight);
                      const subIndex = Number(item.sub_index);

                      const weightedContribution =
                        Number.isFinite(weight) &&
                        Number.isFinite(subIndex)
                          ? weight * subIndex
                          : null;

                      return (
                        <tr key={symbol}>
                          <td>
                            <strong>{item.name || symbol}</strong>{" "}
                            <span className="text-muted">
                              ({symbol})
                            </span>
                          </td>

                          <td>
                            {formatNumber(item.concentration_mg_l, 6)}
                          </td>

                          <td>
                            {formatNumber(item.ideal_value_mg_l, 6)}
                          </td>

                          <td>
                            {formatNumber(item.reference_limit_mg_l, 6)}
                          </td>

                          <td>{formatNumber(item.weight, 4)}</td>

                          <td>{formatNumber(item.sub_index, 2)}</td>

                          <td>
                            {formatNumber(item.percent_of_limit, 2)}%
                          </td>

                          <td>
                            {weightedContribution === null
                              ? "—"
                              : weightedContribution.toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="p-4 text-muted">
                No calculation breakdown available.
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Method note */}
        {calculation && (
          <Alert variant="light" className="mt-4 border">
            <strong>Calculation:</strong> HMPI is calculated from the stored
            metal concentrations and the active reference standards using{" "}
            {calculation.method_version || "HMPI-v1"}.
          </Alert>
        )}
      </Container>
    </PageShell>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}