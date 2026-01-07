import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, LogIn, Heart, Activity, Stethoscope, Pill, Syringe, Shield, Clock, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import hospitalLogo from "@assets/LOGO_1_1765346562770.png";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB" | "TECHNICIAN";

interface AuthFormsProps {
  onLogin?: (username: string, password: string, role: UserRole) => void;
  onRegister?: (userData: any) => void;
  loginError?: string | null;
}

function FloatingIcon({ icon: Icon, delay, duration, x, y, size }: { 
  icon: any; 
  delay: number; 
  duration: number; 
  x: number; 
  y: number;
  size: number;
}) {
  return (
    <motion.div
      className="absolute text-white/10 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
      animate={{ 
        opacity: [0.1, 0.3, 0.1],
        scale: [0.8, 1.2, 0.8],
        rotate: [0, 15, -15, 0],
        y: [0, -30, 0],
      }}
      transition={{ 
        duration, 
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Icon style={{ width: size, height: size }} />
    </motion.div>
  );
}

function HeartbeatLine() {
  return (
    <motion.div 
      className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none opacity-20"
    >
      <motion.svg
        viewBox="0 0 1200 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,50 L100,50 L120,50 L140,20 L160,80 L180,10 L200,90 L220,50 L240,50 L400,50 L420,50 L440,20 L460,80 L480,10 L500,90 L520,50 L540,50 L700,50 L720,50 L740,20 L760,80 L780,10 L800,90 L820,50 L840,50 L1000,50 L1020,50 L1040,20 L1060,80 L1080,10 L1100,90 L1120,50 L1200,50"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.svg>
    </motion.div>
  );
}

function PulsingCircle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/5 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: [0.8, 1.5, 0.8],
        opacity: [0.1, 0.3, 0.1]
      }}
      transition={{ 
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

function DNAHelix() {
  return (
    <motion.div className="absolute right-0 top-0 bottom-0 w-32 overflow-hidden pointer-events-none opacity-10 hidden lg:block">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 rounded-full bg-white"
          style={{ top: `${i * 10}%` }}
          animate={{
            x: [0, 80, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`pair-${i}`}
          className="absolute w-4 h-4 rounded-full bg-cyan-300"
          style={{ top: `${i * 10}%` }}
          animate={{
            x: [80, 0, 80],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  );
}

export default function AuthForms({ onLogin, onRegister, loginError }: AuthFormsProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "" as UserRole,
    firstName: "",
    lastName: ""
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const allRoles: { value: UserRole; label: string; description: string }[] = [
    { value: "SUPER_ADMIN", label: "Super Admin", description: "Enterprise control & audit" },
    { value: "ADMIN", label: "Administrator", description: "Full system access" },
    { value: "DOCTOR", label: "Doctor", description: "Patient care & diagnosis" },
    { value: "NURSE", label: "Nurse", description: "Patient care & monitoring" },
    { value: "OPD_MANAGER", label: "OPD Manager", description: "Outpatient department" },
    { value: "PATIENT", label: "Patient", description: "Personal health records" },
    { value: "MEDICAL_STORE", label: "Medical Store", description: "Pharmacy & dispensing" },
    { value: "PATHOLOGY_LAB", label: "Pathology Lab", description: "Lab tests & reports" },
    { value: "TECHNICIAN", label: "Technician", description: "Diagnostic imaging & scans" }
  ];
  
  const registrationRoles: { value: UserRole; label: string; description: string }[] = [
    { value: "PATIENT", label: "Patient", description: "Personal health records" }
  ];
  
  const roles = isLogin ? allRoles : registrationRoles;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin && onLogin) {
      onLogin(formData.username, formData.password, formData.role);
    } else if (!isLogin && onRegister) {
      onRegister(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const floatingIcons = [
    { icon: Heart, delay: 0, duration: 4, x: 5, y: 10, size: 40 },
    { icon: Activity, delay: 0.5, duration: 5, x: 85, y: 15, size: 48 },
    { icon: Stethoscope, delay: 1, duration: 4.5, x: 10, y: 70, size: 44 },
    { icon: Pill, delay: 1.5, duration: 5.5, x: 90, y: 60, size: 36 },
    { icon: Syringe, delay: 2, duration: 4, x: 15, y: 40, size: 32 },
    { icon: Shield, delay: 2.5, duration: 5, x: 80, y: 35, size: 40 },
    { icon: Users, delay: 3, duration: 4.5, x: 8, y: 85, size: 38 },
    { icon: Heart, delay: 3.5, duration: 5, x: 92, y: 80, size: 34 },
  ];

  const pulsingCircles = [
    { delay: 0, x: 20, y: 20, size: 200 },
    { delay: 1, x: 70, y: 30, size: 150 },
    { delay: 2, x: 30, y: 70, size: 180 },
    { delay: 1.5, x: 80, y: 75, size: 160 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800"
        animate={{
          background: [
            "linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #1e40af 100%)",
            "linear-gradient(135deg, #0891b2 0%, #1e40af 50%, #7c3aed 100%)",
            "linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #0d9488 100%)",
            "linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #1e40af 100%)",
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating Medical Icons */}
      {floatingIcons.map((item, index) => (
        <FloatingIcon key={index} {...item} />
      ))}

      {/* Pulsing Circles */}
      {pulsingCircles.map((circle, index) => (
        <PulsingCircle key={index} {...circle} />
      ))}

      {/* DNA Helix Animation */}
      <DNAHelix />

      {/* Heartbeat Line */}
      <HeartbeatLine />

      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Branding (hidden on mobile, visible on larger screens) */}
        <motion.div 
          className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center items-center p-8 xl:p-16"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="text-center max-w-xl">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-2xl">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Heart className="w-full h-full text-white" fill="rgba(255,255,255,0.3)" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1 
              className="text-4xl xl:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Welcome to
              <span className="block text-cyan-200 mt-2">HMS Core</span>
            </motion.h1>

            <motion.p 
              className="text-lg xl:text-xl text-white/80 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Advanced Hospital Management System
            </motion.p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              {[
                { icon: Shield, label: "HIPAA Compliant" },
                { icon: Activity, label: "Real-time Monitoring" },
                { icon: Users, label: "Multi-role Access" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <feature.icon className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm text-white">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Live Clock */}
            <motion.div 
              className="mt-12 flex items-center justify-center gap-3 text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Clock className="w-5 h-5" />
              <span className="text-lg font-mono">
                {currentTime.toLocaleTimeString('en-IN', { hour12: true })}
              </span>
              <span className="text-sm">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Mobile Header - visible only on small screens */}
            <motion.div 
              className="lg:hidden text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Heart className="w-full h-full text-white" fill="rgba(255,255,255,0.3)" />
                </motion.div>
              </div>
              <h1 className="text-2xl font-bold text-white">HMS Core</h1>
              <p className="text-white/70 text-sm">Hospital Management System</p>
            </motion.div>

            <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-4">
                <motion.div 
                  className="flex items-center justify-center py-3"
                  whileHover={{ scale: 1.02 }}
                >
                  <img 
                    src={hospitalLogo} 
                    alt="Gravity Hospital" 
                    className="w-full max-w-[280px] sm:max-w-[320px] h-20 sm:h-24 object-contain"
                    data-testid="img-hospital-logo"
                  />
                </motion.div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? "login" : "register"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardTitle className="text-xl sm:text-2xl flex items-center justify-center gap-2">
                      {isLogin ? (
                        <>
                          <LogIn className="w-5 h-5 text-teal-600" />
                          Sign In
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 text-teal-600" />
                          Create Account
                        </>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {isLogin 
                        ? "Access your hospital management portal" 
                        : "Register for a new patient account"
                      }
                    </CardDescription>
                  </motion.div>
                </AnimatePresence>
              </CardHeader>

              <CardContent className="space-y-4 px-4 sm:px-6">
                <AnimatePresence mode="wait">
                  {loginError && (
                    <motion.div 
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                      data-testid="login-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Shield className="w-4 h-4" />
                      {loginError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div 
                        className="grid grid-cols-2 gap-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm" data-testid="label-firstName">First Name</Label>
                          <Input
                            id="firstName"
                            data-testid="input-firstName"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            required={!isLogin}
                            className="h-10 sm:h-11 transition-all focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm" data-testid="label-lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            data-testid="input-lastName"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            required={!isLogin}
                            className="h-10 sm:h-11 transition-all focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="username" className="text-sm" data-testid="label-username">Username</Label>
                    <Input
                      id="username"
                      data-testid="input-username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      required
                      className="h-10 sm:h-11 transition-all focus:ring-2 focus:ring-teal-500"
                    />
                  </motion.div>

                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Label htmlFor="email" className="text-sm" data-testid="label-email">Email</Label>
                        <Input
                          id="email"
                          data-testid="input-email"
                          type="email"
                          placeholder="patient@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required={!isLogin}
                          className="h-10 sm:h-11 transition-all focus:ring-2 focus:ring-teal-500"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="password" className="text-sm" data-testid="label-password">Password</Label>
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      className="h-10 sm:h-11 transition-all focus:ring-2 focus:ring-teal-500"
                    />
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="role" className="text-sm" data-testid="label-role">Role</Label>
                    <Select value={formData.role} onValueChange={(value: UserRole) => handleInputChange("role", value)}>
                      <SelectTrigger data-testid="select-role" className="h-10 sm:h-11 transition-all focus:ring-2 focus:ring-teal-500">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{role.label}</span>
                              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                                {role.description}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-11 sm:h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]" 
                      data-testid={isLogin ? "button-login" : "button-register"}
                    >
                      {isLogin ? (
                        <span className="flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          Sign In to Portal
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Create Account
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.div 
                  className="text-center pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="ghost"
                    data-testid="button-toggle-mode"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                  >
                    {isLogin ? "Need an account? Register here" : "Already have an account? Sign in"}
                  </Button>
                </motion.div>

                {/* Security badges */}
                <motion.div 
                  className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                    <Shield className="w-3 h-3 mr-1" />
                    HIPAA Secure
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
                    <Activity className="w-3 h-3 mr-1" />
                    NABH Certified
                  </Badge>
                </motion.div>
              </CardContent>
            </Card>

            {/* Footer - visible on all devices */}
            <motion.p 
              className="text-center text-white/60 text-xs sm:text-sm mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Gravity Hospital &copy; {new Date().getFullYear()} | Powered by HMS Core
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
