## Energy Cost Platform – Model 1 (Interval-based Simulation)

This repository implements **Model 1** of the energy cost simulation engine.
Model 1 focuses on **correctness** rather than realism, using real interval data
(5-min / 30-min) as ground truth and applying tariff logic accurately.

---

### Scope (Model 1)

✔ Interval-based usage input  
✔ Timezone-aware normalization (UTC → local)  
✔ Tariff period resolution using MM-DD seasonal logic  
✔ TOU, Controlled Load, Demand Charge, Solar FiT pricing  
✔ Holiday handling (public holidays behave like Sunday)  
✔ Monthly breakdown + annual total  
✔ Deployed to Google Cloud Run via Encore  


---

### Project Structure (Domain Layer)

``` bash
domain/
└── usage/
    ├── synthesize.ts              # ENTRY POINT (Model 1 & 2 switch)
    ├── usage.types.ts
    ├── canonical-usage.ts

    ├── normalize/                 # MODEL 1 – interval correctness
    │   ├── normalize-intervals.ts # UTC → local, DST-safe
    │   ├── fill-gaps.ts
    │   └── interval-utils.ts

    ├── calendar/                  # Holiday logic (Model 1)
    │   ├── holidays.au.ts
    │   └── apply-holiday.ts

    ├── controlled-load/           # Controlled Load windows
    │   ├── cl-windows.ts
    │   └── apply-cl.ts

    ├── solar/                     # Basic solar export shaping (Model 1)
    │   ├── solar-curve.ts
    │   └── apply-solar.ts

    ├── seasonality/               # Simple seasonal multipliers
    │   ├── seasonality.data.ts
    │   └── apply-seasonality.ts

    ├── templates/                 # Used by Model 2 (not active here)
    └── generators/                # Used by Model 2 (not active here)

    domain/pricing/
    ├── tou-charge.ts                 # Time-of-Use pricing (local time)
    ├── demand-charge.ts              # Demand charge (per day/month)
    ├── solar-fit.ts                  # Solar feed-in tariff
    ├── controlled-load-charge.ts
    ├── controlled-load-supply.ts
    ├── supply-charge.ts
    ├── usage-charge.ts
    ├── resolve-tariff-period.ts      # MM-DD seasonal resolution
    └── core/
        ├── allocate-tiered-usage.ts
        └── tier-accumulator.ts
```

### Cloud Deployment (Encore + Cloud Run)

- This project is deployed using Encore.
- No Dockerfile required
- No manual gcloud run deploy
- Encore builds and deploys to Cloud Run automatically

``` bash
curl -X POST \
  "https://energy-cost-api-v1-985227244631.australia-southeast1.run.app/energy/cost" \
  -H "Authorization: bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "retailer": "energyaustralia",
    "planId": "ENE976986MRE3@EME",
    "usage": {
      "mode": "INTERVAL",
      "intervals": [
        {
          "timestamp_start": "2026-01-02T01:00:00Z",
          "timestamp_end": "2026-01-02T01:30:00Z",
          "import_kwh": 0.3,
          "export_kwh": 5,
          "controlled_import_kwh": 0
        }
      ]
    }
  }'
```

### Flow code
```bash
Recommend API:
  Usage (proxy)
  → Simulation
  → Pricing (coarse)
  → Ranking + Explanation

Cost API:
  Usage (full)
  → Simulation
  → Pricing (billing-grade)
  → Monthly / bill breakdown
```