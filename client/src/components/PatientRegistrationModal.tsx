import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserPlus, Calendar, User, MapPin, Phone, CreditCard, Loader2 } from "lucide-react";

const patientRegistrationSchema = z.object({
  prefix: z.string().optional(),
  surname: z.string().min(1, "Surname is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),
  weight: z.string().optional(),
  height: z.string().optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  allergy: z.string().optional(),
  referralDoctor: z.string().optional(),
  appointmentTime: z.string().optional(),
  languagePreferred: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  pincode: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phoneOffice: z.string().optional(),
  mobileNo: z.string().optional(),
  consultationCharges: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
});

type PatientRegistrationFormData = z.infer<typeof patientRegistrationSchema>;

export type { PatientRegistrationFormData };

interface AppointmentData {
  appointmentId?: string;
  appointmentTime?: string;
  appointmentDate?: string;
  doctorName?: string;
  department?: string;
  patientName?: string;
  phone?: string;
}

export interface SavedRegistrationData extends PatientRegistrationFormData {
  appointmentId?: string;
  savedAt?: string;
}

interface PatientRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentData?: AppointmentData;
  onSuccess?: () => void;
  savedRegistration?: SavedRegistrationData;
  onSaveSuccess?: (data: SavedRegistrationData) => void;
  printAfterSave?: boolean;
}

const INDIAN_STATES = [
  "Andaman And Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra And Nagar Haveli", "Daman And Diu", "Delhi",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu And Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal"
];

const LANGUAGES = [
  "Assamese", "Bengali", "Bodo", "Dogri", "English", "Gujarati", "Hindi", "Kannada",
  "Kashmiri", "Konkani", "Maithili", "Malayalam", "Manipuri", "Marathi", "Nepali",
  "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu"
];

export function PatientRegistrationModal({
  open,
  onOpenChange,
  appointmentData,
  onSuccess,
  savedRegistration,
  onSaveSuccess,
  printAfterSave,
}: PatientRegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PatientRegistrationFormData>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      prefix: "Mr",
      surname: "",
      firstName: "",
      middleName: "",
      dateOfBirth: "",
      age: "",
      gender: "M",
      weight: "",
      height: "",
      maritalStatus: "SINGLE",
      occupation: "",
      allergy: "",
      referralDoctor: "SELF",
      appointmentTime: "",
      languagePreferred: "Hindi",
      phone: "",
      address: "",
      country: "India",
      state: "",
      city: "",
      area: "",
      pincode: "",
      email: "",
      phoneOffice: "",
      mobileNo: "",
      consultationCharges: "",
      insuranceProvider: "",
      insuranceNumber: "",
    },
  });

  useEffect(() => {
    if (open && savedRegistration) {
      Object.keys(savedRegistration).forEach((key) => {
        if (key !== 'appointmentId' && key !== 'savedAt') {
          const value = savedRegistration[key as keyof PatientRegistrationFormData];
          if (value !== undefined) {
            form.setValue(key as keyof PatientRegistrationFormData, value);
          }
        }
      });
    } else if (open && appointmentData) {
      const nameParts = appointmentData.patientName?.split(" ") || [];
      const firstName = nameParts[0] || "";
      const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";
      
      form.setValue("firstName", firstName);
      form.setValue("surname", surname);
      form.setValue("middleName", middleName);
      form.setValue("phone", appointmentData.phone || "");
      form.setValue("mobileNo", appointmentData.phone || "");
      form.setValue("appointmentTime", appointmentData.appointmentTime || "");
      form.setValue("referralDoctor", appointmentData.doctorName || "SELF");
    }
  }, [open, appointmentData, savedRegistration, form]);

  const calculateAge = (dob: string): string => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
      months--;
      days += 30;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return `${years}`;
  };

  const watchDob = form.watch("dateOfBirth");
  useEffect(() => {
    const age = calculateAge(watchDob);
    form.setValue("age", age);
  }, [watchDob, form]);

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientRegistrationFormData) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.surname,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender === "M" ? "male" : data.gender === "F" ? "female" : "other",
        phone: data.mobileNo || data.phone || "",
        email: data.email || "",
        address: [data.address, data.area, data.city, data.state, data.country, data.pincode].filter(Boolean).join(", "),
        emergencyContact: data.phoneOffice || "",
        insuranceProvider: data.insuranceProvider || "",
        insuranceNumber: data.insuranceNumber || "",
      };
      const response = await apiRequest("POST", "/api/patients/service", payload);
      return { ...data, response: await response.json() };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients/service"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      const savedData: SavedRegistrationData = {
        ...result,
        appointmentId: appointmentData?.appointmentId,
        savedAt: new Date().toISOString(),
      };
      
      toast({
        title: "Patient Registered",
        description: printAfterSave ? "Registration saved. Print window will open." : "New patient has been added successfully",
      });
      
      onSaveSuccess?.(savedData);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register patient",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatientRegistrationFormData) => {
    createPatientMutation.mutate(data);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Patient Registration
          </DialogTitle>
          <DialogDescription>
            Register new patient with appointment details
          </DialogDescription>
        </DialogHeader>

        {appointmentData && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">{appointmentData.appointmentDate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">OPD Dept:</span>
                <p className="font-medium">{appointmentData.department}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Consultant:</span>
                <p className="font-medium">{appointmentData.doctorName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">{appointmentData.appointmentTime}</p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Prefix</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mr" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Master">Master</SelectItem>
                        <SelectItem value="Baby">Baby</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel>Surname *</FormLabel>
                    <FormControl>
                      <Input placeholder="Surname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Middle Name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input placeholder="Age" {...field} readOnly className="bg-muted" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Sex *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Wt.(Kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Ht.(Cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="MARRIED">Married</SelectItem>
                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Occupation" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allergy"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Allergy</FormLabel>
                    <FormControl>
                      <Input placeholder="Known allergies" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="referralDoctor"
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel>Referral Doctor</FormLabel>
                    <FormControl>
                      <Input placeholder="SELF" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel>Appointment Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="languagePreferred"
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel>Language Preferred</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="mobileNo"
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel>Contact No / Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="Mobile number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel>Email ID</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneOffice"
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel>Ph.No (Off/Resi.)</FormLabel>
                    <FormControl>
                      <Input placeholder="Office/Home phone" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="India" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <Input placeholder="Area/Locality" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input placeholder="Pincode" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consultationCharges"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Consultation Charges</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="150" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Insurance Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Insurance" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceNumber"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Insurance No.</FormLabel>
                    <FormControl>
                      <Input placeholder="Policy number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createPatientMutation.isPending}
              >
                {createPatientMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
