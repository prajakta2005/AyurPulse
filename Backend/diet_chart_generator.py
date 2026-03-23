"""
diet_chart_generator.py -
Ayurvedic Diet Chart Generator Module
Uses Google Gemini API to generate personalized 7-day meal plans

Evaluation metrics (ROUGE-1/2/L + Token-F1) are printed to the console
after every generation. No metrics are surfaced in the frontend.
"""

import google.generativeai as genai
import json
import os
import re
from datetime import datetime

# ── Evaluation imports ──────────────────────────────────────────────────────
from rouge_score import rouge_scorer


# ── Reference text used as the "ground truth" for metric evaluation ─────────
# This encodes the ideal structure, vocabulary, and Ayurvedic concepts an
# accurate response should contain. It is intentionally dosha-agnostic so it
# works as a general reference regardless of the user's constitution.
_AYURVEDIC_REFERENCE = """
An ideal seven-day Ayurvedic diet chart balances the three doshas Vata Pitta
and Kapha through seasonal whole foods timing and mindful eating. Each day
includes early morning warm water with lemon or ginger to kindle digestive
fire agni. Breakfast should be light and warm such as oats porridge with
dates herbal tea or poha. Mid-morning snack is fresh seasonal fruit with
soaked nuts such as almonds or walnuts. Lunch is the main meal taken between
noon and one PM when digestive fire is strongest and includes dal rice
vegetable curry salad and buttermilk or lassi. An evening snack of herbal
tea with roasted chickpeas or a small fruit keeps blood sugar stable. Dinner
is lighter than lunch and easy to digest such as khichdi vegetable soup or
roti with sabzi eaten by seven thirty PM. Before bed golden turmeric milk
promotes deep sleep and reduces inflammation.

Foods that balance Vata dosha include warm cooked oily and grounding items
such as sesame ghee root vegetables warm soups and sweet sour salty tastes.
Foods that balance Pitta dosha are cooling sweet bitter and astringent such
as coconut coriander fennel sweet fruits and leafy greens. Foods that balance
Kapha dosha are light dry warm and stimulating such as ginger black pepper
honey legumes and bitter vegetables.

Each day should vary ingredients across the week. Recommended Ayurvedic
spices include turmeric cumin coriander ginger cardamom fennel and black
pepper. Digestive herbs include triphala ashwagandha shatavari and brahmi.
Total daily calories should be appropriate for the person age weight activity
level and weight goal. Water intake of eight to ten glasses per day is
recommended. Lifestyle tips include waking before sunrise practicing pranayama
yoga walking after lunch and sleeping by ten PM.
"""

_REFERENCE_TOKENS = set(re.findall(r'\b\w+\b', _AYURVEDIC_REFERENCE.lower()))


# ════════════════════════════════════════════════════════════════════════════
# Evaluation helpers
# ════════════════════════════════════════════════════════════════════════════

def _diet_chart_to_text(diet_chart: dict) -> str:
    """
    Flatten a diet-chart dict into a single plain-text string so we can run
    text-similarity metrics against the reference corpus.
    """
    parts: list[str] = []

    def _walk(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                _walk(v)
        elif isinstance(obj, list):
            for item in obj:
                _walk(item)
        elif isinstance(obj, str):
            parts.append(obj)
        elif obj is not None:
            parts.append(str(obj))

    _walk(diet_chart)
    return " ".join(parts)


def _token_f1(hypothesis: str, reference: str) -> dict[str, float]:
    """
    Compute token-level Precision, Recall and F1 between hypothesis and
    reference after lowercasing and simple whitespace tokenization.

    This mirrors the SQuAD / BERTScore intuition (unigram bag-of-words overlap)
    and serves as a lightweight substitute when bert-score cannot be installed.
    Each metric is returned in [0, 1].
    """
    hyp_tokens = re.findall(r'\b\w+\b', hypothesis.lower())
    ref_tokens  = re.findall(r'\b\w+\b', reference.lower())

    if not hyp_tokens or not ref_tokens:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}

    hyp_set = {}
    for t in hyp_tokens:
        hyp_set[t] = hyp_set.get(t, 0) + 1

    ref_set = {}
    for t in ref_tokens:
        ref_set[t] = ref_set.get(t, 0) + 1

    overlap = sum(min(hyp_set.get(t, 0), ref_set[t]) for t in ref_set)

    precision = overlap / len(hyp_tokens)
    recall    = overlap / len(ref_tokens)
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0.0)

    return {"precision": round(precision, 4),
            "recall":    round(recall,    4),
            "f1":        round(f1,        4)}


