import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  Container,
  Spinner,
} from "react-bootstrap";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import QualityBadge from "../components/QualityBadge";
import { waterAPI } from "../utils/api";

import "leaflet/dist/leaflet.css";

function FitMapToSamples({ samples }) {
  const map = useMap();

  useEffect(() => {
    const points = samples
      .filter(
        (sample) =>
          sample.latitude !== null &&
          sample.latitude !== undefined &&
          sample.longitude !== null &&
          sample.longitude !== undefined
      )
      .map((sample) => [
        Number(sample.latitude),
        Number(sample.longitude),
      ])
      .filter(
        ([lat, lng]) =>
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
      );

    if (points.length === 1) {
      map.setView(points[0], 13);
    }

    if (points.length > 1) {
      map.fitBounds(points, {
        padding: [40, 40],
      });
    }
  }, [map, samples]);

  return null;
}

function getMarkerStyle(category) {
  switch (category) {
    case "excellent":
      return {
        color: "#198754",
        fillColor: "#198754",
      };

    case "good":
      return {
        color: "#0d6efd",
        fillColor: "#0d6efd",
      };

    case "poor":
      return {
        color: "#ffc107",
        fillColor: "#ffc107",
      };

    case "very_poor":
      return {
        color: "#dc3545",
        fillColor: "#dc3545",
      };

    case "unsuitable":
      return {
        color: "#212529",
        fillColor: "#212529",
      };

    default:
      return {
        color: "#6c757d",
        fillColor: "#6c757d",
      };
  }
}

export default function MapPage() {
  const [samples, setSamples] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    waterAPI
      .samples()
      .then((response) => {
        setSamples(response.data.results || response.data || []);
      })
      .catch(() => {
        setError("Could not load sample locations.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const mappedSamples = useMemo(() => {
    return samples.filter((sample) => {
      const lat = Number(sample.latitude);
      const lng = Number(sample.longitude);

      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });
  }, [samples]);

  const defaultCenter =
    mappedSamples.length > 0
      ? [
          Number(mappedSamples[0].latitude),
          Number(mappedSamples[0].longitude),
        ]
      : [31.7081, 76.526];

  return (
    <PageShell>
      <Container className="py-5">
        <div className="page-head">
          <span className="eyebrow">GEOGRAPHIC VIEW</span>
          <h1>Water quality map</h1>
          <p>
            Sample locations are plotted directly from stored latitude and
            longitude values.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="content-card overflow-hidden">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Sample locations</span>

            <Badge bg="light" text="dark">
              {mappedSamples.length} mapped samples
            </Badge>
          </Card.Header>

          <Card.Body className="p-0">
            {loading ? (
              <div className="py-5 text-center">
                <Spinner animation="border" />
                <div className="text-muted mt-3">
                  Loading sample locations...
                </div>
              </div>
            ) : mappedSamples.length === 0 ? (
              <div className="empty-state py-5 text-center">
                No samples with valid coordinates available.
              </div>
            ) : (
              <div className="hmpi-map">
                <MapContainer
                  center={defaultCenter}
                  zoom={13}
                  scrollWheelZoom={true}
                  style={{ height: "620px", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <FitMapToSamples samples={mappedSamples} />

                  {mappedSamples.map((sample) => {
                    const lat = Number(sample.latitude);
                    const lng = Number(sample.longitude);
                    const style = getMarkerStyle(
                      sample.hmpi_calculation?.quality_category
                    );

                    const hmpi =
                      sample.hmpi_value !== null &&
                      sample.hmpi_value !== undefined
                        ? Number(sample.hmpi_value).toFixed(2)
                        : "—";

                    return (
                      <CircleMarker
                        key={sample.id}
                        center={[lat, lng]}
                        radius={10}
                        pathOptions={{
                          color: style.color,
                          fillColor: style.fillColor,
                          fillOpacity: 0.75,
                          weight: 3,
                        }}
                      >
                        <Popup>
                          <div style={{ minWidth: "220px" }}>
                            <div className="fw-bold fs-6 mb-1">
                              {sample.sample_id}
                            </div>

                            <div className="small text-muted mb-3">
                              {sample.location_name}
                            </div>

                            <div className="mb-2">
                              <strong>HMPI:</strong> {hmpi}
                            </div>

                            <div className="mb-2">
                              <strong>Quality:</strong>{" "}
                              {sample.hmpi_calculation
                                ?.quality_category ? (
                                <QualityBadge
                                  category={
                                    sample.hmpi_calculation
                                      .quality_category
                                  }
                                />
                              ) : (
                                "Not calculated"
                              )}
                            </div>

                            <div className="small text-muted mb-3">
                              {lat.toFixed(6)}, {lng.toFixed(6)}
                            </div>

                            <Link
                              to={`/samples/${sample.id}`}
                              className="btn btn-sm btn-primary"
                            >
                              View sample
                            </Link>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            )}
          </Card.Body>
        </Card>

        <div className="d-flex flex-wrap gap-2 mt-3">
          <QualityLegend label="Excellent" category="excellent" />
          <QualityLegend label="Good" category="good" />
          <QualityLegend label="Poor" category="poor" />
          <QualityLegend label="Very Poor" category="very_poor" />
          <QualityLegend label="Unsuitable" category="unsuitable" />
        </div>
      </Container>
    </PageShell>
  );
}

function QualityLegend({ label, category }) {
  const style = getMarkerStyle(category);

  return (
    <div className="map-legend-item">
      <span
        className="map-legend-dot"
        style={{ backgroundColor: style.fillColor }}
      />
      <span>{label}</span>
    </div>
  );
}