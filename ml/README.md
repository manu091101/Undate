# Lumin ML

Python-side machine-learning pipelines for Lumin: candidate retrieval, ranking, narrative generation prep, safety classifiers, and offline evaluation.

The TypeScript application (`apps/api`, `packages/ai`) handles online inference via vendor APIs (OpenAI / Anthropic) and pgvector ANN. This directory handles **offline training, batch inference, and evaluation**.

```
ml/
├── data/           Synthetic + bootstrapped training data
├── pipelines/      Batch jobs (embedding refresh, ranker training, cohort retrieval)
├── models/         Saved model artifacts (gitignored; pulled from S3 in prod)
├── training/       Trainer scripts + configs
└── evaluation/     Offline metrics + counterfactual evaluation
```

## Setup

```bash
cd ml
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## What ships in v0 (cold start)

Until we have ≥5,000 labeled curator decisions, the production ranker is **rule-based + LLM-grounded** (see `pipelines/cold_start_ranker.py`). No deep learning until we have signal worth fitting.

After ~5k labels:
- `training/train_ranker.py` — LightGBM ranker on curator pairwise preferences.
- `training/train_two_tower.py` — Two-tower reciprocal recommendation (PyTorch).
- `training/train_safety.py` — Fine-tune Llama-Guard-3 / DistilBERT on harassment + scam labels.

## Production wire-up

- Daily: `pipelines/refresh_embeddings.py` runs at 02:00 SGT / 21:30 IST; refreshes profile_embedding for users with changes.
- Saturday 18:00 (T-1 to drop): `pipelines/weekly_cohort.py` runs candidate retrieval + cold-start ranker for every active user.
- Sunday 02:00: curator queue populated with ranker output + LLM narrative drafts.
- Sunday 09:00–18:00: curators approve/edit.
- Sunday 19:00: drops delivered per user local time.
