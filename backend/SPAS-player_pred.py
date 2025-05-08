import streamlit as st
import pandas as pd
import os
import pickle
import matplotlib.pyplot as plt
import plotly.express as px
import seaborn as sns
import numpy as np
from PIL import Image
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


# Set Streamlit page config
st.set_page_config(layout="wide")

# ===== CUSTOM CSS FOR WHITE BACKGROUND & BLACK TEXT =====
st.markdown("""
    <style>
    /* White header section */
    .stApp header {
        background-color: #FFFFFF !important;
    }
    
    /* Main white background */
    .stApp {
        background-color: white;
    }
    
    /* Sidebar - white with black text */
    [data-testid=stSidebar] {
        background-color: white !important;
    }
    .sidebar .sidebar-content {
        color: black !important;
    }
    
    /* All text black */
    body, h1, h2, h3, h4, h5, h6, p, div, label, .stTextInput, 
    .stNumberInput, .stSelectbox, .stSlider {
        color: black !important;
    }
    
    /* Feature importance section - white background */
    .element-container .stPlotlyChart {
        background-color: white;
        border-radius: 10px;
        padding: 10px;
    }
    
            /* Force all text in Plotly chart to black */
    .stPlotlyChart .svg-container text,
    .stPlotlyChart .legendtext,
    .stPlotlyChart .xtitle,
    .stPlotlyChart .ytitle,
    .stPlotlyChart .g-xtitle text,
    .stPlotlyChart .g-ytitle text,
    .stPlotlyChart .gtitle text {
        fill: black !important;
        color: black !important;
    }
    /* Axis lines and ticks */
    .stPlotlyChart .xaxis line,
    .stPlotlyChart .yaxis line,
    .stPlotlyChart .xaxis path,
    .stPlotlyChart .yaxis path,
    .stPlotlyChart .xaxis tick,
    .stPlotlyChart .yaxis tick {
        stroke: black !important;
    }
    /* Green prediction button */
    .stButton>button {
        background-color: #4CAF50 !important;
        color: white !important;
        border: none;
        padding: 10px 24px;
        font-weight: bold;
        border-radius: 5px;
    }
    .stButton>button:hover {
        background-color: #45a049 !important;
    }
    
   
    </style>
    """, unsafe_allow_html=True)


# Load trained model
model_filename = "xgb_final_trained_model.pkl"
with open(model_filename, "rb") as file:
    xgb_model = pickle.load(file)

    # Load the feature importance data
feature_importance_file = "feature_importance.xlsx"
if os.path.exists(feature_importance_file):
    feature_importance_df = pd.read_excel(feature_importance_file)
else:
    st.error("Feature importance file not found!")
    st.stop()

# Load dataset
new_player_agg = pd.read_excel("player_data_with_pred.xlsx")

# Extract features and target
X = new_player_agg.drop(columns=["Player", "Market Value Euros"])
y = new_player_agg["Market Value Euros"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Sidebar setup
st.sidebar.image("PIC 1.png", use_container_width=True)
st.sidebar.header("Player Input Features")

# Default input values
default_values = {
    "Age": 37, "Min": 1873, "Comp_Premier League": True, "PasTotCmp%": 65.6, "Rec": 10.8,
    "TouAttPen": 0.00, "CarTotDist": 101.5, "Tkl+Int": 0.00, "CarProg": 0.00, "AerWon": 0.48,
    "GcaPassLive": 0.00, "Recov": 0.48, "PasProg": 0.00, "90s": 20.8, "CrdY": 0.00,
    "AerLost": 0.05, "PasShoAtt": 3.70, "TouAtt3rd": 0.0, "Int": 0.00, "TklDef3rd": 0.00,
    "ToTkl": 0.00
}

# Get expected feature names from the model
expected_features = xgb_model.get_booster().feature_names

# Fill in missing features with default values
for feature in expected_features:
    if feature not in default_values:
        default_values[feature] = 0

# Input fields in the sidebar
player_inputs = {}
for col, default in default_values.items():
    if isinstance(default, bool):
        player_inputs[col] = st.sidebar.selectbox(f"{col}", [True, False], index=int(default))
    else:
        player_inputs[col] = st.sidebar.number_input(f"{col}", value=float(default), format="%.2f")

# Convert inputs into a DataFrame for prediction
input_df = pd.DataFrame([player_inputs])
input_df = input_df.reindex(columns=expected_features, fill_value=0)

# Main page setup
image_path_main = "PIC 2.png"
if os.path.exists(image_path_main):
    st.image(image_path_main, use_container_width=True)
st.title("SPAS Player Analysis & Market Value Prediction")


# Create two columns
left_col, right_col = st.columns(2)

# Left column: Feature Importance
with left_col:
    st.subheader("Feature Importance")
    if "Feature Importance Score" in feature_importance_df.columns and "Variable" in feature_importance_df.columns:
        fig = px.bar(
            feature_importance_df.sort_values("Feature Importance Score", ascending=True),
            x="Feature Importance Score",
            y="Variable",
            orientation="h",
            title="Feature Importance",
            labels={"Variable": "Features", "Feature Importance Score": "Importance"},
            width=400,
            height=500
        )

        fig.update_layout(
            plot_bgcolor='white',
            paper_bgcolor='white',
            font_color='black'
        )
       
        st.plotly_chart(fig, use_container_width=False)
    else:
        st.warning("Feature importance data format is incorrect.")

# Right column: Prediction Result
with right_col:
    st.subheader("Predicted Market Value")
    if st.button("Predict Market Value"):
        try:
            prediction = xgb_model.predict(input_df)[0]
            st.success(f"Predicted Market Value: €{prediction:,.2f}")
        except Exception as e:
            st.error(f"Prediction failed: {e}")
    else:
        st.info("Enter inputs on the left and click 'Predict Market Value'.")

# Ensure unique keys for sidebar selectboxes
player_inputs = {}
for i, (col, default) in enumerate(default_values.items()):
    if col == "Comp_Premier League":
        player_inputs[col] = st.sidebar.selectbox(
            f"{col}", [True, False], index=int(default), key=f"selectbox_{col}_{i}"
        )
    else:
        player_inputs[col] = st.sidebar.number_input(f"{col}", value=float(default))

input_df = pd.DataFrame([player_inputs])







# Streamlit run SPAS-player_pred.py
