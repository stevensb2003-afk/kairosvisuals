import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase/init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { type Country } from 'react-phone-number-input';

export interface SocialMedia {
  platform: string;
  handle: string;
}

export interface BriefingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  industry: string;
  hasSocials: boolean;
  socials: SocialMedia[];
  aboutBusiness: string;
  expectations: string[];
  mainGoals: string[];
  motivation: string;
  contactSource: string;
  contactPreference: string;
}

const initialFormData: BriefingFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  industry: '',
  hasSocials: true,
  socials: [],
  aboutBusiness: '',
  expectations: [],
  mainGoals: [],
  motivation: '',
  contactSource: '',
  contactPreference: 'whatsapp'
};

export function useBriefingForm() {
  const { toast } = useToast();
  
  // Navigation State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form Data State
  const [formData, setFormData] = useState<BriefingFormData>(initialFormData);
  
  // Local states that need persistence across steps
  const [newSocial, setNewSocial] = useState<SocialMedia>({ platform: 'instagram', handle: '' });
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>('CR');
  const [emailError, setEmailError] = useState('');
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);

  // Validation Utils
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'email') {
      setEmailError(e.target.value && !validateEmail(e.target.value) ? 'Correo inválido' : '');
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleSelection = (field: 'expectations' | 'mainGoals', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(id => id !== value) };
      }
      if (current.length < 3) {
        return { ...prev, [field]: [...current, value] };
      }
      toast({
        title: "Límite alcanzado",
        description: "Puedes seleccionar un máximo de 3 opciones.",
        variant: "destructive"
      });
      return prev;
    });
  };

  const addSocial = () => {
    if (!newSocial.handle.trim()) return;
    setFormData(prev => ({
      ...prev,
      socials: [...prev.socials, { ...newSocial }]
    }));
    setNewSocial({ platform: 'instagram', handle: '' });
  };

  const removeSocial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socials: prev.socials.filter((_, i) => i !== index)
    }));
  };

  // Navigation Handlers
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const validateStep = () => {
    if (currentStep === 1) {
      return (
        formData.firstName.trim() !== '' &&
        formData.lastName.trim() !== '' &&
        (formData.email.trim() === '' || validateEmail(formData.email)) &&
        formData.phone.trim() !== ''
      );
    }
    if (currentStep === 2) {
      return formData.aboutBusiness.trim() !== '' && formData.industry !== '';
    }
    if (currentStep === 3) {
      return (
        formData.expectations.length > 0 &&
        formData.mainGoals.length > 0 &&
        formData.motivation !== ''
      );
    }
    if (currentStep === 4) {
      return formData.contactSource !== '' && formData.contactPreference !== '';
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const { firestore } = initializeFirebase();
      const requestsRef = collection(firestore, 'requests');

      await addDoc(requestsRef, {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error al enviar",
        description: "Hubo un problema procesando tu solicitud. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    currentStep,
    isSubmitting,
    isSuccess,
    formData,
    newSocial,
    selectedCountry,
    emailError,
    showPhoneWarning,
    
    // State Setters
    setFormData,
    setNewSocial,
    setSelectedCountry,
    setShowPhoneWarning,
    
    // Handlers
    handleChange,
    handleSelectChange,
    handleToggleSelection,
    addSocial,
    removeSocial,
    nextStep,
    prevStep,
    validateStep,
    handleSubmit
  };
}
