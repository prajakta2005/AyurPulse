"""
diet_chart_generator.py -
Ayurvedic Diet Chart Generator Module
Uses Google Gemini API to generate personalized 7-day meal plans
"""

import google.generativeai as genai
import json
import os
import re
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
You are an expert Ayurvedic nutritionist. Create a 7-day diet chart as PURE JSON with NO markdown formatting.

USER PROFILE:
- Name: {profile['name']}
- Dosha: {profile['dosha']}
- Diet Type: {profile['diet_type']}
- MUST AVOID: {avoid_str}
- Health Goals: {health_goals_str}
- Age: {profile['age']}, Weight: {profile['weight']}kg, Activity: {profile['activity_level']}

CRITICAL JSON RULES:
1. Items array: Use ONLY simple food names - NO parentheses, NO measurements
2. Measurements go in description field
3. NO special characters or quotes inside strings
4. Keep strings SHORT and SIMPLE

EXAMPLE (follow this EXACT format):

{{
  "weeklyPlan": [
    {{
      "day": 1,
      "dayName": "Monday",
      "meals": {{
        "earlyMorning": {{
          "time": "6:00 AM",
          "items": ["Warm lemon water"],
          "description": "Start your day with 1 glass warm water mixed with half lemon",
          "calories": 10,
          "ayurvedicBenefit": "Activates digestive fire and detoxifies body"
        }},
        "breakfast": {{
          "time": "8:00 AM",
          "items": ["Oats porridge", "Dates", "Herbal tea"],
          "description": "1 bowl oats cooked with 3-4 chopped dates and cup of ginger tea",
          "calories": 400,
          "ayurvedicBenefit": "Balances {profile['dosha']} dosha and provides sustained energy"
        }},
        "midMorning": {{
          "time": "11:00 AM",
          "items": ["Apple", "Almonds"],
          "description": "1 medium apple with 5-6 soaked almonds",
          "calories": 150,
          "ayurvedicBenefit": "Natural energy boost and healthy fats"
        }},
        "lunch": {{
          "time": "1:00 PM",
          "items": ["Dal", "Rice", "Vegetable curry", "Salad", "Buttermilk"],
          "description": "1 bowl moong dal, 1 cup rice, mixed vegetable curry, cucumber salad, 1 glass buttermilk",
          "calories": 600,
          "ayurvedicBenefit": "Main meal during peak digestive fire"
        }},
        "eveningSnack": {{
          "time": "5:00 PM",
          "items": ["Herbal tea", "Roasted chickpeas"],
          "description": "1 cup ginger-cardamom tea with handful of roasted chana",
          "calories": 200,
          "ayurvedicBenefit": "Light protein to prevent overeating at dinner"
        }},
        "dinner": {{
          "time": "7:30 PM",
          "items": ["Khichdi", "Cucumber raita"],
          "description": "1 bowl moong dal khichdi with cooling cucumber yogurt",
          "calories": 450,
          "ayurvedicBenefit": "Easy to digest for restful sleep"
        }},
        "beforeBed": {{
          "time": "9:30 PM",
          "items": ["Turmeric milk"],
          "description": "1 glass warm milk with half teaspoon turmeric and honey",
          "calories": 100,
          "ayurvedicBenefit": "Promotes deep sleep and reduces inflammation"
        }}
      }},
      "totalCalories": 1910,
      "waterIntake": "8-10 glasses throughout the day",
      "specialNotes": "Start your day with light yoga or pranayama breathing"
    }}
  ],
  "doshaBalancingTips": [
    "Eat warm and cooked foods to balance {profile['dosha']} dosha",
    "Maintain regular meal times to strengthen digestive fire",
    "Avoid ice-cold drinks especially with meals",
    "Include warming spices like ginger and cumin in cooking"
  ],
  "lifestyleRecommendations": [
    "Wake up before sunrise ideally around 6 AM",
    "Practice 10-15 minutes of pranayama breathing daily",
    "Take a 15-minute walk after lunch for digestion",
    "Go to sleep by 10 PM for optimal rest"
  ],
  "ayurvedicSupplements": [
    {{
      "name": "Triphala",
      "benefit": "Supports healthy digestion and gentle detoxification",
      "timing": "Take before bed with warm water"
    }}
  ],
  "importantReminders": [
    "Eat mindfully without phone or TV distractions",
    "Chew each bite thoroughly at least 20 times",
    "Drink water between meals not during meals",
    "Listen to your body hunger and fullness signals"
  ]
}}

STRICT REQUIREMENTS:
1. ALL meals MUST be {profile['diet_type']} - NO exceptions
2. NEVER include: {avoid_str}
3. Generate 7 DIFFERENT days - vary the meals each day
4. Put ALL measurements in description NOT in items
5. Keep item names SIMPLE without numbers or parentheses
6. Adjust calories based on goal: {profile['weight_goal']}
7. Use {profile['dosha']}-balancing ingredients and spices
8. Return ONLY the JSON object - absolutely NO markdown, NO backticks, NO ```json

Generate the complete 7-day plan now:
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
            # Configure generation settings - using only supported parameters
            generation_config = {
                'temperature': 0.7,
                'top_p': 0.95,
                'top_k': 40,
                'max_output_tokens': 8192,
            }
            
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
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
            if len(parts) >= 3:
                cleaned_text = parts[1]
                # Remove 'json' language identifier if present
                if cleaned_text.startswith('json'):
                    cleaned_text = cleaned_text[4:]
                cleaned_text = cleaned_text.strip()
        
        # Additional cleaning
        cleaned_text = cleaned_text.replace('\n\n', '\n')
        
        # Remove parentheses that might cause issues
        # This preserves the text but removes problematic formatting
        cleaned_text = re.sub(r'\(([^)]*)\)', r'\1', cleaned_text)
        
        try:
            diet_chart = json.loads(cleaned_text)
            
            # Validate structure
            self._validate_diet_chart(diet_chart)
            
            return diet_chart
            
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Error at position {e.pos}")
            
            # Show context around error
            if e.pos > 100:
                print(f"Context: ...{cleaned_text[e.pos-100:e.pos+100]}...")
            else:
                print(f"Start: {cleaned_text[:min(500, len(cleaned_text))]}")
            
            # Try additional cleaning
            try:
                # Remove control characters
                cleaned_text = re.sub(r'[\x00-\x1F\x7F]', '', cleaned_text)
                diet_chart = json.loads(cleaned_text)
                self._validate_diet_chart(diet_chart)
                return diet_chart
            except:
                # Re-raise original error
                raise e
    
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
Generate a single day meal plan for a {profile['dosha']} dosha individual.
Day number: {day_number}
Diet type: {profile['diet_type']}
Avoid: {', '.join(profile['allergies'] + profile['disliked_foods'])}
Goals: {', '.join(profile['health_goals'])}

Return JSON for just one day with the same meal structure.
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