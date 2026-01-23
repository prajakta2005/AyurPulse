"use client"

import { useState } from "react"

export default function CreateDietChart() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showResult, setShowResult] = useState(false)
const [formData, setFormData] = useState({
  name: "", age: "", gender: "", height: "", weight: "", activityLevel: "",
  healthConditions: [], allergies: [], medications: "",
  dominantDosha: "",
  // ADD THESE MISSING KEYS TO MATCH YOUR PAYLOAD
  bodySize: "Medium", bodyWeight: "Moderate - steady weight", heightAttr: "Average",
  boneStructure: "Medium", complexion: "White, pale, tans easily",
  skinFeel: "Smooth and warm, oily T-zone", skinTexture: "Oily",
  faceShape: "Long, angular, thin", eyeType: "Medium-sized, penetrating, light-sensitive eyes",
  appetite: "Strong, Unbearable", digestionQuality: "moderate", 
  sleepPattern: "moderate", stressLevel: "moderate",
  dietType: "", foodPreferences: [], dislikedFoods: [], mealTiming: "",
  cookingTime: "", budget: "",
  healthGoals: [], weightGoal: "", timeframe: "",
})

  const doshaQuestions = [
    {
      question: "What is your body frame?",
      options: [
        { text: "Thin, light frame", dosha: "vata", score: 2 },
        { text: "Medium, muscular frame", dosha: "pitta", score: 2 },
        { text: "Large, heavy frame", dosha: "kapha", score: 2 },
      ],
    },
    {
      question: "How is your appetite?",
      options: [
        { text: "Variable, sometimes forget to eat", dosha: "vata", score: 2 },
        { text: "Strong, get irritable when hungry", dosha: "pitta", score: 2 },
        { text: "Steady, can skip meals easily", dosha: "kapha", score: 2 },
      ],
    },
    {
      question: "What is your sleep pattern?",
      options: [
        { text: "Light sleeper, difficulty falling asleep", dosha: "vata", score: 2 },
        { text: "Sound sleeper, moderate sleep needs", dosha: "pitta", score: 2 },
        { text: "Deep sleeper, need lots of sleep", dosha: "kapha", score: 2 },
      ],
    },
    {
      question: "How do you handle stress?",
      options: [
        { text: "Get anxious and worried", dosha: "vata", score: 2 },
        { text: "Get irritated and angry", dosha: "pitta", score: 2 },
        { text: "Remain calm and withdrawn", dosha: "kapha", score: 2 },
      ],
    },
    {
      question: "What is your skin type?",
      options: [
        { text: "Dry, rough, thin", dosha: "vata", score: 2 },
        { text: "Warm, oily, sensitive", dosha: "pitta", score: 2 },
        { text: "Thick, oily, smooth", dosha: "kapha", score: 2 },
      ],
    },
  ]

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }))
  }

  const handleDoshaAnswer = (option) => {
    setFormData((prev) => ({
      ...prev,
      [`${option.dosha}Score`]: prev[`${option.dosha}Score`] + option.score,
    }))
  }

