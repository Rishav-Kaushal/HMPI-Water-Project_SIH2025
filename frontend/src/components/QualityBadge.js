import React from "react";
import { Badge } from "react-bootstrap";

export default function QualityBadge({ category }) {
  if (!category) {
    return (
      <Badge bg="secondary" className="quality-badge">
        Not calculated
      </Badge>
    );
  }

  const map = {
    excellent: {
      variant: "success",
      label: "Excellent",
    },
    good: {
      variant: "primary",
      label: "Good",
    },
    poor: {
      variant: "warning",
      label: "Poor",
    },
    very_poor: {
      variant: "danger",
      label: "Very Poor",
    },
    unsuitable: {
      variant: "dark",
      label: "Unsuitable",
    },
  };

  const item = map[category];

  if (!item) {
    return (
      <Badge bg="secondary" className="quality-badge">
        {category}
      </Badge>
    );
  }

  return (
    <Badge bg={item.variant} className="quality-badge">
      {item.label}
    </Badge>
  );
}