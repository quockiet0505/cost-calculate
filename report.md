# Energy Cost Platform – Technical Report

This document describes the internal design, data flow, and implementation details
of the Energy Cost Platform, including usage modelling, pricing, explanation,
CDR integration, and recommendation logic.

---

## Overview

The Energy Cost Platform is designed to accurately calculate and compare
electricity costs in the Australian market.

Key goals:
- Correct tariff pricing
- Explainable results
- Support both real interval data and estimated usage
- Enable fair comparison across multiple energy plans via CDR

The system is built around **two usage models** and a **shared pricing engine**.

---

## Usage Models

### Model 1 – Interval-based (Correctness-first)

Model 1 uses **real interval data (5-minute or 30-minute)** as ground truth.

This model prioritizes pricing correctness and deterministic results.

**Typical use cases**
- Customers with smart meter interval reads
- Validation and auditing
- Accurate TOU / demand charge calculation

#### Processing Flow

Interval input  
→ Normalize timestamps (UTC → local, DST-safe)  
→ Detect interval size and fill missing intervals  
→ Apply public holiday behaviour (treated as Sunday)  
→ Apply controlled load windows  
→ Preserve solar export intervals  
→ Produce canonical interval usage series  

#### Key Characteristics

- No assumptions or estimation
- All pricing is based directly on provided data
- Produces exact monthly and annual costs

---

### Model 2 – Average-based (Synthetic, v2)

Model 2 is used when **interval data is not available**.
It generates a full 12-month interval profile from average monthly kWh.

This model prioritizes **realism with transparency**.

**Typical use cases**
- New customers
- Comparison and recommendation
- “How much would this plan cost me?” scenarios

#### Processing Flow

Average monthly kWh  
→ Select household usage profile (evenings, all day, solar, EV)  
→ Scale profile to daily kWh  
→ Generate 12 months of interval data  
→ Apply postcode-based climate seasonality  
→ Apply holiday and controlled load logic  
→ Attach modelling assumptions and confidence metadata  
→ Produce canonical interval usage series  

#### Assumptions Metadata

Each Model 2 result carries assumptions such as:
- Profile type
- Climate zone
- Solar / EV / controlled load presence
- Confidence level of the estimate

This ensures results are **explainable and honest**.

---

## Pricing Engine

Both models feed into the **same pricing engine**, ensuring consistency.

Pricing components are fully modular and include:
- Daily supply charge
- Usage charge (flat or TOU)
- Demand charge
- Controlled load (usage and supply)
- Solar feed-in tariff (FIT)
- Fees and discounts

Pricing flow:

Canonical interval usage  
→ Resolve tariff periods (season, weekday, time-of-day)  
→ Calculate each pricing component  
→ Aggregate monthly breakdowns  
→ Produce annual totals  

The engine supports:
- Monthly cost breakdown
- Annual totals
- Sensitivity analysis (e.g. peak → off-peak shifting)

---

## Explain Engine (v2)

The Explain Engine answers the question: **“Why is this plan cheap or expensive?”**

Two types of explanations are generated:

### Cost-based explanations
- Lower daily supply charge
- Lower usage or TOU rates
- No demand charges
- Higher solar feed-in credits

### Assumption-based explanations
- Climate-driven seasonal usage
- Synthetic profile assumptions
- Data confidence notes

Explanations are:
- Ranked by impact
- Capped to avoid noise
- Designed to avoid over-claiming

---

## Consumer Data Right (CDR) Integration

The platform integrates with the Australian **Consumer Data Right (CDR)** energy APIs.

Key features:
- Registry of retailer brands with base URIs
- Enable/disable retailers via configuration
- Fetch plan lists and plan details
- Filter plans by postcode geography (included / excluded rules)
- Cache and throttle requests for API stability

CDR data is treated strictly as **input data** and is kept separate from pricing logic.

---

## Recommendation Engine

The recommendation engine compares multiple plans fairly using the same usage model.

Recommendation flow:

Postcode + usage input  
→ Fetch eligible CDR plans  
→ Filter plans by geography  
→ Run usage pipeline once  
→ Price all plans in parallel  
→ Sort by total cost  
→ Generate recommendation reasons  
→ Return top 3 cheapest plans  

This ensures:
- No plan is favoured by different usage assumptions
- Performance scales with parallel pricing
- Failures in one plan do not affect others

---

## API Endpoints

### POST `/energy/cost`

Calculates the cost of a specific plan.

- Supports interval and average usage
- Returns:
  - Annual total
  - Monthly breakdown
  - Sensitivity analysis
  - Explanations
  - Modelling assumptions (Model 2)

### POST `/energy/recommend`

Recommends the cheapest plans for a given postcode and usage profile.

- Uses live CDR data
- Prices plans consistently
- Returns top 3 plans with reasons

---

## Testing

The system is tested using curl-based JSON fixtures.

Test coverage includes:
- Cost calculation (average + interval)
- Controlled load scenarios
- Solar export scenarios
- Holiday pricing
- Plan recommendation (average + interval)

Results are deterministic, explainable, and consistent.

---

## Architectural Summary

- Usage modelling is fully decoupled from pricing
- Pricing logic is reused across cost calculation and recommendation
- Model 1 provides correctness and ground truth
- Model 2 provides estimation with transparency
- CDR integration is isolated and replaceable
- The system is designed for multi-retailer and future extensions

---

## Conclusion

The Energy Cost Platform is a complete, production-ready foundation
for energy cost calculation and comparison.

It balances accuracy, realism, performance, and explainability,
and is designed to scale across retailers, plans, and customer scenarios.
