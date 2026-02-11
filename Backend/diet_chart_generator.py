"""
Ayurvedic Diet Chart Generator Module
Uses Google Gemini API to generate personalized 7-day meal plans
"""

import google.generativeai as genai
import json
import os
from datetime import datetime


class DietChartGenerator:
    """
    Generates personalized Ayurvedic diet charts using AI
    """
    
    def __init__(self, api_key=None):
        """
        Initialize the diet chart generator with Gemini API
        
        Args:
            api_key (str): Google Gemini API key. If None, reads from environment.
        """
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY')
        if not self.api_key or self.api_key == 'YOUR_API_KEY_HERE':
            raise ValueError("Gemini API key not configured. Set GEMINI_API_KEY environment variable.")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_diet_chart(self, user_data):
        """
        Generate a comprehensive 7-day diet chart based on user profile
        
        Args:
            user_data (dict): Dictionary containing user's personal info, health data,
                            dietary preferences, and goals
        
        Returns:
            dict: Complete diet chart with weekly plan and recommendations
        
        Raises:
            ValueError: If required user data is missing
            json.JSONDecodeError: If API response cannot be parsed
            Exception: For other API or generation errors
        """
        # Extract and validate user data
        profile = self._extract_user_profile(user_data)
        
        # Build the prompt
        prompt = self._build_prompt(profile)
        
        # Call Gemini API
        response = self._call_gemini_api(prompt)
        
        # Parse and validate response
        diet_chart = self._parse_response(response)
        
        # Add metadata
        diet_chart['metadata'] = {
            'generatedAt': datetime.now().isoformat(),
            'userName': profile['name'],
            'dosha': profile['dosha'],
            'dietType': profile['diet_type']
        }
        
        return diet_chart
    
    def _extract_user_profile(self, data):
        """Extract and organize user data into a structured profile"""
        return {
            # Personal Information
            'name': data.get('name', 'User'),
            'age': data.get('age', ''),
            'gender': data.get('gender', ''),
            'weight': data.get('weight', ''),
            'height': data.get('height', ''),
            'activity_level': data.get('activityLevel', ''),
            
            # Health Information
            'health_conditions': data.get('healthConditions', []),
            'allergies': data.get('allergies', []),
            'medications': data.get('medications', ''),
            
            # Dosha Information
            'dosha': data.get('dominantDosha', 'Vata'),
            
            # Dietary Preferences
            'diet_type': data.get('dietType', 'vegetarian'),
            'food_preferences': data.get('foodPreferences', []),
            'disliked_foods': data.get('dislikedFoods', []),
            'meal_timing': data.get('mealTiming', ''),
            'cooking_time': data.get('cookingTime', ''),
            'budget': data.get('budget', ''),
            
            # Health Goals
            'health_goals': data.get('healthGoals', []),
            'weight_goal': data.get('weightGoal', ''),
            'timeframe': data.get('timeframe', '')
        }
    
    def _build_prompt(self, profile):
        """Build the detailed prompt for Gemini API"""
        
        # Format lists for display
        health_conditions_str = ', '.join(profile['health_conditions']) if profile['health_conditions'] else 'None'
        allergies_str = ', '.join(profile['allergies']) if profile['allergies'] else 'None'
        food_preferences_str = ', '.join(profile['food_preferences']) if profile['food_preferences'] else 'Flexible'
        disliked_foods_str = ', '.join(profile['disliked_foods']) if profile['disliked_foods'] else 'None'
        health_goals_str = ', '.join(profile['health_goals']) if profile['health_goals'] else 'General wellness'
        
        # Combine allergies and dislikes for strict avoidance
        avoid_list = profile['allergies'] + profile['disliked_foods']
        avoid_str = ', '.join(avoid_list) if avoid_list else 'None'
        
        prompt = f"""
You are an expert Ayurvedic nutritionist and dietitian with deep knowledge of traditional Indian medicine and modern nutrition science. Create a comprehensive, personalized 7-day diet chart based on the following client profile:

**PERSONAL INFORMATION:**
- Name: {profile['name']}
- Age: {profile['age']} years
- Gender: {profile['gender']}
- Current Weight: {profile['weight']} kg
- Height: {profile['height']} cm
- Activity Level: {profile['activity_level']}

**HEALTH PROFILE:**
- Health Conditions: {health_conditions_str}
- Food Allergies: {allergies_str}
- Current Medications: {profile['medications'] if profile['medications'] else 'None'}

**AYURVEDIC CONSTITUTION:**
- Dominant Dosha: {profile['dosha']}

**DIETARY PREFERENCES:**
- Diet Type: {profile['diet_type']}
- Food Preferences: {food_preferences_str}
- Foods to Avoid: {disliked_foods_str}
- Meal Timing Preference: {profile['meal_timing']}
- Available Cooking Time: {profile['cooking_time']}
- Budget Range: {profile['budget']}

**HEALTH & WELLNESS GOALS:**
- Primary Goals: {health_goals_str}
- Weight Goal: {profile['weight_goal']}
- Timeframe: {profile['timeframe']}

**INSTRUCTIONS:**
Create a detailed 7-day meal plan with the following structure. Return ONLY valid JSON without any markdown formatting, code blocks, or additional text:

{{
  "weeklyPlan": [
    {{
      "day": 1,
      "dayName": "Monday",
      "meals": {{
        "earlyMorning": {{
          "time": "6:00 AM",
          "items": ["Warm water with lemon", "Soaked almonds (4-5)"],
          "description": "Start your day with hydration and light protein",
          "calories": 150,
          "ayurvedicBenefit": "Cleanses digestive system and balances {profile['dosha']}"
        }},
        "breakfast": {{
          "time": "8:00 AM",
          "items": ["Oats porridge with dates", "Herbal tea"],
          "description": "Warm, nourishing breakfast with natural sweetness",
          "calories": 400,
          "ayurvedicBenefit": "Grounding and provides sustained energy"
        }},
        "midMorning": {{
          "time": "11:00 AM",
          "items": ["Fresh seasonal fruit"],
          "description": "Light fruit snack for energy",
          "calories": 150,
          "ayurvedicBenefit": "Natural sugars for midday energy"
        }},
        "lunch": {{
          "time": "1:00 PM",
          "items": ["Dal (lentils)", "Rice", "Mixed vegetable curry", "Salad", "Buttermilk"],
          "description": "Complete balanced meal with protein, carbs, and vegetables",
          "calories": 600,
          "ayurvedicBenefit": "Main meal for optimal digestion during peak Agni"
        }},
        "eveningSnack": {{
          "time": "5:00 PM",
          "items": ["Herbal tea", "Roasted chickpeas"],
          "description": "Light protein-rich snack",
          "calories": 200,
          "ayurvedicBenefit": "Prevents evening hunger and stabilizes energy"
        }},
        "dinner": {{
          "time": "7:30 PM",
          "items": ["Khichdi", "Cucumber raita"],
          "description": "Light, easily digestible meal",
          "calories": 500,
          "ayurvedicBenefit": "Easy to digest, promotes restful sleep"
        }},
        "beforeBed": {{
          "time": "9:30 PM",
          "items": ["Warm turmeric milk (haldi doodh)"],
          "description": "Traditional Ayurvedic night drink",
          "calories": 100,
          "ayurvedicBenefit": "Promotes deep sleep and reduces inflammation"
        }}
      }},
      "totalCalories": 2100,
      "waterIntake": "2.5-3 liters throughout the day",
      "specialNotes": "Start with gentle yoga or pranayama in the morning"
    }}
  ],
  "doshaBalancingTips": [
    "Specific tip for {profile['dosha']} dosha 1",
    "Specific tip for {profile['dosha']} dosha 2",
    "Specific tip for {profile['dosha']} dosha 3",
    "Specific tip for {profile['dosha']} dosha 4"
  ],
  "lifestyleRecommendations": [
    "Wake up before sunrise for better alignment with natural rhythms",
    "Practice oil pulling (gandush) each morning",
    "Regular meal times to strengthen digestive fire (Agni)"
  ],
  "ayurvedicSupplements": [
    {{
      "name": "Triphala",
      "benefit": "Gentle detoxification and digestive support",
      "timing": "Before bed with warm water"
    }},
    {{
      "name": "Ashwagandha",
      "benefit": "Stress reduction and vitality",
      "timing": "Morning with milk or water"
    }}
  ],
  "importantReminders": [
    "Eat mindfully without distractions",
    "Chew food thoroughly for better digestion",
    "Avoid cold drinks with meals"
  ]
}}

**CRITICAL REQUIREMENTS:**
1. All meals MUST be {profile['diet_type']} compatible - no exceptions
2. STRICTLY AVOID these ingredients: {avoid_str}
3. Focus on {profile['dosha']}-balancing foods, spices, and cooking methods
4. Include authentic Indian cuisine options appropriate for {profile['budget']} budget
5. All meals must be practical to prepare within {profile['cooking_time']} time
6. Address health conditions: {health_conditions_str}
7. Support primary goals: {health_goals_str}
8. Ensure variety across all 7 days - no repetitive meals
9. Include specific portion sizes (e.g., "1 cup rice", "2 chapatis")
10. Use realistic calorie counts based on actual portion sizes
11. Adjust total daily calories based on {profile['weight_goal']} goal
12. Return ONLY the JSON object - no markdown, no backticks, no explanations

Generate the complete 7-day personalized plan now as pure JSON.
"""
        return prompt
    
    def _call_gemini_api(self, prompt):
        """
        Call Gemini API with the constructed prompt
        
        Args:
            prompt (str): The complete prompt for the API
        
        Returns:
            str: Raw response text from the API
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API call failed: {str(e)}")
    
    def _parse_response(self, response_text):
        """
        Parse and clean the API response
        
        Args:
            response_text (str): Raw response from Gemini
        
        Returns:
            dict: Parsed JSON diet chart
        
        Raises:
            json.JSONDecodeError: If response cannot be parsed as JSON
        """
        # Clean the response
        cleaned_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if cleaned_text.startswith('```'):
            # Split by ``` and take the middle part
            parts = cleaned_text.split('```')
            if len(parts) >= 2:
                cleaned_text = parts[1]
                # Remove 'json' language identifier if present
                if cleaned_text.startswith('json'):
                    cleaned_text = cleaned_text[4:]
                cleaned_text = cleaned_text.strip()
        
        # Additional cleaning for common issues
        cleaned_text = cleaned_text.replace('\n\n', '\n')  # Remove double newlines
        
        try:
            diet_chart = json.loads(cleaned_text)
            
            # Validate structure
            self._validate_diet_chart(diet_chart)
            
            return diet_chart
        except json.JSONDecodeError as e:
            # Log the error for debugging
            print(f"JSON Parse Error: {e}")
            print(f"First 500 chars of response: {cleaned_text[:500]}")
            print(f"Last 500 chars of response: {cleaned_text[-500:]}")
            raise
    
    def _validate_diet_chart(self, diet_chart):
        """
        Validate the structure of the generated diet chart
        
        Args:
            diet_chart (dict): The parsed diet chart
        
        Raises:
            ValueError: If required fields are missing
        """
        # Check for required top-level keys
        required_keys = ['weeklyPlan']
        for key in required_keys:
            if key not in diet_chart:
                raise ValueError(f"Missing required key in diet chart: {key}")
        
        # Check weekly plan structure
        if not isinstance(diet_chart['weeklyPlan'], list):
            raise ValueError("weeklyPlan must be a list")
        
        if len(diet_chart['weeklyPlan']) != 7:
            print(f"Warning: Expected 7 days, got {len(diet_chart['weeklyPlan'])}")
        
        # Validate first day structure as sample
        if diet_chart['weeklyPlan']:
            first_day = diet_chart['weeklyPlan'][0]
            required_day_keys = ['day', 'dayName', 'meals', 'totalCalories']
            for key in required_day_keys:
                if key not in first_day:
                    raise ValueError(f"Missing required key in day structure: {key}")
    
    def regenerate_single_day(self, user_data, day_number):
        """
        Regenerate a single day's meal plan
        
        Args:
            user_data (dict): User profile data
            day_number (int): Day number to regenerate (1-7)
        
        Returns:
            dict: Single day meal plan
        """
        profile = self._extract_user_profile(user_data)
        
        # Build a simplified prompt for single day
        prompt = f"""
