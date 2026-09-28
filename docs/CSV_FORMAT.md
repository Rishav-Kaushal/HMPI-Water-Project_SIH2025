# CSV format

Required columns:

`sample_id,location_name,latitude,longitude,collection_date`

Optional sample fields:

`sample_type,ph_level,temperature,notes`

Metal fields:

`arsenic,cadmium,chromium,copper,iron,lead,manganese,nickel,zinc,mercury`

Optional per-metal unit field:

`arsenic_unit,cadmium_unit,...`

Accepted units: `mg/L`, `µg/L`, `ppm`, `ppb`.

Rows using an existing `sample_id` are skipped by the batch API rather than overwritten.
