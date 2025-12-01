import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  Clock, 
  Calendar,
  Users,
  ClipboardList,
  UserCheck,
  Search,
  Star,
  Mail,
  Globe
} from "lucide-react";
import type { Doctor, Appointment, Schedule } from "@shared/schema";

type TabType = "schedules" | "book" | "appointments" | "checkin" | "team";

export default function OPDService() {
  const [activeTab, setActiveTab] = useState<TabType>("schedules");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/doctors", selectedDoctor, "schedules", selectedDate],
    enabled: !!selectedDoctor && !!selectedDate,
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: {
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      doctorId: string;
      appointmentDate: string;
      timeSlot: string;
      symptoms?: string;
    }) => {
      return await apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been scheduled successfully.",
      });
      setActiveTab("appointments");
    },
    onError: (error: Error) => {
      const message = error.message.includes("409") 
        ? "This time slot is no longer available. Please choose another time."
        : "Failed to book appointment. Please try again.";
      toast({
        title: "Booking Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/appointments/${id}/checkin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Checked In",
        description: "Patient has been checked in successfully.",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cancelled",
        description: "Appointment has been cancelled.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "checked-in": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    return styles[status] || styles.scheduled;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointmentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scheduledAppointments = appointments.filter((apt) => apt.status === "scheduled");

  const getDoctorById = (id: string) => doctors.find((d) => d.id === id);

  const tabs = [
    { id: "schedules" as TabType, label: "Doctor Schedules", icon: Calendar },
    { id: "book" as TabType, label: "Book Appointment", icon: ClipboardList },
    { id: "appointments" as TabType, label: "Appointments", icon: ClipboardList },
    { id: "checkin" as TabType, label: "Check-in", icon: UserCheck },
    { id: "team" as TabType, label: "Our Team", icon: Users },
  ];

  const handleBookAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    bookAppointmentMutation.mutate({
      patientName: formData.get("patientName") as string,
      patientPhone: formData.get("patientPhone") as string,
      patientEmail: formData.get("patientEmail") as string || undefined,
      doctorId: formData.get("doctorId") as string,
      appointmentDate: formData.get("appointmentDate") as string,
      timeSlot: formData.get("timeSlot") as string,
      symptoms: formData.get("symptoms") as string || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* OPD Header */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">OPD - Outpatient Department</h1>
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>OPD Wing, Galaxy Multi Specialty Hospital</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Phone className="h-4 w-4" />
                <span className="text-sm">OPD: +91 20 1234 5679</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Mon-Sat: 8AM-8PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 py-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`h-14 flex items-center justify-center gap-2 ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6">
        {/* Doctor Schedules Tab */}
        {activeTab === "schedules" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="date-filter">Select Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  data-testid="input-date-filter"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="hover-elevate" data-testid={`card-doctor-${doctor.id}`}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg">
                        {doctor.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doctor.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{doctor.specialty}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDoctor(doctor.id)}
                      data-testid={`button-view-slots-${doctor.id}`}
                    >
                      View Slots
                    </Button>
                  </CardHeader>
                  {selectedDoctor === doctor.id && (
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Available Time Slots</span>
                          <span className="font-medium">
                            {schedules.filter((s) => !s.isBooked).length} slots
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {schedules.map((slot) => (
                            <Button
                              key={slot.id}
                              variant={slot.isBooked ? "secondary" : "outline"}
                              size="sm"
                              disabled={slot.isBooked}
                              className={!slot.isBooked ? "hover:bg-primary hover:text-primary-foreground" : ""}
                              data-testid={`slot-${slot.id}`}
                            >
                              {slot.timeSlot.substring(0, 5)}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 border rounded" /> Available
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-muted rounded" /> Booked
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Book Appointment Tab */}
        {activeTab === "book" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Book New Appointment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details below to schedule your visit
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBookAppointment} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      name="patientName"
                      placeholder="Enter full name"
                      required
                      data-testid="input-patient-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Phone Number</Label>
                    <Input
                      id="patientPhone"
                      name="patientPhone"
                      placeholder="+91 XXXXX XXXXX"
                      required
                      data-testid="input-patient-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientEmail">Email (Optional)</Label>
                    <Input
                      id="patientEmail"
                      name="patientEmail"
                      type="email"
                      placeholder="email@example.com"
                      data-testid="input-patient-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorId">Select Doctor</Label>
                    <Select name="doctorId" required>
                      <SelectTrigger data-testid="select-doctor">
                        <SelectValue placeholder="Choose a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate">Appointment Date</Label>
                    <Input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      required
                      data-testid="input-appointment-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <Select name="timeSlot" required>
                      <SelectTrigger data-testid="select-time-slot">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms / Reason for Visit</Label>
                  <Textarea
                    id="symptoms"
                    name="symptoms"
                    placeholder="Describe your symptoms or reason for visit..."
                    className="min-h-[100px]"
                    data-testid="textarea-symptoms"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={bookAppointmentMutation.isPending}
                  data-testid="button-book-appointment"
                >
                  {bookAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-appointments"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredAppointments.map((apt) => {
                const doctor = getDoctorById(apt.doctorId);
                return (
                  <Card key={apt.id} className="hover-elevate" data-testid={`card-appointment-${apt.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/50 text-primary-foreground">
                              {apt.patientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{apt.patientName}</h3>
                            <p className="text-sm text-muted-foreground">{apt.appointmentId}</p>
                          </div>
                        </div>
                        <Badge className={getStatusBadge(apt.status)}>
                          {apt.status.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{apt.patientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{doctor?.name || "Unknown Doctor"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(apt.appointmentDate).toLocaleDateString('en-US', { 
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{apt.timeSlot}</span>
                        </div>
                        {apt.symptoms && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <ClipboardList className="h-4 w-4 mt-0.5" />
                            <span className="line-clamp-2">{apt.symptoms}</span>
                          </div>
                        )}
                      </div>
                      {apt.status === "scheduled" && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            onClick={() => checkInMutation.mutate(apt.id)}
                            disabled={checkInMutation.isPending}
                            data-testid={`button-checkin-${apt.id}`}
                          >
                            Check In
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelMutation.mutate(apt.id)}
                            disabled={cancelMutation.isPending}
                            data-testid={`button-cancel-${apt.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredAppointments.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No appointments found</p>
              </Card>
            )}
          </div>
        )}

        {/* Check-in Tab */}
        {activeTab === "checkin" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">Patient Check-in</h2>
                    <p className="text-sm text-muted-foreground">
                      {scheduledAppointments.length} patients waiting for check-in
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {scheduledAppointments.map((apt) => {
                const doctor = getDoctorById(apt.doctorId);
                return (
                  <Card key={apt.id} className="hover-elevate" data-testid={`card-checkin-${apt.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {apt.patientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{apt.patientName}</h3>
                            <p className="text-sm text-muted-foreground">{apt.appointmentId}</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          SCHEDULED
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{doctor?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{apt.timeSlot}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => checkInMutation.mutate(apt.id)}
                        disabled={checkInMutation.isPending}
                        data-testid={`button-quick-checkin-${apt.id}`}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Check In Patient
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {scheduledAppointments.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No patients waiting for check-in</p>
              </Card>
            )}
          </div>
        )}

        {/* Our Team Tab */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">Our Medical Team</h2>
                    <p className="text-sm text-muted-foreground">
                      Meet our experienced healthcare professionals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="hover-elevate" data-testid={`card-team-${doctor.id}`}>
                  <CardContent className="pt-6 text-center">
                    <Avatar className="h-24 w-24 mx-auto hover:scale-110 transition-transform">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl">
                        {doctor.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 text-lg font-semibold">{doctor.name}</h3>
                    <Badge className="mt-2 bg-primary/10 text-primary">
                      {doctor.specialty}
                    </Badge>
                    <div className="flex items-center justify-center gap-1 mt-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{doctor.rating}</span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>{doctor.experience}+ years experience</p>
                      <p>{doctor.qualification}</p>
                      <p>{doctor.availableDays}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Galaxy Multi Specialty Hospital</h2>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Address</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sane Chowk, Nair Colony,<br />
                More Vasti, Chikhali,<br />
                Pimpri-Chinchwad,<br />
                Maharashtra 411062
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Contact</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Main: +91 20 1234 5678</p>
                <p>Emergency: +91 20 1234 5680</p>
                <p>OPD: +91 20 1234 5679</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Timings</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>24/7 Emergency</p>
                <p>OPD: Mon-Sat 8AM-8PM</p>
                <p>Sun: 9AM-1PM</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Online</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>info@galaxyhospital.com</p>
                <p>appointments@galaxyhospital.com</p>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>www.galaxyhospital.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Galaxy Multi Specialty Hospital. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
