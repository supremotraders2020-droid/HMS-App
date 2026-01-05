import { z } from "zod";

export const ValidationPatterns = {
  numericOnly: /^[0-9]*\.?[0-9]*$/,
  integerOnly: /^[0-9]*$/,
  textOnly: /^[a-zA-Z\s.,;:!?'"()\-]*$/,
  textWithNumbers: /^[a-zA-Z0-9\s.,;:!?'"()\-/]*$/,
  nameField: /^[a-zA-Z\s.\-']*$/,
  bloodPressure: /^[0-9]{0,3}\/?[0-9]{0,3}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[0-9+\-\s()]*$/,
  alphanumeric: /^[a-zA-Z0-9\s\-_]*$/,
} as const;

export const ValidationMessages = {
  numericOnly: "Only numbers are allowed",
  textOnly: "Only letters and punctuation are allowed",
  nameField: "Only letters, spaces, dots and hyphens are allowed",
  bloodPressure: "Format: 120/80",
  required: "This field is required",
  minLength: (min: number) => `Minimum ${min} characters required`,
  maxLength: (max: number) => `Maximum ${max} characters allowed`,
  range: (min: number, max: number) => `Value must be between ${min} and ${max}`,
} as const;

export const VitalsConfig = {
  bp: {
    pattern: ValidationPatterns.bloodPressure,
    placeholder: "120/80",
    min: 0,
    max: 300,
    errorMessage: "Enter valid BP (e.g., 120/80)",
  },
  sugar: {
    pattern: ValidationPatterns.integerOnly,
    placeholder: "100",
    min: 20,
    max: 600,
    errorMessage: "Sugar must be between 20-600 mg/dL",
  },
  pulse: {
    pattern: ValidationPatterns.integerOnly,
    placeholder: "72",
    min: 30,
    max: 250,
    errorMessage: "Pulse must be between 30-250 bpm",
  },
  weight: {
    pattern: ValidationPatterns.numericOnly,
    placeholder: "70",
    min: 0.5,
    max: 500,
    errorMessage: "Weight must be between 0.5-500 kg",
  },
  temperature: {
    pattern: ValidationPatterns.numericOnly,
    placeholder: "98.6",
    min: 90,
    max: 110,
    errorMessage: "Temperature must be between 90-110°F",
  },
  height: {
    pattern: ValidationPatterns.numericOnly,
    placeholder: "170",
    min: 30,
    max: 300,
    errorMessage: "Height must be between 30-300 cm",
  },
  spo2: {
    pattern: ValidationPatterns.integerOnly,
    placeholder: "98",
    min: 50,
    max: 100,
    errorMessage: "SpO2 must be between 50-100%",
  },
  respiratoryRate: {
    pattern: ValidationPatterns.integerOnly,
    placeholder: "16",
    min: 5,
    max: 60,
    errorMessage: "Respiratory rate must be between 5-60 breaths/min",
  },
} as const;

export const TextFieldConfig = {
  complaints: {
    pattern: ValidationPatterns.textWithNumbers,
    placeholder: "Enter patient complaints",
    minLength: 0,
    maxLength: 2000,
    errorMessage: "Only letters, numbers and punctuation allowed",
  },
  diagnosis: {
    pattern: ValidationPatterns.textWithNumbers,
    placeholder: "Enter diagnosis",
    minLength: 0,
    maxLength: 2000,
    errorMessage: "Only letters, numbers and punctuation allowed",
  },
  observations: {
    pattern: ValidationPatterns.textWithNumbers,
    placeholder: "Enter observations",
    minLength: 0,
    maxLength: 5000,
    errorMessage: "Only letters, numbers and punctuation allowed",
  },
  notes: {
    pattern: ValidationPatterns.textWithNumbers,
    placeholder: "Enter notes",
    minLength: 0,
    maxLength: 5000,
    errorMessage: "Only letters, numbers and punctuation allowed",
  },
  name: {
    pattern: ValidationPatterns.nameField,
    placeholder: "Enter name",
    minLength: 2,
    maxLength: 100,
    errorMessage: "Only letters, spaces, dots and hyphens allowed",
  },
} as const;

export function isValidNumericInput(value: string, allowDecimal: boolean = true): boolean {
  if (allowDecimal) {
    return ValidationPatterns.numericOnly.test(value);
  }
  return ValidationPatterns.integerOnly.test(value);
}

export function isValidTextInput(value: string, allowNumbers: boolean = false): boolean {
  if (allowNumbers) {
    return ValidationPatterns.textWithNumbers.test(value);
  }
  return ValidationPatterns.textOnly.test(value);
}

export function isValidBloodPressure(value: string): boolean {
  return ValidationPatterns.bloodPressure.test(value);
}

export function sanitizeNumericInput(value: string): string {
  return value.replace(/[^0-9.]/g, '');
}

export function sanitizeTextInput(value: string): string {
  return value.replace(/[^a-zA-Z\s.,;:!?'"()\-/0-9]/g, '');
}

export function sanitizeNameInput(value: string): string {
  return value.replace(/[^a-zA-Z\s.\-']/g, '');
}

export const zodVitalsSchemas = {
  bp: z.string().regex(/^([0-9]{1,3}\/[0-9]{1,3})?$/, "Invalid BP format").optional(),
  sugar: z.coerce.number().min(20).max(600).optional().or(z.literal('')),
  pulse: z.coerce.number().min(30).max(250).optional().or(z.literal('')),
  weight: z.coerce.number().min(0.5).max(500).optional().or(z.literal('')),
  temperature: z.coerce.number().min(90).max(110).optional().or(z.literal('')),
  height: z.coerce.number().min(30).max(300).optional().or(z.literal('')),
  spo2: z.coerce.number().min(50).max(100).optional().or(z.literal('')),
  respiratoryRate: z.coerce.number().min(5).max(60).optional().or(z.literal('')),
};

export const zodTextSchemas = {
  complaints: z.string().max(2000).regex(ValidationPatterns.textWithNumbers, "Invalid characters").optional(),
  diagnosis: z.string().max(2000).regex(ValidationPatterns.textWithNumbers, "Invalid characters").optional(),
  observations: z.string().max(5000).regex(ValidationPatterns.textWithNumbers, "Invalid characters").optional(),
  notes: z.string().max(5000).regex(ValidationPatterns.textWithNumbers, "Invalid characters").optional(),
  name: z.string().min(2).max(100).regex(ValidationPatterns.nameField, "Invalid name format"),
};