const handlePredictDosha = async () => {
  console.log("Predict button clicked!"); 
  
  // We MUST provide all keys that app.py expects in 'feature_order'
  const payload = {
    "Body Size": formData.bodySize || "Medium",
    "Body Weight": formData.bodyWeight || "Moderate - steady weight",
    "Height": formData.heightAttr || "Average",
    "Bone Structure": formData.boneStructure || "Medium",
    "Complexion": formData.complexion || "Fair",
    "General feel of skin": formData.skinFeel || "Smooth",
    "Texture of Skin": formData.skinTexture || "Normal",
    "Hair Color": "Black", // Defaulting missing features
    "Appearance of Hair": "Straight",
    "Shape of face": formData.faceShape || "Oval",
    "Eyes": formData.eyeType || "Medium",
    "Eyelashes": "Normal",
    "Blinking of Eyes": "Normal",
    "Cheeks": "Normal",
    "Nose": "Normal",
    "Teeth and gums": "Normal",
    "Lips": "Normal",
    "Nails": "Normal",
    "Appetite": formData.appetite || "Normal",
    "Liking tastes": "Sweet",
    "Metabolism Type": "Normal",
    "Climate Preference": "Temperate",
    "Stress Levels": formData.stressLevel || "Moderate",
    "Sleep Patterns": formData.sleepPattern || "Normal",
    "Dietary Habits": "Vegetarian",
    "Physical Activity Level": "Moderate",
    "Water Intake": "Normal",
    "Digestion Quality": formData.digestionQuality || "Normal",
    "Skin Sensitivity": "Low"
  };

  try {
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Server error");
    }

    console.log("Prediction from Backend:", result.dosha);

    // Update state
    setFormData(prev => ({ ...prev, dominantDosha: result.dosha }));
    setShowResult(true); 

  } catch (error) {
    console.error("React Error:", error.message);
    alert(`Prediction Error: ${error.message}`);
  }
};
  const nextStep = () => { if (currentStep < 5) setCurrentStep(currentStep + 1) }
  const prevStep = () => {
    if (showResult) setShowResult(false)
    else if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleCreateDietPlan = () => {
    setShowResult(false)
    setCurrentStep(4)
  }

const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/save-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save patient data');
      }

      const result = await response.json();
      console.log("Database Response:", result);
      alert("Success! Patient Diet Chart saved to database.");
      
      // Optional: Redirect to Dashboard or reset form
      // window.location.href = "/patients";
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Error saving data to database. Check if Flask is running.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Create Your Personalized Diet Chart</h1>
          <p className="text-gray-600">Based on Ayurvedic principles and your personal preferences</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Step {currentStep} of 5</span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / 5) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input type="number" value={formData.age} onChange={(e) => handleInputChange("age", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter your age" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select value={formData.gender} onChange={(e) => handleInputChange("gender", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input type="number" value={formData.height} onChange={(e) => handleInputChange("height", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter height in cm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input type="number" value={formData.weight} onChange={(e) => handleInputChange("weight", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter weight in kg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
                  <select value={formData.activityLevel} onChange={(e) => handleInputChange("activityLevel", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (little to no exercise)</option>
                    <option value="light">Light (light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                    <option value="active">Active (hard exercise 6-7 days/week)</option>
                    <option value="very-active">Very Active (very hard exercise, physical job)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Health Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Health Conditions (Select all that apply)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Diabetes", "Hypertension", "Heart Disease", "Thyroid Issues", "PCOD/PCOS", "Digestive Issues", "Arthritis", "None"].map((condition) => (
                      <label key={condition} className="flex items-center">
                        <input type="checkbox" checked={formData.healthConditions.includes(condition)} onChange={(e) => handleArrayChange("healthConditions", condition, e.target.checked)} className="mr-2 text-green-600 focus:ring-green-500" />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Food Allergies (Select all that apply)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Nuts", "Dairy", "Gluten", "Eggs", "Seafood", "Soy", "None"].map((allergy) => (
                      <label key={allergy} className="flex items-center">
                        <input type="checkbox" checked={formData.allergies.includes(allergy)} onChange={(e) => handleArrayChange("allergies", allergy, e.target.checked)} className="mr-2 text-green-600 focus:ring-green-500" />
                        <span className="text-sm text-gray-700">{allergy}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications (if any)</label>
                  <textarea value={formData.medications} onChange={(e) => handleInputChange("medications", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" rows="3" placeholder="List any medications you're currently taking"></textarea>
                </div>
              </div>
            </div>
          )}
{currentStep === 3 && (
  !showResult ? (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-green-800 mb-6 border-b pb-2">Step 3: Prakriti (Dosha) Assessment</h2>
      
      <div className="space-y-8">
        {/* Physical Frame & Build */}
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Physical Frame & Build</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Size</label>
              <select value={formData.bodySize} onChange={(e) => handleInputChange("bodySize", e.target.value)} className="p-2 border rounded w-full">
                <option value="Slim">Slim</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight Tendency</label>
              <select value={formData.bodyWeight} onChange={(e) => handleInputChange("bodyWeight", e.target.value)} className="p-2 border rounded w-full">
                <option value="Low - difficulties in gaining weight">Low (Vata)</option>
                <option value="Moderate - steady weight">Moderate (Pitta)</option>
                <option value="Heavy - difficulties in losing weight">Heavy (Kapha)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skin, Hair & Face */}
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
          <h3 className="text-lg font-semibold text-orange-700 mb-4">Skin, Hair & Face</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skin Texture & Feel</label>
              <select value={formData.skinTexture} onChange={(e) => handleInputChange("skinTexture", e.target.value)} className="p-2 border rounded w-full">
                <option value="Dry">Dry / Rough</option>
                <option value="Oily">Oily / Smooth</option>
                <option value="Normal">Normal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eye Appearance</label>
              <select value={formData.eyeType} onChange={(e) => handleInputChange("eyeType", e.target.value)} className="p-2 border rounded w-full">
                <option value="Small, dry, blinking">Small / Dry</option>
                <option value="Medium, penetrating">Medium / Penetrating</option>
                <option value="Large, calm, thick lashes">Large / Calm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metabolism & Digestion */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Metabolism & Digestion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appetite Type</label>
              <select value={formData.appetite} onChange={(e) => handleInputChange("appetite", e.target.value)} className="p-2 border rounded w-full">
                <option value="Irregular">Irregular</option>
                <option value="Strong, Unbearable">Strong / Sharp</option>
                <option value="Low but steady">Slow / Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Digestion Quality</label>
              <select value={formData.digestionQuality} onChange={(e) => handleInputChange("digestionQuality", e.target.value)} className="p-2 border rounded w-full">
                <option value="Gassy/Bloated">Gassy / Bloated</option>
                <option value="Acidic/Burning">Acidic / Burning</option>
                <option value="Heavy/Slow">Heavy / Slow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Behavioral & Lifestyle */}
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <h3 className="text-lg font-semibold text-purple-700 mb-4">Behavioral & Lifestyle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Patterns</label>
              <select value={formData.sleepPattern} onChange={(e) => handleInputChange("sleepPattern", e.target.value)} className="p-2 border rounded w-full">
                <option value="Light / Interrupted">Light / Interrupted</option>
                <option value="Moderate / Sound">Moderate / Sound</option>
                <option value="Deep / Long">Deep / Long</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stress Response</label>
              <select value={formData.stressLevel} onChange={(e) => handleInputChange("stressLevel", e.target.value)} className="p-2 border rounded w-full">
                <option value="Anxiety / Worry">Anxiety / Worry</option>
                <option value="Anger / Irritability">Anger / Irritability</option>
                <option value="Withdrawal / Calm">Withdrawal / Calm</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={handlePredictDosha} 
          className="px-10 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          Predict Dosha
        </button>
      </div>
    </div>
  ) : (
    /* RESULT VIEW - This remains the same as your code */
    <div className="text-center py-10 animate-fadeIn">
      <div className="inline-block p-4 rounded-full bg-green-100 text-green-600 mb-4">
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-800">Assessment Complete!</h2>
      <p className="text-xl text-green-700 mt-2 uppercase font-black">
        Predicted Prakriti: {formData.dominantDosha === "0" ? "VATA" : formData.dominantDosha}
      </p>
      
      <div className="bg-green-50 p-6 rounded-xl mt-6 text-left border border-green-200 max-w-lg mx-auto">
        <h4 className="font-bold text-green-800 mb-2">Ayurvedic Insight:</h4>
        <p className="text-gray-700 leading-relaxed">
          {(formData.dominantDosha === "0" || formData.dominantDosha?.toLowerCase().includes("vata")) && "• Vata (Air): Focus on warm, cooked, grounding foods like ghee and root vegetables. Avoid raw/cold foods."}
          {formData.dominantDosha?.toLowerCase().includes("pitta") && "• Pitta (Fire): Focus on cooling, hydrating foods like cucumbers, melons, and coconut water."}
          {formData.dominantDosha?.toLowerCase().includes("kapha") && "• Kapha (Earth): Focus on light, warm, and spicy foods to stimulate metabolism."}
        </p>
      </div>

      <button 
        onClick={() => { setShowResult(false); setCurrentStep(4); }} 
        className="mt-8 px-10 py-3 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-700"
      >
        Next: Dietary Preferences →
      </button>
    </div>
  )
)}       {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dietary Preferences</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type</label>
                  <select value={formData.dietType} onChange={(e) => handleInputChange("dietType", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select diet type</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                    <option value="eggetarian">Eggetarian</option>
                    <option value="jain">Jain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Food Preferences (Select all that apply)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Spicy Food", "Sweet Food", "Sour Food", "Bitter Food", "Salty Food", "Raw Foods", "Cooked Foods", "Fermented Foods"].map((pref) => (
                      <label key={pref} className="flex items-center">
                        <input type="checkbox" checked={formData.foodPreferences.includes(pref)} onChange={(e) => handleArrayChange("foodPreferences", pref, e.target.checked)} className="mr-2 text-green-600 focus:ring-green-500" />
                        <span className="text-sm text-gray-700">{pref}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foods to Avoid (Select all that apply)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Onion", "Garlic", "Mushrooms", "Very Spicy", "Very Sweet", "Fried Foods", "Processed Foods", "None"].map((dislike) => (
                      <label key={dislike} className="flex items-center">
                        <input type="checkbox" checked={formData.dislikedFoods.includes(dislike)} onChange={(e) => handleArrayChange("dislikedFoods", dislike, e.target.checked)} className="mr-2 text-green-600 focus:ring-green-500" />
                        <span className="text-sm text-gray-700">{dislike}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Meal Timing</label>
                    <select value={formData.mealTiming} onChange={(e) => handleInputChange("mealTiming", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select meal timing</option>
                      <option value="early">Early (6-7 AM, 12-1 PM, 6-7 PM)</option>
                      <option value="regular">Regular (7-8 AM, 1-2 PM, 7-8 PM)</option>
                      <option value="late">Late (8-9 AM, 2-3 PM, 8-9 PM)</option>
                      <option value="flexible">Flexible timing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cooking Time Available</label>
                    <select value={formData.cookingTime} onChange={(e) => handleInputChange("cookingTime", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select cooking time</option>
                      <option value="minimal">Minimal (15-30 minutes)</option>
                      <option value="moderate">Moderate (30-60 minutes)</option>
                      <option value="extensive">Extensive (1+ hours)</option>
                      <option value="meal-prep">Prefer meal prep on weekends</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range (per month)</label>
                  <select value={formData.budget} onChange={(e) => handleInputChange("budget", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select budget range</option>
                    <option value="low">₹3,000 - ₹5,000</option>
                    <option value="medium">₹5,000 - ₹8,000</option>
                    <option value="high">₹8,000 - ₹12,000</option>
                    <option value="premium">₹12,000+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Health & Wellness Goals</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Health Goals (Select all that apply)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["Weight Loss", "Weight Gain", "Muscle Building", "Better Digestion", "Increased Energy", "Better Sleep", "Stress Management", "Immunity Boost", "Skin Health", "Hair Health"].map((goal) => (
                      <label key={goal} className="flex items-center">
                        <input type="checkbox" checked={formData.healthGoals.includes(goal)} onChange={(e) => handleArrayChange("healthGoals", goal, e.target.checked)} className="mr-2 text-green-600 focus:ring-green-500" />
                        <span className="text-sm text-gray-700">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight Goal</label>
                    <select value={formData.weightGoal} onChange={(e) => handleInputChange("weightGoal", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select weight goal</option>
                      <option value="lose-fast">Lose weight quickly (1-2 kg/month)</option>
                      <option value="lose-steady">Lose weight steadily (0.5-1 kg/month)</option>
                      <option value="maintain">Maintain current weight</option>
                      <option value="gain-lean">Gain lean muscle</option>
                      <option value="gain-weight">Gain weight overall</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                    <select value={formData.timeframe} onChange={(e) => handleInputChange("timeframe", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select timeframe</option>
                      <option value="1-month">1 Month</option>
                      <option value="3-months">3 Months</option>
                      <option value="6-months">6 Months</option>
                      <option value="1-year">1 Year</option>
                      <option value="long-term">Long-term lifestyle change</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showResult && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button onClick={prevStep} disabled={currentStep === 1} className={`px-6 py-2 rounded-md font-medium ${currentStep === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-500 text-white hover:bg-gray-600"}`}>Previous</button>
              {currentStep === 3 ? (
                <button onClick={handlePredictDosha} className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">Predict Dosha</button>
              ) : currentStep < 5 ? (
                <button onClick={nextStep} className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700">Next</button>
              ) : (
                <button onClick={handleSubmit} className="px-6 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700">Create Diet Chart</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}