Generate a single day ({day_number}) meal plan for a {profile['dosha']} dosha individual.
Follow the same structure as a full week plan but only for one day.
Diet type: {profile['diet_type']}
Avoid: {', '.join(profile['allergies'] + profile['disliked_foods'])}
Goals: {', '.join(profile['health_goals'])}

Return JSON for just one day following the same meal structure (earlyMorning, breakfast, midMorning, lunch, eveningSnack, dinner, beforeBed).
"""
        
        response = self._call_gemini_api(prompt)
        day_plan = self._parse_response(response)
        
        return day_plan


def generate_diet_chart(user_data, api_key=None):
    """
    Convenience function to generate a diet chart
    
    Args:
        user_data (dict): User profile data
        api_key (str, optional): Gemini API key
    
    Returns:
        dict: Complete diet chart
    """
    generator = DietChartGenerator(api_key=api_key)
    return generator.generate_diet_chart(user_data)


# Example usage and testing
if __name__ == "__main__":
    # Example test data
    test_data = {
        'name': 'Priya Sharma',
        'age': '28',
        'gender': 'female',
        'height': '165',
        'weight': '58',
        'activityLevel': 'moderate',
        'healthConditions': ['None'],
        'allergies': ['Nuts'],
        'medications': '',
        'dominantDosha': 'Vata',
        'dietType': 'vegetarian',
        'foodPreferences': ['Spicy Food', 'Cooked Foods'],
        'dislikedFoods': ['Mushrooms'],
        'mealTiming': 'regular',
        'cookingTime': 'moderate',
        'budget': 'medium',
        'healthGoals': ['Better Digestion', 'Increased Energy'],
        'weightGoal': 'maintain',
        'timeframe': '3-months'
    }
    
    try:
        generator = DietChartGenerator()
        result = generator.generate_diet_chart(test_data)
        print("✅ Diet chart generated successfully!")
        print(f"Generated {len(result['weeklyPlan'])} days of meals")
    except Exception as e:
        print(f"❌ Error: {e}")