---
title: Why I Still Look Up
excerpt: Lorem ipsum dolor sit amet. On the quiet joy of following space exploration as a software person who builds things on Earth.
date: 2026-02-15
lang: en
category: personal
tags: [space, exploration]
animation: morph
external: false
---

# Why I Still Look Up

Lorem ipsum dolor sit amet, consectetur adipiscing elit. I'm not an aerospace engineer. I build data pipelines and SQL queries. But every time a rocket launches, I stop what I'm doing and watch.

## The Engineering

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore:

- **Falcon 9** lands on a drone ship in the ocean after delivering payload to orbit
- **James Webb Space Telescope** unfolds a sunshield the size of a tennis court, 1.5 million km from Earth
- **Ingenuity** flew a helicopter on Mars — a planet with 1% of Earth's atmosphere

> Every one of these achievements started as a problem someone said was impossible. That's engineering.

## The Data

Space generates incredible datasets:

```sql
-- Hypothetical: querying exoplanet candidates
SELECT
  planet_name,
  orbital_period_days,
  radius_earth_radii,
  equilibrium_temp_k
FROM kepler_candidates
WHERE
  radius_earth_radii BETWEEN 0.8 AND 1.5
  AND equilibrium_temp_k BETWEEN 200 AND 320
ORDER BY discovery_date DESC;
```

The Kepler mission alone produced over 2,600 confirmed exoplanets from **150,000 stars** worth of light curves. That's a data pipeline problem at cosmic scale.

## What Space Teaches About Software

Lorem ipsum dolor sit amet:

1. **Redundancy matters** — spacecraft have backup systems for backup systems
2. **Testing is non-negotiable** — you can't hotfix something in orbit
3. **Constraints drive creativity** — limited bandwidth, power, and compute force elegant solutions
4. **Long-term thinking** — missions are planned decades in advance

## The Pale Blue Dot

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Carl Sagan said it best:

> Look again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives.

I look up because it reminds me that the problems I solve with SQL and Python are small — but they're still worth solving well.
