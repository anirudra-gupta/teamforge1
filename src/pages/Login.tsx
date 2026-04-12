import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { Logo } from '../components/Logo';
import { Chrome, Mail, Phone, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in with Google!');
    } catch (error: any) {
      console.error("Google Login failed:", error);
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      console.error("Email Auth failed:", error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !recaptchaVerifier) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      toast.success('Verification code sent!');
    } catch (error: any) {
      console.error("Phone Auth failed:", error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      toast.success('Phone verified successfully!');
    } catch (error: any) {
      console.error("OTP Verification failed:", error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F5ECDD] flex items-center justify-center p-6">
      <div id="recaptcha-container"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-[#111111]/5"
      >
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6 scale-110" showText={false} />
          <h1 className="font-serif text-3xl font-black text-[#111111] mb-2 uppercase tracking-tight">Welcome Back</h1>
          <p className="text-[#111111]/50 text-sm font-medium">
            Choose your preferred way to continue forging.
          </p>
        </div>

        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#F5ECDD]/50 p-1 rounded-2xl">
            <TabsTrigger value="google" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Chrome className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Mail className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="phone" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Phone className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="google" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-14 bg-[#111111] text-white hover:bg-[#111111]/90 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
                  Continue with Google
                </Button>
                <p className="text-center text-[10px] font-bold text-[#111111]/30 uppercase tracking-widest">
                  Fastest way to get started
                </p>
              </motion.div>
            </TabsContent>

            <TabsContent value="email" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 ml-1">Email Address</Label>
                    <Input 
                      type="email" 
                      placeholder="name@company.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-2xl border-[#111111]/5 bg-[#F5ECDD]/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 ml-1">Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-[#111111]/5 bg-[#F5ECDD]/20 focus:bg-white transition-all"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-[#B45309] text-white hover:bg-[#B45309]/90 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full text-center text-xs font-bold text-[#111111]/40 hover:text-[#B45309] transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </form>
              </motion.div>
            </TabsContent>

            <TabsContent value="phone" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {!confirmationResult ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 ml-1">Phone Number</Label>
                      <Input 
                        type="tel" 
                        placeholder="+1 234 567 8900" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-12 rounded-2xl border-[#111111]/5 bg-[#F5ECDD]/20 focus:bg-white transition-all"
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-[#111111] text-white hover:bg-[#111111]/90 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                      <Phone className="w-5 h-5" />
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 ml-1">Verification Code</Label>
                      <Input 
                        type="text" 
                        placeholder="123456" 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="h-12 rounded-2xl border-[#111111]/5 bg-[#F5ECDD]/20 focus:bg-white transition-all text-center tracking-[0.5em] text-xl font-black"
                        maxLength={6}
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-[#B45309] text-white hover:bg-[#B45309]/90 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                      <ShieldCheck className="w-5 h-5" />
                    </Button>
                    <button 
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="w-full text-center text-xs font-bold text-[#111111]/40 hover:text-[#B45309] transition-colors"
                    >
                      Use a different number
                    </button>
                  </form>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        <p className="mt-10 text-[10px] font-bold text-[#111111]/20 uppercase tracking-[0.2em] leading-relaxed text-center">
          By continuing, you agree to TeamForge's <br />
          <a href="#" className="underline hover:text-[#B45309]">Terms</a> and <a href="#" className="underline hover:text-[#B45309]">Privacy</a>.
        </p>
      </motion.div>
    </div>
  );
}
