"""
Google Trends fetcher for gemmology.dev SEO hub head terms.

Purpose: free, scriptable alternative to DataForSEO for confirming the relative
trajectory and priority of the five keyword-cluster hub head terms introduced in
the SEO v3 wave. Answers the question: which terms have the strongest and most
growing organic demand, informing content investment priority.

Plan ID: piped-frolicking-matsumoto

Head terms covered (verbatim, Google caps at 5 per comparison query):
  1. how to identify gemstones
  2. gemstone properties chart
  3. FGA exam preparation
  4. how to use a refractometer
  5. synthetic diamond identification

Outputs (relative to this file's parent directory, i.e. audits/seo-2026-05/):
  output/interest_over_time.{csv,json}
  output/interest_by_region.{csv,json}
  output/related_queries.json

Edit the TERMS list below to re-run with different keywords.
"""

# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "pytrends>=4.9.2",
#   "pandas>=2.0",
#   "requests>=2.28",
# ]
# ///

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from pytrends.exceptions import TooManyRequestsError
from pytrends.request import TrendReq

# ---------------------------------------------------------------------------
# Configuration — edit TERMS to re-run with different keywords.
# ---------------------------------------------------------------------------

TERMS: list[str] = [
    "how to identify gemstones",
    "gemstone properties chart",
    "FGA exam preparation",
    "how to use a refractometer",
    "synthetic diamond identification",
]

TIMEFRAME = "today 5-y"      # 5-year window
GEO = ""                      # Worldwide
CATEGORY = 0                  # All categories
REGION_RESOLUTION = "COUNTRY"
REGION_MAX = 25

RETRY_WAIT_S = 30.0
INTER_REQUEST_SLEEP_S = 1.5

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_HERE = Path(__file__).parent
_OUTPUT = _HERE.parent / "output"
_OUTPUT.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_pytrends() -> TrendReq:
    return TrendReq(hl="en-US", tz=0, timeout=(10, 25))


def _build_payload(pt: TrendReq) -> None:
    pt.build_payload(
        kw_list=TERMS,
        timeframe=TIMEFRAME,
        geo=GEO,
        cat=CATEGORY,
    )


def _fetch_with_retry(fn: Any, *args: Any, **kwargs: Any) -> Any:
    """Call *fn* once; on TooManyRequestsError wait RETRY_WAIT_S then retry once."""
    try:
        return fn(*args, **kwargs)
    except TooManyRequestsError:
        print(
            f"[trends] Rate-limited by Google. Waiting {RETRY_WAIT_S:.0f} s before retry…"
        )
        time.sleep(RETRY_WAIT_S)
        try:
            return fn(*args, **kwargs)
        except TooManyRequestsError as exc:
            raise SystemExit(
                "[trends] ERROR: Google Trends is still rate-limiting after one retry. "
                "Wait a few minutes and try again. "
                f"Original error: {exc}"
            ) from exc


def _df_to_json_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return json.loads(df.reset_index().to_json(orient="records", date_format="iso"))


# ---------------------------------------------------------------------------
# Fetch functions
# ---------------------------------------------------------------------------

def fetch_interest_over_time(pt: TrendReq) -> pd.DataFrame:
    print("[trends] Fetching interest_over_time…")
    _build_payload(pt)
    df: pd.DataFrame = _fetch_with_retry(pt.interest_over_time)
    if "isPartial" in df.columns:
        df = df.drop(columns=["isPartial"])
    return df


def fetch_interest_by_region(pt: TrendReq) -> pd.DataFrame:
    print("[trends] Fetching interest_by_region…")
    time.sleep(INTER_REQUEST_SLEEP_S)
    _build_payload(pt)
    df: pd.DataFrame = _fetch_with_retry(
        pt.interest_by_region,
        resolution=REGION_RESOLUTION,
        inc_low_vol=True,
        inc_geo_code=False,
    )
    # Keep top N countries by sum across all terms
    df["_total"] = df[TERMS].sum(axis=1)
    df = df.sort_values("_total", ascending=False).head(REGION_MAX).drop(columns=["_total"])
    return df


