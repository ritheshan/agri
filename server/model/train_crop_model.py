import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load the crop dataset
crop_df = pd.read_csv('../data/crop.csv')

# Debug: Check for missing values

# Debug: Check unique labels

# Features and target
X = crop_df[['N','P','K','temperature','humidity','ph','rainfall','ozone']]
y = crop_df['label']

# Debug: Show feature sample

# Train the model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save the model
joblib.dump(model, '../model/crop_model.pkl')

