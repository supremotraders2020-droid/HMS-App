import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ShieldCheck, Heart, Scale, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface DoctorOathModalProps {
  doctorId: string;
  doctorName: string;
  onOathAccepted: () => void;
}

const OATH_TEXT = [
  "I will dedicate my life to the service of humanity and my patients.",
  "The health of my patient will be my first consideration.",
  "I will practice my profession with conscience, dignity, and responsibility.",
  "I will respect the autonomy, dignity, and rights of all patients.",
  "I will maintain the highest standards of professional conduct and ethical behavior.",
  "I will not permit considerations of religion, nationality, race, politics, gender, or social standing to intervene in my duty.",
  "I will maintain utmost respect for human life from its beginning.",
  "I will keep all patient information confidential unless required by law.",
  "I will continue to learn and improve my knowledge and skills throughout my career.",
  "I will treat my colleagues with respect and maintain the honor of the medical profession."
];

export default function DoctorOathModal({ doctorId, doctorName, onOathAccepted }: DoctorOathModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const { data: oathStatus, isLoading: checkingOath } = useQuery<{ accepted: boolean }>({
    queryKey: ['/api/doctor-oath', doctorId, todayDate],
    enabled: !!doctorId,
  });

  const acceptOathMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/doctor-oath", {
        doctorId,
        date: todayDate,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-oath', doctorId, todayDate] });
      setIsOpen(false);
      onOathAccepted();
    },
  });

  if (checkingOath) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking oath status...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (oathStatus?.accepted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Doctor's Oath
                </DialogTitle>
                <DialogDescription className="text-sm">
                  NMC Physician's Pledge - India
                </DialogDescription>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{doctorName}</span>. 
              Please confirm your daily pledge to uphold the sacred duties of medical practice.
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            <div className="p-6">
              <div className="bg-card border rounded-lg p-6 mb-4">
                <p className="text-center font-semibold text-lg text-primary mb-6 italic">
                  "As a doctor, I solemnly pledge that:"
                </p>
                
                <div className="space-y-4">
                  <AnimatePresence>
                    {OATH_TEXT.map((text, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">
                          {text}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Separator className="my-6" />

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-center font-medium text-primary italic"
                >
                  "I make these promises solemnly, freely, and upon my honor."
                </motion.p>
              </div>

              <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" />
                  <span>Compassion</span>
                </div>
                <div className="flex items-center gap-1">
                  <Scale className="h-3 w-3 text-blue-500" />
                  <span>Ethics</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-green-500" />
                  <span>Integrity</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 pt-4 border-t bg-muted/30">
            <div className="flex flex-col gap-4">
              <div className="text-center text-xs text-muted-foreground">
                Date: <span className="font-medium text-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full font-semibold"
                onClick={() => acceptOathMutation.mutate()}
                disabled={acceptOathMutation.isPending}
                data-testid="button-accept-oath"
              >
                {acceptOathMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording Confirmation...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    I Agree - Accept the Oath
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You must accept the oath to access the portal. This confirmation resets daily.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
