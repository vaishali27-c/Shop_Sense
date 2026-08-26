from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import os

app = FastAPI(title="ShopSense ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "website_score_model.pkl")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "website_preprocessor.pkl")

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)

REQUIRED_FEATURES = [
    "industry",
    "website_type",
    "page_type",
    "country",
    "device",
    "traffic_source",
    "active_users",
    "new_users",
    "sessions",
    "engaged_sessions",
    "engagement_rate_pct",
    "bounce_rate_pct",
    "avg_session_duration_sec",
    "sessions_per_user",
    "views",
    "events",
    "conversions",
    "conversion_rate_pct",
    "revenue",
    "search_impressions",
    "search_clicks",
    "search_ctr_pct",
    "avg_search_position",
    "indexed_pages",
    "submitted_pages",
    "indexing_rate_pct",
    "crawl_errors",
    "broken_links",
    "page_load_time_sec",
    "lcp_sec",
    "inp_ms",
    "cls",
    "core_web_vitals_pass_pct",
    "mobile_usability_score",
    "https_enabled",
    "sitemap_present",
    "robots_configured",
    "schema_coverage_pct",
    "pages_with_title_pct",
    "pages_with_meta_description_pct",
    "duplicate_content_pct",
    "ga4_score",
    "gsc_score",
    "overall_score",
    "engagement_quality",
    "conversion_efficiency",
    "seo_click_efficiency",
    "indexing_gap_pct",
    "technical_seo_health",
    "content_health",
    "page_performance_health",
    "search_visibility",
    "session_quality",
    "ga4_gsc_gap",
    "score_balance",
]


@app.get("/")
def root():
    return {
        "service": "ShopSense ML Service",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None
    }


@app.post("/predict")
def predict(data: dict):

    missing = [
        feature
        for feature in REQUIRED_FEATURES
        if feature not in data
    ]

    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Missing required model features",
                "missing_features": missing
            }
        )

    try:
        input_data = {
            feature: data[feature]
            for feature in REQUIRED_FEATURES
        }

        input_df = pd.DataFrame([input_data])

        # Preprocess
        input_processed = preprocessor.transform(input_df)

        # Predict next month's score
        predicted_score = model.predict(input_processed)[0]

        # Keep prediction between 0 and 100
        predicted_score = max(0, min(100, predicted_score))

        # Current metrics
        current_score = input_data["overall_score"]
        search_ctr = input_data["search_ctr_pct"]
        page_load = input_data["page_load_time_sec"]

        # Detect issue
        if page_load > 5:
            issue = "Slow Page Speed"
            recommendation = (
                "Optimize images, JavaScript, CSS, caching, "
                "and server response time."
            )

        elif search_ctr < 5:
            issue = "Low Search CTR"
            recommendation = (
                "Improve page titles and meta descriptions "
                "to increase search click-through rate."
            )

        elif predicted_score < 50:
            issue = "Low Overall Performance"
            recommendation = (
                "Improve SEO, engagement, technical performance, "
                "and search visibility."
            )

        else:
            issue = "No Major Issue"
            recommendation = (
                "Continue monitoring website performance and SEO metrics."
            )

        # Priority
        if issue == "No Major Issue":
            priority = "Low"

        elif predicted_score < 50:
            priority = "High"

        elif issue in ["Slow Page Speed", "Low Overall Performance"]:
            priority = "High"

        else:
            priority = "Medium"

        return {
            "current_score": round(float(current_score), 2),
            "predicted_score": round(float(predicted_score), 2),
            "issue": issue,
            "recommendation": recommendation,
            "priority": priority
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )