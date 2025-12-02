import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

const HOSPITAL_CONTEXT = `You are a helpful AI assistant for Gravity Hospital in Chikhali, Pimpri-Chinchwad, Maharashtra, India.

Hospital Information:
- Name: Gravity Hospital
- Location: Chikhali, Pimpri-Chinchwad, Maharashtra 411057
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
      response: "Gravity Hospital\n\nAddress: Chikhali, Pimpri-Chinchwad, Maharashtra 411057\n\nContact Numbers:\n• General Enquiry: +91 20 1234 5678\n• Emergency: +91 20 9876 5432\n• Appointments: +91 20 1234 5679\n\nOPD Hours: 9 AM - 9 PM (Monday - Saturday)\nEmergency: 24/7",
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