def _compute_and_print_metrics(diet_chart: dict, user_name: str, dosha: str) -> None:
    """
    Compute ROUGE-1, ROUGE-2, ROUGE-L and Token-F1 (BERTScore substitute)
    for the generated diet chart and print a formatted report to stdout.

    Nothing is returned – this is console-only output.
    """
    hypothesis = _diet_chart_to_text(diet_chart)

    # ── ROUGE ────────────────────────────────────────────────────────────────
    scorer = rouge_scorer.RougeScorer(
        ['rouge1', 'rouge2', 'rougeL'],
        use_stemmer=True           # Porter stemmer for better matching
    )
    rouge_scores = scorer.score(_AYURVEDIC_REFERENCE, hypothesis)

    # ── Token-F1 (lightweight BERTScore substitute) ──────────────────────────
    tok_f1 = _token_f1(hypothesis, _AYURVEDIC_REFERENCE)

    # ── Coverage: % of key Ayurvedic terms found in response ─────────────────
    hyp_tokens_set = set(re.findall(r'\b\w+\b', hypothesis.lower()))
    coverage = round(
        len(_REFERENCE_TOKENS & hyp_tokens_set) / len(_REFERENCE_TOKENS), 4
    )

    # ── Console report ────────────────────────────────────────────────────────
    separator = "═" * 62
    print(f"\n{separator}")
    print(f"  📊  DIET CHART EVALUATION METRICS")
    print(f"  User : {user_name}   |   Dosha : {dosha}")
    print(f"  Generated at : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(separator)

    print("\n  ROUGE Scores  (Precision / Recall / F1)")
    print(f"  {'Metric':<12}  {'Precision':>10}  {'Recall':>10}  {'F1':>10}")
    print(f"  {'-'*12}  {'-'*10}  {'-'*10}  {'-'*10}")
    for metric_name, score in [
        ("ROUGE-1",  rouge_scores['rouge1']),
        ("ROUGE-2",  rouge_scores['rouge2']),
        ("ROUGE-L",  rouge_scores['rougeL']),
    ]:
        print(f"  {metric_name:<12}  "
              f"{score.precision:>10.4f}  "
              f"{score.recall:>10.4f}  "
              f"{score.fmeasure:>10.4f}")

    print(f"\n  Token-F1  (BERTScore-style unigram overlap)")
    print(f"  {'Metric':<12}  {'Score':>10}")
    print(f"  {'-'*12}  {'-'*10}")
    print(f"  {'Precision':<12}  {tok_f1['precision']:>10.4f}")
    print(f"  {'Recall':<12}  {tok_f1['recall']:>10.4f}")
    print(f"  {'F1':<12}  {tok_f1['f1']:>10.4f}")

    print(f"\n  Ayurvedic Term Coverage  :  {coverage:.4f}  "
          f"({coverage*100:.1f}% of reference vocabulary)")

    # Interpretation hints
    print(f"\n  Interpretation:")
    f1_r1 = rouge_scores['rouge1'].fmeasure
    if f1_r1 >= 0.5:
        quality = "✅  Strong vocabulary alignment with Ayurvedic reference"
    elif f1_r1 >= 0.3:
        quality = "🟡  Moderate alignment – response covers key concepts"
    else:
        quality = "⚠️   Low alignment – review for missing Ayurvedic content"
    print(f"  ROUGE-1 F1 = {f1_r1:.4f}  →  {quality}")

    if coverage >= 0.6:
        cov_note = "✅  Rich Ayurvedic terminology present"
    elif coverage >= 0.4:
        cov_note = "🟡  Adequate term coverage"
    else:
        cov_note = "⚠️   Limited Ayurvedic vocabulary – may lack specificity"
    print(f"  Coverage   = {coverage:.4f}  →  {cov_note}")

    print(f"\n{separator}\n")


# ════════════════════════════════════════════════════════════════════════════
# Main generator class
# ════════════════════════════════════════════════════════════════════════════

class DietChartGenerator:
    """
    Generates personalized Ayurvedic diet charts using AI.
    After every generation, ROUGE + Token-F1 metrics are printed to the
    console. No metric data is added to the returned dict.
    """

    def __init__(self, api_key=None):
        """
        Initialize the diet chart generator with Gemini API.

        Args:
            api_key (str): Google Gemini API key. If None, reads from environment.
        """
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY')
        if not self.api_key or self.api_key == 'YOUR_API_KEY_HERE':
            raise ValueError(
                "Gemini API key not configured. Set GEMINI_API_KEY environment variable."
            )

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    # ── Public API ────────────────────────────────────────────────────────────

    def generate_diet_chart(self, user_data: dict) -> dict:
        """
        Generate a comprehensive 7-day diet chart based on user profile.

        Metrics are printed to stdout; the returned dict is unchanged from the
        original – no metric keys are injected into it.

        Args:
            user_data (dict): User's personal info, health data, dietary
                              preferences, and goals.

        Returns:
            dict: Complete diet chart with weekly plan and recommendations.
        """
        profile      = self._extract_user_profile(user_data)
        prompt       = self._build_prompt(profile)
        response     = self._call_gemini_api(prompt)
        diet_chart   = self._parse_response(response)

        # ── Metadata (original behaviour) ────────────────────────────────────
        diet_chart['metadata'] = {
            'generatedAt': datetime.now().isoformat(),
            'userName':    profile['name'],
            'dosha':       profile['dosha'],
            'dietType':    profile['diet_type'],
        }

        # ── Console evaluation – does NOT modify the returned dict ────────────
        _compute_and_print_metrics(diet_chart, profile['name'], profile['dosha'])

        return diet_chart

    # ── Private helpers ───────────────────────────────────────────────────────

    def _extract_user_profile(self, data: dict) -> dict:
        """Extract and organise user data into a structured profile."""
        return {
            'name':              data.get('name', 'User'),
            'age':               data.get('age', ''),
            'gender':            data.get('gender', ''),
            'weight':            data.get('weight', ''),
            'height':            data.get('height', ''),
            'activity_level':    data.get('activityLevel', ''),
            'health_conditions': data.get('healthConditions', []),
            'allergies':         data.get('allergies', []),
            'medications':       data.get('medications', ''),
            'dosha':             data.get('dominantDosha', 'Vata'),
            'diet_type':         data.get('dietType', 'vegetarian'),
            'food_preferences':  data.get('foodPreferences', []),
            'disliked_foods':    data.get('dislikedFoods', []),
            'meal_timing':       data.get('mealTiming', ''),
            'cooking_time':      data.get('cookingTime', ''),
            'budget':            data.get('budget', ''),
            'health_goals':      data.get('healthGoals', []),
            'weight_goal':       data.get('weightGoal', ''),
            'timeframe':         data.get('timeframe', ''),
        }

    def _build_prompt(self, profile: dict) -> str:
        """Build the detailed prompt for Gemini API."""
        health_conditions_str = (', '.join(profile['health_conditions'])
                                 if profile['health_conditions'] else 'None')
        allergies_str         = (', '.join(profile['allergies'])
                                 if profile['allergies'] else 'None')
        food_preferences_str  = (', '.join(profile['food_preferences'])
                                 if profile['food_preferences'] else 'Flexible')
        disliked_foods_str    = (', '.join(profile['disliked_foods'])
                                 if profile['disliked_foods'] else 'None')
        health_goals_str      = (', '.join(profile['health_goals'])
                                 if profile['health_goals'] else 'General wellness')

        avoid_list = profile['allergies'] + profile['disliked_foods']
        avoid_str  = ', '.join(avoid_list) if avoid_list else 'None'

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

    def _call_gemini_api(self, prompt: str) -> str:
        """
        Call Gemini API with the constructed prompt.

        Args:
            prompt (str): The complete prompt for the API.

        Returns:
            str: Raw response text from the API.
        """
        try:
            generation_config = {
                'temperature':      0.7,
                'top_p':            0.95,
                'top_k':            40,
                'max_output_tokens': 8192,
            }
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API call failed: {str(e)}")

    def _parse_response(self, response_text: str) -> dict:
        """
        Parse and clean the API response.

        Args:
            response_text (str): Raw response from Gemini.

        Returns:
            dict: Parsed JSON diet chart.

        Raises:
            json.JSONDecodeError: If response cannot be parsed as JSON.
        """
        cleaned_text = response_text.strip()

        if cleaned_text.startswith('```'):
            parts = cleaned_text.split('```')
            if len(parts) >= 3:
                cleaned_text = parts[1]
                if cleaned_text.startswith('json'):
                    cleaned_text = cleaned_text[4:]
                cleaned_text = cleaned_text.strip()

        cleaned_text = cleaned_text.replace('\n\n', '\n')
        cleaned_text = re.sub(r'\(([^)]*)\)', r'\1', cleaned_text)

        try:
            diet_chart = json.loads(cleaned_text)
            self._validate_diet_chart(diet_chart)
            return diet_chart
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Error at position {e.pos}")
            if e.pos > 100:
                print(f"Context: ...{cleaned_text[e.pos-100:e.pos+100]}...")
            else:
                print(f"Start: {cleaned_text[:min(500, len(cleaned_text))]}")

            try:
                cleaned_text = re.sub(r'[\x00-\x1F\x7F]', '', cleaned_text)
                diet_chart = json.loads(cleaned_text)
                self._validate_diet_chart(diet_chart)
                return diet_chart
            except Exception:
                raise e

    def _validate_diet_chart(self, diet_chart: dict) -> None:
        """
        Validate the structure of the generated diet chart.

        Args:
            diet_chart (dict): The parsed diet chart.

        Raises:
            ValueError: If required fields are missing.
        """
        for key in ['weeklyPlan']:
            if key not in diet_chart:
                raise ValueError(f"Missing required key in diet chart: {key}")

        if not isinstance(diet_chart['weeklyPlan'], list):
            raise ValueError("weeklyPlan must be a list")

        if len(diet_chart['weeklyPlan']) != 7:
            print(f"Warning: Expected 7 days, got {len(diet_chart['weeklyPlan'])}")

        if diet_chart['weeklyPlan']:
            first_day = diet_chart['weeklyPlan'][0]
            for key in ['day', 'dayName', 'meals', 'totalCalories']:
                if key not in first_day:
                    raise ValueError(f"Missing required key in day structure: {key}")

    def regenerate_single_day(self, user_data: dict, day_number: int) -> dict:
        """
        Regenerate a single day's meal plan.

        Args:
            user_data (dict): User profile data.
            day_number (int): Day number to regenerate (1-7).

        Returns:
            dict: Single day meal plan.
        """
        profile = self._extract_user_profile(user_data)

        prompt = f"""
Generate a single day indian meal plan for a {profile['dosha']} dosha individual.
Day number: {day_number}
Diet type: {profile['diet_type']}
Avoid: {', '.join(profile['allergies'] + profile['disliked_foods'])}
Goals: {', '.join(profile['health_goals'])}

Return JSON for just one day with the same meal structure.
"""
        response  = self._call_gemini_api(prompt)
        day_plan  = self._parse_response(response)

        # Metrics for single-day regeneration
        _compute_and_print_metrics(
            day_plan,
            profile['name'],
            f"{profile['dosha']} (day {day_number} regen)"
        )

        return day_plan


# ════════════════════════════════════════════════════════════════════════════
# Convenience function
# ════════════════════════════════════════════════════════════════════════════

def generate_diet_chart(user_data: dict, api_key: str = None) -> dict:
    """
    Convenience function to generate a diet chart.

    Args:
        user_data (dict): User profile data.
        api_key (str, optional): Gemini API key.

    Returns:
        dict: Complete diet chart.
    """
    generator = DietChartGenerator(api_key=api_key)
    return generator.generate_diet_chart(user_data)