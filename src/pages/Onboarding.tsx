import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Logo } from '../components/Logo';
import { User, Loader2, Check, X, ArrowRight, Camera, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const ROLES = [
  "Founder", "Developer", "Designer", "Marketer", "Product Manager", "Sales", "Other"
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Step 1: Identity
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  
  // Step 2: Profile
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('Founder');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [workStyle, setWorkStyle] = useState('Collaborative');

  const checkUsername = async (val: string) => {
    if (val.length < 3) {
      setUsernameStatus('invalid');
      return;
    }
    setIsCheckingUsername(true);
    try {
      const q = query(collection(db, 'profiles'), where('username', '==', val.toLowerCase()), limit(1));
      const snap = await getDocs(q);
      setUsernameStatus(snap.empty ? 'available' : 'taken');
    } catch (error) {
      console.error("Username check failed:", error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) checkUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleNext = () => {
    if (step === 1) {
      if (!displayName.trim() || usernameStatus !== 'available') {
        toast.error("Please provide a valid name and an available username.");
        return;
      }
      setStep(2);
    } else {
      finalizeOnboarding();
    }
  };

  const finalizeOnboarding = async () => {
    setIsProcessing(true);
    
    try {
      if (user) {
        const finalDisplayName = displayName.trim() || user.displayName || 'Anonymous Founder';
        
        // Save private user data
        const userPath = `users/${user.uid}`;
        const userDataPayload = {
          uid: user.uid,
          email: user.email || '',
          username: username.toLowerCase(),
          onboardingCompleted: true,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', user.uid), userDataPayload);

        // Save public profile
        const profilePath = `profiles/${user.uid}`;
        const profileDataPayload = {
          uid: user.uid,
          username: username.toLowerCase(),
          displayName: finalDisplayName,
          photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
          bio: bio.trim() || "A visionary founder on TeamForge.",
          skills: skills.split(',').map(s => s.trim()).filter(s => s !== ''),
          interests: interests.split(',').map(i => i.trim()).filter(i => i !== ''),
          role: role,
          personality: "Determined", // Default or could add a selector
          mindsetTraits: [],
          knowledgeGaps: [],
          badges: ["Early Adopter"],
          workStyle: workStyle,
          recommendations: "",
          lookingFor: lookingFor.trim() || "Complementary co-founders.",
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'profiles', user.uid), profileDataPayload);

        toast.success("Profile created. Welcome to the network.");
        navigate('/dashboard');
      } else {
        throw new Error("User session not found. Please log in again.");
      }
    } catch (error) {
      console.error("Onboarding failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile.");
      setIsProcessing(false);
    }
  };

  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const res = await fetch("/backend/test");
      const data = await res.json();
      setDebugInfo(JSON.stringify(data, null, 2));
      toast.info("Backend is reachable");
    } catch (err: any) {
      setDebugInfo(`Error: ${err.message}`);
      toast.error("Backend unreachable");
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Panel: Context & Progress */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 flex flex-col justify-between py-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-12">
              <Logo showText={false} className="w-10 h-10" />
              <h1 className="text-2xl font-black tracking-tighter text-[#1f1b12]">TEAM FORGE</h1>
            </div>
            
            <div className="space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-4xl font-black text-[#1f1b12] leading-tight">
                  Setup your <br/>
                  <span className="text-[#903f00]">Profile.</span>
                </h2>
                <p className="text-[#564338] font-bold italic opacity-60 leading-relaxed">
                  Create your professional identity to connect with potential co-founders.
                </p>
              </motion.div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#903f00]">Progress</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1f1b12]">{step === 1 ? '50%' : '100%'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#564338]/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: step === 1 ? '50%' : '100%' }}
                      className="h-full bg-[#903f00] rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2 h-2 rounded-full", step >= 1 ? "bg-[#903f00]" : "bg-[#564338]/20")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", step >= 1 ? "text-[#1f1b12]" : "text-[#564338]/40")}>Identity</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2 h-2 rounded-full", step >= 2 ? "bg-[#903f00]" : "bg-[#564338]/20")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", step >= 2 ? "text-[#1f1b12]" : "text-[#564338]/40")}>Profile Details</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Form Interface */}
        <div className="lg:col-span-8 bg-white rounded-[3rem] shadow-[0px_40px_80px_rgba(17,17,17,0.06)] border border-[#111111]/5 flex flex-col overflow-hidden">
          <div className="p-10 flex-1">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#1f1b12]">Basic Info</h3>
                    <p className="text-sm font-bold text-[#564338]/60">How should the community recognize you?</p>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-[#fcf3e3] flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-[#903f00]" />
                        )}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-[#1f1b12] text-white rounded-full shadow-lg hover:bg-[#903f00] transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Full Name</label>
                      <Input 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="bg-[#fcf3e3]/30 border-none h-14 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#564338]/40 font-bold">@</span>
                        <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="username"
                          className="bg-[#fcf3e3]/30 border-none h-14 pl-10 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {isCheckingUsername ? <Loader2 className="w-4 h-4 animate-spin text-[#903f00]" /> : 
                           usernameStatus === 'available' ? <Check className="w-4 h-4 text-emerald-500" /> :
                           usernameStatus === 'taken' ? <X className="w-4 h-4 text-rose-500" /> : null}
                        </div>
                      </div>
                      {usernameStatus === 'taken' && <p className="text-[10px] text-rose-500 font-bold ml-2">This username is already claimed.</p>}
                    </div>
                  </div>

                  <Button 
                    onClick={handleNext}
                    disabled={!displayName.trim() || usernameStatus !== 'available'}
                    className="w-full bg-[#1f1b12] text-white h-16 rounded-2xl font-black text-lg hover:bg-[#903f00] transition-all shadow-xl mt-8"
                  >
                    Continue <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#1f1b12]">Professional Bio</h3>
                    <p className="text-sm font-bold text-[#564338]/60">Tell the world what you're building.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Bio</label>
                      <Textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Write a short bio like Instagram..."
                        className="bg-[#fcf3e3]/30 border-none min-h-[100px] rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Primary Role</label>
                        <select 
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-[#fcf3e3]/30 border-none h-14 px-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#903f00] font-bold outline-none appearance-none"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Work Style</label>
                        <select 
                          value={workStyle}
                          onChange={(e) => setWorkStyle(e.target.value)}
                          className="w-full bg-[#fcf3e3]/30 border-none h-14 px-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#903f00] font-bold outline-none appearance-none"
                        >
                          <option value="Collaborative">Collaborative</option>
                          <option value="Independent">Independent</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Async-First">Async-First</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Skills (comma separated)</label>
                      <Input 
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="React, UI Design, Marketing..."
                        className="bg-[#fcf3e3]/30 border-none h-14 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Interests (comma separated)</label>
                      <Input 
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="AI, FinTech, Sustainability..."
                        className="bg-[#fcf3e3]/30 border-none h-14 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Looking For</label>
                      <Input 
                        value={lookingFor}
                        onChange={(e) => setLookingFor(e.target.value)}
                        placeholder="e.g. Technical Co-founder with AI expertise"
                        className="bg-[#fcf3e3]/30 border-none h-14 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="flex-1 h-16 rounded-2xl font-black text-[#564338] hover:bg-[#fcf3e3]"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleNext}
                      disabled={isProcessing}
                      className="flex-[2] bg-[#1f1b12] text-white h-16 rounded-2xl font-black text-lg hover:bg-[#903f00] transition-all shadow-xl"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
