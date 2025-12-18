import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

const HOSPITAL_CONTEXT = `You are a helpful AI assistant for Gravity Hospital in Nigdi, Pimpri-Chinchwad, Maharashtra, India.

Hospital Information:
- Name: Gravity Hospital
- Location: Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062
- Contact: +91 20 1234 5678
- Emergency: +91 20 9876 5432
- Operating Hours: 24/7 for emergencies, OPD: 9 AM - 9 PM

Departments:
- Cardiology - Dr. Priya Sharma (15 years experience)
- Orthopedics - Dr. Rajesh Kumar (12 years experience)
- General Medicine - Dr. Amit Singh (10 years experience)
- Pediatrics - Dr. Kavita Joshi (8 years experience)
- Dermatology - Dr. Neha Verma (8 years experience)
- Neurology - Dr. Arjun Patel (10 years experience)

Insurance Accepted:
- Star Health Insurance
- HDFC Ergo Health Insurance
- ICICI Lombard Health Insurance
- Bajaj Allianz Health Insurance
- Max Bupa Health Insurance
- Government schemes: PMJAY (Ayushman Bharat), MJPJAY

Common Services:
- OPD Consultations
- Emergency Care (24/7)
- Diagnostic Services (X-Ray, CT, MRI, Lab Tests)
- Pharmacy
- Ambulance Service
- Health Checkups

Please provide helpful, accurate, and professional responses. For medical emergencies, always advise patients to call emergency services or visit the hospital immediately.`;

export async function getChatbotResponse(query: string): Promise<{ response: string; category: string }> {
  const lowerQuery = query.toLowerCase();
  
  let category = "general";
  if (lowerQuery.includes("insurance") || lowerQuery.includes("policy") || lowerQuery.includes("coverage")) {
    category = "insurance";
  } else if (lowerQuery.includes("doctor") || lowerQuery.includes("appointment") || lowerQuery.includes("available") || lowerQuery.includes("schedule")) {
    category = "doctor_availability";
  } else if (lowerQuery.includes("department") || lowerQuery.includes("specialty") || lowerQuery.includes("service")) {
    category = "services";
  } else if (lowerQuery.includes("emergency") || lowerQuery.includes("urgent")) {
    category = "emergency";
  } else if (lowerQuery.includes("location") || lowerQuery.includes("address") || lowerQuery.includes("contact") || lowerQuery.includes("phone")) {
    category = "contact";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: HOSPITAL_CONTEXT
        },
        {
          role: "user",
          content: query
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0]?.message?.content || "I apologize, but I couldn't process your request. Please try again or contact our staff directly.";
    
    return {
      response: assistantMessage,
      category
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    return getFallbackResponse(query, category);
  }
}

