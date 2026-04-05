---
title: The Anime Data Viz Challenge
excerpt: I visualized 10 years of MyAnimeList data using SQL and Power BI. The results surprised me — and taught me something about storytelling with data.
date: 2026-03-01
tags: [data-viz, power-bi, fun]
external: false
---

# The Anime Data Viz Challenge

I watch a lot of anime. I also spend a lot of time in databases. So when I found a dataset of 10 years of MyAnimeList ratings, genres, and studios — I knew what I had to do.

## The Dataset

The Kaggle dataset contains:
- ~17,000 anime titles
- Ratings, member counts, and favorites
- Genre tags and studio information
- Airing dates and episode counts

## The Questions

1. Which studios consistently produce the highest-rated anime?
2. Is there a "golden length" for anime series?
3. How have genre trends shifted over the decade?

## Surprising Findings

### Studio quality is remarkably consistent

Madhouse, Bones, and Wit Studio maintain average ratings above 7.5 across their entire catalogs. Studio Deen... does not. The standard deviation tells the real story: some studios are high-variance bets.

### 12-13 episodes is the sweet spot

Single-cour anime (12-13 episodes) have the highest average rating. Two-cour shows (24-26) are close behind. Anything over 100 episodes drops significantly — length fatigue is real.

### Isekai exploded in 2016

Before 2016, isekai (transported to another world) was a niche genre. After 2016, it accounts for 15% of all new anime. The data doesn't lie — we're living in the isekai era.

## The Technical Stack

- **PostgreSQL** for data storage and analysis (CTEs, window functions, pivot queries)
- **Power BI** for visualization
- **Python** for data cleaning and import

## What I Learned About Data Storytelling

Numbers without narrative are just noise. The anime dataset taught me that the best visualizations answer a question the viewer didn't know they had. "Which studio should I trust?" is more compelling than "Average rating by studio."

Data viz is not about showing data. It's about showing insight.
