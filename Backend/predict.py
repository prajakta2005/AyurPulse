import pandas as pd
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Set the working directory to the folder where this script is located
os.chdir(os.path.dirname(os.path.abspath(__file__)))

try:
    print("Step 1: Loading Dataset...")
    # Use the raw string 'r' to avoid path errors
    df = pd.read_csv(r'D:\MlFinal\AyurPulse\Backend\Updated_Prakriti_With_Features.csv')
    
    print("Step 2: Encoding 30 columns...")
    label_encoders = {}
    for column in df.columns:
        if df[column].dtype == 'object':
            le = LabelEncoder()
            df[column] = le.fit_transform(df[column].astype(str))
            label_encoders[column] = le
            
    # Step 3: Define X and y
    # IMPORTANT: Ensure your CSV has a column exactly named 'Dosha'
    X = df.drop('Dosha', axis=1) 
    y = df['Dosha']
    
    print("Step 4: Training the Model (Random Forest)...")
    # Using max_depth to prevent the 100% accuracy overfitting we discussed
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X, y)
    
    print("Step 5: Saving files to Backend folder...")
    with open('dosha_model.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    with open('label_encoders.pkl', 'wb') as f:
        pickle.dump(label_encoders, f)
        
    print("✅ SUCCESS: Both dosha_model.pkl and label_encoders.pkl generated!")

except Exception as e:
    print(f"❌ ERROR: {e}")