function getFallbackResponse(query: string, category: string): { response: string; category: string } {
  const lowerQuery = query.toLowerCase();
  
  if (category === "emergency") {
    return {
      response: "For medical emergencies, please call our Emergency Helpline immediately: +91 20 9876 5432. Our emergency department is open 24/7. If this is a life-threatening situation, please call 108 for ambulance services.",
      category
    };
  }
  
  if (category === "insurance") {
    return {
      response: "Gravity Hospital accepts the following insurance providers:\n\n• Star Health Insurance\n• HDFC Ergo Health Insurance\n• ICICI Lombard Health Insurance\n• Bajaj Allianz Health Insurance\n• Max Bupa Health Insurance\n\nWe also accept government schemes like PMJAY (Ayushman Bharat) and MJPJAY. Please bring your insurance card and valid ID for verification. For specific coverage queries, please contact our billing department at +91 20 1234 5678.",
      category
    };
  }
  
  if (category === "doctor_availability") {
    return {
      response: "Our doctors are available Monday through Saturday during OPD hours (9 AM - 9 PM). Here are our specialists:\n\n• Cardiology - Dr. Priya Sharma\n• Orthopedics - Dr. Rajesh Kumar\n• General Medicine - Dr. Amit Singh\n• Pediatrics - Dr. Kavita Joshi\n• Dermatology - Dr. Neha Verma\n• Neurology - Dr. Arjun Patel\n\nTo book an appointment, please call +91 20 1234 5678 or visit our OPD desk.",
      category
    };
  }
  
  if (category === "contact") {
    return {
      response: "Gravity Hospital\n\nAddress: Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062\n\nContact Numbers:\n• General Enquiry: +91 20 1234 5678\n• Emergency: +91 20 9876 5432\n• Appointments: +91 20 1234 5679\n\nOPD Hours: 9 AM - 9 PM (Monday - Saturday)\nEmergency: 24/7",
      category
    };
  }
  
  if (category === "services") {
    return {
      response: "Gravity Hospital offers comprehensive healthcare services:\n\n• Outpatient Department (OPD)\n• Emergency Care (24/7)\n• Inpatient Services\n• Diagnostic Services (X-Ray, CT Scan, MRI, Laboratory)\n• Pharmacy\n• Ambulance Service\n• Health Checkup Packages\n\nDepartments: Cardiology, Orthopedics, General Medicine, Pediatrics, Dermatology, Neurology\n\nFor more information, please contact us at +91 20 1234 5678.",
      category
    };
  }
  
  return {
    response: "Welcome to Gravity Hospital! I'm here to help you with information about our hospital services, doctor availability, appointments, and general queries. How can I assist you today?\n\nFor emergencies, please call: +91 20 9876 5432",
    category: "general"
  };
}

export function getChatbotStats(logs: Array<{ category: string | null }>): {
  totalQueries: number;
  byCategory: Record<string, number>;
} {
  const stats = {
    totalQueries: logs.length,
    byCategory: {} as Record<string, number>
  };

  logs.forEach(log => {
    const cat = log.category || "general";
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  });

  return stats;
}

// ========== AI HEALTH TIPS GENERATOR ==========

interface HealthTipData {
  title: string;
  content: string;
  category: string;
  weatherContext: string;
  season: string;
  priority: string;
  targetAudience: string;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 9) return "monsoon"; // India-specific
  if (month >= 10 && month <= 11) return "autumn";
  return "winter";
}

