import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle

# 1. Load the dataset
# Using raw string (r'') to avoid path errors
df = pd.read_csv(r'D:\ML\SIH\Backend\dosha_dataset.csv')

# --- SECTION: EXPLORATORY DATA ANALYSIS (EDA) ---
print("--- Initial Data Insights ---")
print(df.describe())
print("\nClass Distribution (How many of each Dosha):")
print(df['label'].value_counts())

# Plot 1: Class Distribution
plt.figure(figsize=(8, 5))
sns.countplot(x='label', data=df, palette='viridis')
plt.title('Distribution of Ayurvedic Doshas in Dataset')
plt.savefig('dosha_distribution.png')
plt.show()

# Plot 2: Correlation Heatmap
# Helps see which features are most related to each other
plt.figure(figsize=(10, 8))
# We drop 'label' for heatmap as it is a string
sns.heatmap(df.drop('label', axis=1).corr(), annot=True, cmap='coolwarm')
plt.title('Feature Correlation Heatmap')
plt.savefig('correlation_heatmap.png')
plt.show()

# --- SECTION: MODEL TRAINING ---

X = df.drop('label', axis=1)
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# --- SECTION: ACCURACY & EVALUATION ---

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n" + "="*40)
print(f"MODEL ACCURACY: {accuracy * 100:.2f}%")
print("="*40)
print("\nDetailed Performance Metrics:")
print(classification_report(y_test, y_pred))

# Plot 3: Confusion Matrix Visualization
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Greens', 
            xticklabels=model.classes_, yticklabels=model.classes_)
plt.xlabel('Predicted Label')
plt.ylabel('Actual Label')
plt.title('Confusion Matrix: Actual vs Predicted Dosha')
plt.savefig('confusion_matrix.png')
plt.show()

# Plot 4: Feature Importance
# Shows which question (Sleep, Skin, etc.) was most useful for the ML model
importances = model.feature_importances_
feat_importances = pd.Series(importances, index=X.columns)
plt.figure(figsize=(8, 5))
feat_importances.nlargest(5).plot(kind='barh', color='teal')
plt.title('Feature Importance (Which factor matters most?)')
plt.savefig('feature_importance.png')
plt.show()

# --- SECTION: SAVE MODEL ---

with open('dosha_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("\nModel and plots saved successfully!")