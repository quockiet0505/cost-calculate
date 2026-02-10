## Energy Cost Platform

This project implements a **production-oriented energy cost calculation and recommendation engine**
for the Australian electricity market.

It supports **interval-based pricing**, **synthetic usage simulation**, and **Consumer Data Right (CDR)**
energy plan comparison.

---

## What This System Does

- Calculates electricity costs accurately using real tariff rules
- Supports both real interval data and synthetic usage modelling
- Fetches and compares live energy plans via CDR
- Recommends the cheapest plans for a given household profile

---

## Supported Usage Models

### Model 1 – Interval-based (Correctness-first)

Uses real interval data (5-minute or 30-minute) as ground truth.

- Timezone-aware normalization (UTC - local, DST-safe)
- TOU pricing, demand charges, controlled load
- Solar feed-in tariff (FIT)
- Public holiday handling (treated as Sunday)
- Monthly breakdown and annual totals

### Model 2 – Average-based (Synthetic, v2)

Generates a full 12-month interval profile from average monthly kWh.

- Household profiles (home evenings, home all day, solar, EV)
- Postcode -> climate zone -> seasonal scaling
- Controlled load and solar behaviour modelling
- Attaches assumptions and confidence metadata
- Produces explainable, estimate-based results

---

## Pricing Engine

Fully modular pricing components:

- Daily supply charge
- Usage charge (flat / TOU)
- Demand charge
- Controlled load (usage + supply)
- Solar FIT
- Fees and discounts

Outputs:

- Annual total
- Monthly breakdown
- Sensitivity analysis (peak -> off-peak shifting)

---

## Explain Engine (v2)

Explains why a plan is cheaper:

- Cost-based explanations (supply, usage, demand, solar)
- Assumption-based explanations (climate, profile, synthetic modelling)
- Ranked and capped explanations to avoid over-claiming

---

## Consumer Data Right (CDR) Integration

- Full retailer brand registry (base URI, brand key, display name)
- Fetches plan list and plan detail via CDR endpoints
- Postcode-based geographic filtering (included / excluded rules)
- Caching and throttling for API stability
- Retailers can be enabled/disabled via configuration

---

## Recommendation Engine

- Fetches eligible plans by postcode
- Prices all plans using the same usage model
- Parallel (Promise-based) pricing for performance
- Sorts by total cost
- Returns top 3 cheapest plans with recommendation reasons


## Data Flow

### Cost Calculation (`/energy/cost`)

Client request  
- Usage input (INTERVAL or AVERAGE)  
- Usage pipeline  
- Canonical interval usage series  
- Pricing engine (supply, usage/TOU, demand, solar, controlled load, fees, discounts)  
- Monthly breakdown + annual totals  
- Sensitivity analysis (peak - off-peak)  
- Explain engine (cost-based + assumption-based)  
- Response

---

### Recommendation (`/energy/recommend`)

Client request (postcode + usage)  
- Fetch enabled retailers  
- Fetch CDR plan list  
- Filter plans by postcode geography  
- Fetch plan details (cached)  
- Run usage pipeline (once)  
- Price all plans in parallel  
- Sort by total cost  
- Attach recommendation reasons  
- Return top 3 plans


---

## API Endpoints

### `POST /energy/cost`

Calculates energy cost for a specific plan.

- Supports interval and average usage
- Returns totals, breakdowns, sensitivity, explanations, assumptions

### `POST /energy/recommend`

Recommends the cheapest plans for a postcode and usage profile.

- Uses live CDR plans
- Returns ranked plans with reasons

---

## Project Structure (Domain Layer)

```bash
domain/
├── usage/          # Usage modelling & pipelines (interval + average)
├── pricing/        # Tariff pricing logic
├── explain/        # Cost & assumption explanations
├── plan/           # Canonical plan & tariff models
├── transform/      # Sensitivity analysis (e.g. peak -> off-peak)
services/
├── cdr/            # CDR integration (brands, fetch, cache)
├── cost/           # /energy/cost API
├── recommend/      # /energy/recommend API
├── plans/          # Plan list / plan detail APIs

```

### Testing (curl)
```bash
# Cost – Average
curl -s -X POST http://localhost:4000/energy/cost \
  -H "Content-Type: application/json" \
  -d @test/cost-average.json

# Cost – Interval
curl -s -X POST http://localhost:4000/energy/cost \
  -H "Content-Type: application/json" \
  -d @test/cost-interval-basic.json

curl -s -X POST http://localhost:4000/energy/cost \
  -H "Content-Type: application/json" \
  -d @test/cost-interval-controlled-load.json

curl -s -X POST http://localhost:4000/energy/cost \
  -H "Content-Type: application/json" \
  -d @test/cost-interval-solar.json

# Recommend
curl -s -X POST http://localhost:4000/energy/recommend \
  -H "Content-Type: application/json" \
  -d @test/recommend-average.json

curl -s -X POST http://localhost:4000/energy/recommend \
  -H "Content-Type: application/json" \
  -d @test/recommend-interval.json
```