function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export async function generateHealthTip(scheduledFor: "9AM" | "9PM"): Promise<HealthTipData> {
  const season = getCurrentSeason();
  const timeOfDay = scheduledFor === "9AM" ? "morning" : "evening";
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const HEALTH_TIP_PROMPT = `You are a healthcare expert at Gravity Hospital in Pune, Maharashtra, India. Generate a daily health tip for ${currentDate} (${timeOfDay} edition).

Context:
- Location: Pune, Maharashtra, India
- Current Season: ${season}
- Time: ${scheduledFor} IST
- Hospital: Gravity Hospital, Nigdi, Pimpri-Chinchwad

Generate a health tip considering:
1. Current weather/climate conditions in Pune (${season} season)
2. Seasonal health concerns (e.g., monsoon diseases, winter cold, summer heat)
3. Current trending health topics in India
4. Appropriate diet and nutrition advice for the season
5. ${timeOfDay === "morning" ? "Morning routine and energy-boosting tips" : "Evening relaxation and sleep hygiene tips"}

Respond with a JSON object (no markdown code blocks, just pure JSON):
{
  "title": "Brief catchy title (max 60 chars)",
  "content": "Detailed health tip with actionable advice (150-200 words). Include specific food recommendations, activities, and precautions relevant to the current season and time of day.",
  "category": "one of: weather, climate, diet, trending, seasonal",
  "weatherContext": "Brief description of current weather conditions considered",
  "priority": "one of: low, medium, high",
  "targetAudience": "one of: all, patients, elderly, children"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a healthcare expert generating daily health tips. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: HEALTH_TIP_PROMPT
        }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || "Daily Health Tip",
        content: parsed.content || "Stay healthy and hydrated!",
        category: parsed.category || "seasonal",
        weatherContext: parsed.weatherContext || `${season} season in Pune`,
        season: season,
        priority: parsed.priority || "medium",
        targetAudience: parsed.targetAudience || "all"
      };
    }

    throw new Error("Failed to parse health tip response");
  } catch (error) {
    console.error("Error generating health tip:", error);
    
    // Fallback health tips based on season
    return getFallbackHealthTip(season, scheduledFor);
  }
}

function getFallbackHealthTip(season: string, scheduledFor: "9AM" | "9PM"): HealthTipData {
  const fallbackTips: Record<string, HealthTipData> = {
    "monsoon_9AM": {
      title: "Monsoon Morning Wellness Tips",
      content: "During monsoon season, start your day with warm lemon water to boost immunity. Avoid street food and raw vegetables to prevent waterborne diseases. Wear waterproof footwear to prevent fungal infections. Include ginger, turmeric, and tulsi in your diet for natural immunity. Stay hydrated despite cooler weather. If you experience fever, cold, or digestive issues for more than 2 days, consult a doctor at Gravity Hospital.",
      category: "seasonal",
      weatherContext: "Monsoon season with high humidity and rainfall in Pune",
      season: "monsoon",
      priority: "high",
      targetAudience: "all"
    },
    "monsoon_9PM": {
      title: "Evening Monsoon Health Care",
      content: "As the evening arrives during monsoon, ensure proper ventilation in your home to prevent mold and dampness. Dry your feet thoroughly and use antifungal powder if needed. Have a light dinner with warm, easily digestible foods like khichdi or dal soup. Avoid cold beverages and opt for warm herbal teas. Ensure mosquito protection before sleeping to prevent dengue and malaria. Keep emergency contacts of Gravity Hospital handy.",
      category: "seasonal",
      weatherContext: "Evening monsoon conditions in Pune",
      season: "monsoon",
      priority: "high",
      targetAudience: "all"
    },
    "winter_9AM": {
      title: "Winter Morning Wellness Guide",
      content: "Start your winter morning with warm water and a light exercise routine to boost circulation. Include seasonal fruits like oranges, guavas, and amla rich in Vitamin C. Dress in layers and protect yourself from cold winds. Elderly and children should take extra precautions against respiratory infections. A warm cup of haldi doodh (turmeric milk) can help maintain immunity throughout the day.",
      category: "climate",
      weatherContext: "Winter season with cool mornings in Pune",
      season: "winter",
      priority: "medium",
      targetAudience: "all"
    },
    "winter_9PM": {
      title: "Winter Evening Health Tips",
      content: "As temperatures drop in the evening, keep yourself warm to prevent cold and flu. Have an early dinner with warm, nutritious foods. Apply moisturizer to prevent dry skin. Ensure proper heating but maintain ventilation to avoid carbon monoxide risks. A brief walk after dinner aids digestion. Keep emergency medications and Gravity Hospital's contact number accessible.",
      category: "climate",
      weatherContext: "Cold winter evenings in Pune",
      season: "winter",
      priority: "medium",
      targetAudience: "all"
    },
    "default_9AM": {
      title: "Morning Health Boost",
      content: "Start your day with 2 glasses of water to kickstart your metabolism. Include a balanced breakfast with proteins, carbs, and fruits. Take a 15-minute morning walk or yoga session. Plan your meals for the day to avoid unhealthy snacking. Stay hydrated throughout the day and take breaks from screen time every hour. For any health concerns, Gravity Hospital is here to help.",
      category: "diet",
      weatherContext: "Seasonal weather in Pune",
      season: season,
      priority: "medium",
      targetAudience: "all"
    },
    "default_9PM": {
      title: "Evening Wellness Routine",
      content: "Wind down your evening with light activities and avoid heavy meals 2-3 hours before sleep. Practice relaxation techniques like deep breathing or meditation. Limit screen time an hour before bed for better sleep quality. Keep your bedroom cool and dark for optimal rest. Review your health goals and plan for tomorrow. Gravity Hospital wishes you a peaceful and healthy night.",
      category: "diet",
      weatherContext: "Evening conditions in Pune",
      season: season,
      priority: "medium",
      targetAudience: "all"
    }
  };

  const key = `${season}_${scheduledFor}`;
  return fallbackTips[key] || fallbackTips[`default_${scheduledFor}`];
}