def fetch_related_queries(pt: TrendReq) -> dict[str, dict[str, list[dict[str, Any]]]]:
    print("[trends] Fetching related_queries…")
    time.sleep(INTER_REQUEST_SLEEP_S)
    _build_payload(pt)
    raw: dict[str, Any] = _fetch_with_retry(pt.related_queries)

    result: dict[str, dict[str, list[dict[str, Any]]]] = {}
    for term in TERMS:
        entry = raw.get(term, {})
        top_df: pd.DataFrame | None = entry.get("top")
        rising_df: pd.DataFrame | None = entry.get("rising")
        result[term] = {
            "top": top_df.to_dict(orient="records") if top_df is not None else [],
            "rising": rising_df.to_dict(orient="records") if rising_df is not None else [],
        }
    return result


# ---------------------------------------------------------------------------
# Persist helpers
# ---------------------------------------------------------------------------

def write_csv_json(df: pd.DataFrame, stem: str) -> None:
    csv_path = _OUTPUT / f"{stem}.csv"
    json_path = _OUTPUT / f"{stem}.json"
    df.to_csv(csv_path)
    json_path.write_text(
        json.dumps(_df_to_json_records(df), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"[trends] Wrote {csv_path.name} and {json_path.name}")


# ---------------------------------------------------------------------------
# Summary table
# ---------------------------------------------------------------------------

def _slope(series: pd.Series) -> float:
    """Linear-regression slope (units / month) over the last 12 data points."""
    tail = series.dropna().tail(12)
    if len(tail) < 2:
        return 0.0
    x = np.arange(len(tail), dtype=float)
    coeffs: np.ndarray = np.polyfit(x, tail.values.astype(float), 1)
    return float(coeffs[0])


def _trend_arrow(slope: float) -> str:
    if slope > 0.5:
        return "↑"
    if slope < -0.5:
        return "↓"
    return "→"


def print_summary(iot: pd.DataFrame) -> None:
    col_w = max(len(t) for t in TERMS) + 2
    header = (
        f"{'Term':<{col_w}}  {'Mean':>6}  {'Max':>5}  {'Peak month':<12}  Trend (12 mo)"
    )
    print()
    print("=" * len(header))
    print(header)
    print("=" * len(header))

    for term in TERMS:
        if term not in iot.columns:
            print(f"{term:<{col_w}}  (no data)")
            continue
        series = iot[term].dropna()
        mean_val = float(series.mean())
        max_val = float(series.max())
        peak_month = str(series.idxmax())[:7] if not series.empty else "—"
        slope = _slope(series)
        arrow = _trend_arrow(slope)
        print(
            f"{term:<{col_w}}  {mean_val:>6.1f}  {max_val:>5.0f}  "
            f"{peak_month:<12}  {arrow}  ({slope:+.2f}/mo)"
        )

    print("=" * len(header))
    print(
        "Note: Google Trends interest is relative (0–100). "
        "Slope computed over last 12 monthly data points."
    )
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    pt = _build_pytrends()

    # 1. Interest over time
    iot = fetch_interest_over_time(pt)
    write_csv_json(iot, "interest_over_time")

    # 2. Interest by region
    time.sleep(INTER_REQUEST_SLEEP_S)
    ibr = fetch_interest_by_region(pt)
    write_csv_json(ibr, "interest_by_region")

    # 3. Related queries
    time.sleep(INTER_REQUEST_SLEEP_S)
    rq = fetch_related_queries(pt)
    rq_path = _OUTPUT / "related_queries.json"
    rq_path.write_text(json.dumps(rq, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[trends] Wrote {rq_path.name}")

    # 4. Summary
    print_summary(iot)


if __name__ == "__main__":
    main()
