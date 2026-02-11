"use client"

import { useState } from "react"

export default function CreateDietChart() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showResult, setShowResult] = useState(false)
  const [showDietChart, setShowDietChart] = useState(false)
  const [dietChart, setDietChart] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [generationProgress, setGenerationProgress] = useState("")
  
  const [formData, setFormData] = useState({
    name: "", age: "", gender: "", height: "", weight: "", activityLevel: "",
    healthConditions: [], allergies: [], medications: "",
    dominantDosha: "",
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

  // Define meal order and display names once
  const MEAL_ORDER = [
    'earlyMorning',
    'breakfast',
    'midMorning',
    'lunch',
    'eveningSnack',
    'dinner',
    'beforeBed'
  ];

  const mealIcons = {
    earlyMorning: '🌅',
    breakfast: '🍳',
    midMorning: '🥤',
    lunch: '🍛',
    eveningSnack: '☕',
    dinner: '🍲',
    beforeBed: '🥛'
  };

  const mealNames = {
    earlyMorning: 'Early Morning',
    breakfast: 'Breakfast',
    midMorning: 'Mid-Morning Snack',
    lunch: 'Lunch',
    eveningSnack: 'Evening Snack',
    dinner: 'Dinner',
    beforeBed: 'Before Bed'
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }))
  }

  const handlePredictDosha = async () => {
    console.log("Predict button clicked!"); 
    
    const payload = {
      "Body Size": formData.bodySize || "Medium",
      "Body Weight": formData.bodyWeight || "Moderate - steady weight",
      "Height": formData.heightAttr || "Average",
      "Bone Structure": formData.boneStructure || "Medium",
      "Complexion": formData.complexion || "Fair",
      "General feel of skin": formData.skinFeel || "Smooth",
      "Texture of Skin": formData.skinTexture || "Normal",
      "Hair Color": "Black",
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
      setFormData(prev => ({ ...prev, dominantDosha: result.dosha }));
      setShowResult(true); 

    } catch (error) {
      console.error("React Error:", error.message);
      alert(`Prediction Error: ${error.message}`);
    }
  };

  const handleGenerateDietChart = async () => {
    setIsGenerating(true);
    setGenerationProgress("Initializing diet chart generation...");
    
    const generateWithRetry = async (retries = 2) => {
      for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        
        try {
          setGenerationProgress(`Generating your personalized diet chart (attempt ${i + 1}/${retries})... This may take up to 2 minutes.`);
          
          // 2 minute timeout (120000 ms)
          const timeoutId = setTimeout(() => {
            controller.abort();
            setGenerationProgress("Request timed out. Retrying...");
          }, 120000);
          
          const response = await fetch('http://localhost:5000/generate-diet-chart', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(formData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
          }

          const result = await response.json();
          
          if (!result.dietChart) {
            throw new Error("Invalid response format from server");
          }

          console.log("Diet Chart received successfully");
          setDietChart(result.dietChart);
          setShowDietChart(true);
          setGenerationProgress("");
          return true; // Success
          
        } catch (error) {
          console.error(`Attempt ${i + 1} failed:`, error);
          
          if (i === retries - 1) {
            throw error; // Last attempt failed
          }
          
          // Exponential backoff: 2s, 4s
          const waitTime = Math.pow(2, i + 1) * 1000;
          setGenerationProgress(`Retrying in ${waitTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    };

    try {
      await generateWithRetry(2);
    } catch (error) {
      console.error("Diet Chart Generation Failed:", error);
      
      let errorMessage = "Failed to generate diet chart. ";
      
      if (error.name === 'AbortError') {
        errorMessage += "The request timed out after 2 minutes. ";
      } else if (error.message.includes('504')) {
        errorMessage += "The server is taking too long to respond. ";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += "Cannot connect to the server. ";
      } else {
        errorMessage += error.message + " ";
      }
      
      errorMessage += "Would you like to use a basic template instead?";
      
      const useFallback = window.confirm(errorMessage);
      
      if (useFallback) {
        setGenerationProgress("Generating basic diet chart template...");
        // Small delay to show the progress message
        await new Promise(resolve => setTimeout(resolve, 500));
        generateFallbackDietChart();
      } else {
        alert("Please try again later or contact support if the issue persists.");
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const generateFallbackDietChart = () => {
    const dominantDosha = formData.dominantDosha || "VATA";
    const dietType = formData.dietType || "vegetarian";
    
    // Dosha-specific recommendations
    const doshaFoods = {
      VATA: ["Warm oatmeal", "Cooked vegetables", "Moong dal soup", "Ghee", "Sweet fruits"],
      PITTA: ["Coconut water", "Cooling salads", "Cucumber", "Melons", "Mint tea"],
      KAPHA: ["Quinoa", "Steamed veggies", "Honey", "Pulses", "Spicy lentil soup"]
    };

    const doshaFoodsForDisplay = getDoshaSpecificFoods(dominantDosha, doshaFoods);
    
    const fallbackDietChart = {
      weeklyPlan: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        dayName: getDayName(i),
        totalCalories: 1800 + (i * 50),
        waterIntake: "8-10 glasses",
        specialNotes: i === 0 ? "Start your day with warm water and lemon" : 
                      i === 6 ? "End your week with a light detox" : "",
        meals: {
          earlyMorning: {
            time: "6:00 AM",
            items: ["Warm water with lemon", "Herbal tea"],
            calories: 50,
            ayurvedicBenefit: "Activates digestion (Agni)",
            description: "Kickstart your metabolism"
          },
          breakfast: {
            time: "8:00 AM",
            items: [doshaFoodsForDisplay[0], doshaFoodsForDisplay[1] || "Fresh fruit"],
            calories: 350,
            ayurvedicBenefit: `Balances ${dominantDosha} dosha`,
            description: "Light, nourishing breakfast"
          },
          midMorning: {
            time: "11:00 AM",
            items: ["Fresh fruit", "Herbal tea"],
            calories: 150,
            ayurvedicBenefit: "Sustains energy levels",
            description: "Light snack"
          },
          lunch: {
            time: "1:00 PM",
            items: dietType === "non-vegetarian" 
              ? ["Grilled vegetables", "Quinoa", "Yogurt"]
              : ["Mixed vegetable curry", "Whole grain roti", "Salad"],
            calories: 500,
            ayurvedicBenefit: "Main meal - largest of the day",
            description: "Complete meal with all six tastes"
          },
          eveningSnack: {
            time: "4:00 PM",
            items: ["Nuts", "Herbal tea", "Seasonal fruit"],
            calories: 150,
            ayurvedicBenefit: "Prevents overeating at dinner",
            description: "Light energy boost"
          },
          dinner: {
            time: "7:00 PM",
            items: ["Vegetable soup", "Steamed vegetables", "Small portion of rice"],
            calories: 400,
            ayurvedicBenefit: "Easy to digest",
            description: "Light dinner for sound sleep"
          },
          beforeBed: {
            time: "9:30 PM",
            items: dominantDosha.includes("VATA") 
              ? ["Warm milk with nutmeg"]
              : dominantDosha.includes("PITTA")
                ? ["Cool almond milk"]
                : ["Warm turmeric milk"],
            calories: 100,
            ayurvedicBenefit: "Promotes deep sleep",
            description: "Calming bedtime beverage"
          }
        }
      })),
      doshaBalancingTips: [
        `Eat warm, cooked foods for ${dominantDosha} dosha`,
        dominantDosha.includes("VATA") ? "Avoid cold, dry foods" :
        dominantDosha.includes("PITTA") ? "Avoid spicy, oily foods" :
        "Avoid heavy, oily foods",
        "Eat meals at regular times",
        "Sit down and chew thoroughly",
        "Avoid drinking water during meals"
      ],
      lifestyleRecommendations: [
        "Wake up before sunrise (6:00 AM)",
        "Practice 10 minutes of deep breathing",
        "Take a 15-minute walk after meals",
        "Go to bed by 10:00 PM"
      ],
      ayurvedicSupplements: [
        {
          name: dominantDosha.includes("VATA") ? "Ashwagandha" :
                dominantDosha.includes("PITTA") ? "Brahmi" : "Triphala",
          benefit: `Balances ${dominantDosha} dosha`,
          timing: "Take with warm water after meals"
        }
      ],
      importantReminders: [
        "Listen to your body's hunger cues",
        "Stay hydrated throughout the day",
        "Avoid processed foods",
        "Practice mindful eating"
      ]
    };
    
    setDietChart(fallbackDietChart);
    setShowDietChart(true);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/save-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, dietChart }),
      });

      if (!response.ok) {
        throw new Error('Failed to save patient data');
      }

      const result = await response.json();
      console.log("Database Response:", result);
      alert("Success! Patient Diet Chart saved to database.");
      
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Error saving data to database. Check if Flask is running.");
    }
  };

  const nextStep = () => { if (currentStep < 5) setCurrentStep(currentStep + 1) }
  const prevStep = () => {
    if (showDietChart) setShowDietChart(false)
    else if (showResult) setShowResult(false)
    else if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const getDayName = (index) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[index];
  };

  const getDoshaSpecificFoods = (dosha, doshaFoods) => {
    const doshaUpper = dosha.toUpperCase();
    if (doshaUpper.includes('VATA') || dosha === '0') return doshaFoods.VATA;
    if (doshaUpper.includes('PITTA')) return doshaFoods.PITTA;
    if (doshaUpper.includes('KAPHA')) return doshaFoods.KAPHA;
    return doshaFoods.VATA;
  };

  // Component to render a single day's meals in correct order
  const renderDayMeals = (day) => {
    const { meals } = day;

    return (
      <div className="space-y-6">
        {MEAL_ORDER.map((mealKey) => {
          const meal = meals[mealKey];
          if (!meal) return null;

          return (
            <div key={mealKey} className="border-l-4 border-green-500 pl-6 py-4 bg-gradient-to-r from-green-50 to-transparent rounded-r-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>{mealIcons[mealKey]}</span>
                    {mealNames[mealKey]}
                  </h3>
                  <p className="text-sm text-gray-500">{meal.time}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-orange-600">
                    {meal.calories} kcal
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {meal.items.map((item, idx) => (
                    <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow-sm border border-gray-200">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{meal.description}</p>
              </div>
              
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <p className="text-xs font-semibold text-green-800">
                  🌿 Ayurvedic Benefit: <span className="font-normal">{meal.ayurvedicBenefit}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (showDietChart && dietChart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-800 mb-2">
              Your Personalized 7-Day Diet Chart
            </h1>
            <p className="text-gray-600">
              {formData.dominantDosha || "VATA"} Dosha Balancing • {formData.dietType || "Vegetarian"} Diet
            </p>
            {dietChart.generatedBy && (
              <p className="text-sm text-gray-500 mt-2">
                {dietChart.generatedBy === "fallback" ? "✨ Basic template - AI generation unavailable" : "✨ AI-Powered Recommendation"}
              </p>
            )}
          </div>

          {/* Day Selector */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-7 gap-2">
              {dietChart.weeklyPlan.map((day, index) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(index)}
                  className={`py-3 px-2 rounded-lg font-semibold transition-all ${
                    selectedDay === index
                      ? 'bg-green-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-xs">{day.dayName}</div>
                  <div className="text-lg">Day {day.day}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Day Meal Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                {dietChart.weeklyPlan[selectedDay].dayName}
              </h2>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Calories</div>
                <div className="text-2xl font-bold text-green-600">
                  {dietChart.weeklyPlan[selectedDay].totalCalories} kcal
                </div>
              </div>
            </div>

            {renderDayMeals(dietChart.weeklyPlan[selectedDay])}

            {/* Daily Notes */}
            {dietChart.weeklyPlan[selectedDay].specialNotes && (
              <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <h4 className="font-bold text-yellow-800 mb-2">📝 Special Notes for Today:</h4>
                <p className="text-yellow-900">{dietChart.weeklyPlan[selectedDay].specialNotes}</p>
              </div>
            )}

            {/* Water Intake */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <h4 className="font-bold text-blue-800 mb-1">💧 Daily Water Intake:</h4>
              <p className="text-blue-900">{dietChart.weeklyPlan[selectedDay].waterIntake}</p>
            </div>
          </div>

          {/* Weekly Summary Table */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Weekly Diet Summary</h2>
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-100">
                  <th className="border border-green-200 p-3 text-left">Day</th>
                  <th className="border border-green-200 p-3 text-left">Breakfast</th>
                  <th className="border border-green-200 p-3 text-left">Lunch</th>
                  <th className="border border-green-200 p-3 text-left">Dinner</th>
                  <th className="border border-green-200 p-3 text-left">Total Calories</th>
                  <th className="border border-green-200 p-3 text-left">Water Intake</th>
                </tr>
              </thead>
              <tbody>
                {dietChart.weeklyPlan.map((day, index) => (
                  <tr key={day.day} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-200 p-3 font-semibold">
                      {day.dayName}
                    </td>
                    <td className="border border-gray-200 p-3">
                      {day.meals.breakfast?.items.slice(0, 2).join(", ")}
                    </td>
                    <td className="border border-gray-200 p-3">
                      {day.meals.lunch?.items.slice(0, 2).join(", ")}
                    </td>
                    <td className="border border-gray-200 p-3">
                      {day.meals.dinner?.items.slice(0, 2).join(", ")}
                    </td>
                    <td className="border border-gray-200 p-3 font-semibold text-green-600">
                      {day.totalCalories} kcal
                    </td>
                    <td className="border border-gray-200 p-3">
                      {day.waterIntake}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Complete Week Table - Full Details */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Complete 7-Day Meal Plan</h2>
            
            <div className="space-y-6">
              {dietChart.weeklyPlan.map((day) => (
                <div key={day.day} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-green-800">{day.dayName} - Day {day.day}</h3>
                    <p className="text-sm text-gray-600">Total Calories: {day.totalCalories} kcal | Water: {day.waterIntake}</p>
                  </div>
                  <div className="p-4">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meal</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Calories</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {MEAL_ORDER.map((mealKey) => {
                          const meal = day.meals[mealKey];
                          if (!meal) return null;
                          return (
                            <tr key={mealKey}>
                              <td className="px-3 py-2 font-medium">{mealNames[mealKey]}</td>
                              <td className="px-3 py-2 text-gray-600">{meal.time}</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {meal.items.map((item, idx) => (
                                    <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-2 font-semibold text-orange-600">{meal.calories}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {day.specialNotes && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                        <span className="font-semibold">Note:</span> {day.specialNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dosha Balancing Tips */}
          {dietChart.doshaBalancingTips && (
            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span>🧘</span> {formData.dominantDosha || "VATA"} Dosha Balancing Tips
              </h3>
              <ul className="space-y-2">
                {dietChart.doshaBalancingTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lifestyle Recommendations */}
          {dietChart.lifestyleRecommendations && (
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                <span>🌟</span> Lifestyle Recommendations
              </h3>
              <ul className="space-y-2">
                {dietChart.lifestyleRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ayurvedic Supplements */}
          {dietChart.ayurvedicSupplements && dietChart.ayurvedicSupplements.length > 0 && (
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                <span>💊</span> Recommended Ayurvedic Supplements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dietChart.ayurvedicSupplements.map((supplement, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-bold text-purple-700 mb-1">{supplement.name}</h4>
                    <p className="text-sm text-gray-700 mb-2">{supplement.benefit}</p>
                    <p className="text-xs text-gray-600">⏰ {supplement.timing}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Reminders */}
          {dietChart.importantReminders && (
            <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <span>⚠️</span> Important Reminders
              </h3>
              <ul className="space-y-2">
                {dietChart.importantReminders.map((reminder, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-red-600 font-bold">!</span>
                    <span className="text-gray-700">{reminder}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowDietChart(false)}
              className="px-8 py-3 bg-gray-500 text-white rounded-full font-bold shadow-lg hover:bg-gray-600 transition-all"
            >
              ← Back to Form
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-700 transition-all"
            >
              Save Diet Chart 💾
            </button>
            <button
              onClick={() => window.print()}
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all"
            >
              Print Chart 🖨️
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form JSX - same as original but with generation progress indicator
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

        {/* Generation Progress Indicator */}
        {isGenerating && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span className="text-blue-800 font-medium">{generationProgress || "Generating your diet chart..."}</span>
            </div>
            <p className="text-sm text-blue-600 mt-2 ml-8">
              This may take up to 2 minutes. Please don't close the window.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1 - Personal Information */}
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

          {/* Step 2 - Health Information */}
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

          {/* Step 3 - Dosha Assessment */}
          {currentStep === 3 && (
            !showResult ? (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-green-800 mb-6 border-b pb-2">Step 3: Prakriti (Dosha) Assessment</h2>
                
                <div className="space-y-8">
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
              </div>
            ) : (
              <div className="text-center py-10 animate-fadeIn">
                <div className="inline-block p-4 rounded-full bg-green-100 text-green-600 mb-4">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Assessment Complete!</h2>
                <p className="text-xl text-green-700 mt-2 uppercase font-black">
                  Predicted Prakriti: {formData.dominantDosha === "0" ? "VATA" : formData.dominantDosha || "VATA"}
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
          )}

          {/* Step 4 - Dietary Preferences */}
          {currentStep === 4 && (
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

          {/* Step 5 - Health Goals */}
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

          {/* Navigation Buttons */}
          {!showResult && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button 
                onClick={prevStep} 
                disabled={currentStep === 1 || isGenerating} 
                className={`px-6 py-2 rounded-md font-medium ${currentStep === 1 || isGenerating ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-500 text-white hover:bg-gray-600"}`}
              >
                Previous
              </button>
              
              {currentStep === 3 ? (
                <button 
                  onClick={handlePredictDosha} 
                  disabled={isGenerating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Predict Dosha
                </button>
              ) : currentStep < 5 ? (
                <button 
                  onClick={nextStep} 
                  disabled={isGenerating}
                  className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={handleGenerateDietChart} 
                  disabled={isGenerating}
                  className={`px-6 py-2 rounded-md font-medium ${
                    isGenerating 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white`}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Diet Chart'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}