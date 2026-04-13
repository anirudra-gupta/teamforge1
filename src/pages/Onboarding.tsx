import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { generateUserProfile } from '../lib/gemini';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Logo } from '../components/Logo';
import { Send, User, Loader2, Sparkles, Check, X, ArrowRight, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const STEPS = [
  { id: 'name', label: 'Identity', question: "First, let's establish your identity. What's your full name and what would you like your unique @username to be?" },
  { id: 'skills', label: 'Expertise', question: "What are your core competencies? (e.g., React, UI Design, Growth Marketing, Backend Architecture)" },
  { id: 'interests', label: 'Interests', question: "What industries or problems are you most passionate about solving?" },
  { id: 'projects', label: 'Experience', question: "Walk me through your last project—what worked and what didn't?" },
  { id: 'mindset', label: 'Mindset', question: "How do you handle disagreements in a team setting? And what's the biggest challenge you've faced building something from scratch?" },
  { id: 'goal', label: 'Vision', question: "What type of co-founder would complement your work style? (e.g., 'I prefer async work', 'I need a highly motivated partner')" }
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: 'bot' | 'user', content: string, type?: string }[]>([
    { role: 'bot', content: "Welcome to the Forge. I am your AI architect. Let's begin by defining your professional blueprint." },
    { role: 'bot', content: STEPS[0].question, type: 'identity' }
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleSend = async () => {
    if (isProcessing) return;

    if (currentStepIndex === 0) {
      if (!displayName.trim() || usernameStatus !== 'available') {
        toast.error("Please provide a valid name and an available username.");
        return;
      }
      const userMessage = `My name is ${displayName} and I'll use @${username}.`;
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      proceedToNextStep();
    } else {
      if (!input.trim()) return;
      const userMessage = input.trim();
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      proceedToNextStep(userMessage);
    }
  };

  const proceedToNextStep = (lastAnswer?: string) => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: STEPS[nextIndex].question }]);
      }, 600);
    } else {
      finalizeOnboarding(lastAnswer);
    }
  };

  const finalizeOnboarding = async (lastAnswer?: string) => {
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'bot', content: "Incredible. I am now synthesizing your responses to forge your unique founder profile. This process requires precision..." }]);
    
    try {
      const answers = messages
        .filter(m => m.role === 'user')
        .map(m => m.content);
      if (lastAnswer) answers.push(lastAnswer);

      console.log("Generating profile with answers:", answers);
      if (answers.length === 0) {
        throw new Error("No responses found to synthesize. Please answer the questions.");
      }

      const aiProfile = await generateUserProfile(answers);
      console.log("AI Profile generated:", aiProfile);
      
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
        
        console.log("Saving User Data:", userDataPayload);
        try {
          await setDoc(doc(db, 'users', user.uid), userDataPayload);
        } catch (err) {
          console.error("Error saving user data:", err);
          handleFirestoreError(err, OperationType.WRITE, userPath);
        }

        // Save public profile
        const profilePath = `profiles/${user.uid}`;
        const profileDataPayload = {
          uid: user.uid,
          username: username.toLowerCase(),
          displayName: finalDisplayName,
          photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
          bio: aiProfile.bio || "A visionary founder on TeamForge.",
          skills: aiProfile.skills || [],
          interests: aiProfile.interests || [],
          role: aiProfile.role || "Founder",
          personality: aiProfile.personality || "Determined",
          mindsetTraits: aiProfile.mindsetTraits || [],
          knowledgeGaps: aiProfile.knowledgeGaps || [],
          badges: aiProfile.badges || [],
          workStyle: aiProfile.workStyle || "Collaborative",
          recommendations: aiProfile.recommendations || "Join a high-growth startup.",
          lookingFor: aiProfile.lookingFor || "Complementary co-founders.",
          updatedAt: new Date().toISOString()
        };

        console.log("Saving Profile Data:", profileDataPayload);
        try {
          await setDoc(doc(db, 'profiles', user.uid), profileDataPayload);
        } catch (err) {
          console.error("Error saving profile data:", err);
          handleFirestoreError(err, OperationType.WRITE, profilePath);
        }

        toast.success("Identity forged. Welcome to the network.");
        navigate('/dashboard');
      } else {
        throw new Error("User session not found. Please log in again.");
      }
    } catch (error) {
      console.error("Onboarding failed:", error);
      let errorMessage = "The synthesis failed. Please try again.";
      
      if (error instanceof Error) {
        const errorText = error.message;
        if (errorText.includes('API key not valid') || errorText.includes('API_KEY_INVALID')) {
          errorMessage = "The Gemini API key is invalid or missing. Please ensure you have configured GEMINI_API_KEY in the Secrets panel.";
        } else if (errorText.includes('insufficient permissions')) {
          errorMessage = "Database permission error. Please contact support.";
        } else if (errorText.includes('tokens limit')) {
          errorMessage = "AI synthesis limit reached. Please try with shorter answers.";
        } else {
          errorMessage = errorText;
        }
      }
      
      toast.error(errorMessage);
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
      {/* Hidden Debug Trigger: Click the Logo 5 times */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={checkHealth}
          className="text-[8px] opacity-10 hover:opacity-100 font-black uppercase tracking-widest"
        >
          Debug Backend
        </Button>
      </div>
      
      {debugInfo && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-lg w-full">
            <h3 className="text-xl font-black mb-4">Debug Info</h3>
            <pre className="bg-gray-100 p-4 rounded-xl text-xs overflow-auto max-h-[400px]">
              {debugInfo}
            </pre>
            <Button onClick={() => setDebugInfo(null)} className="mt-6 w-full bg-[#1f1b12] text-white rounded-xl font-bold">
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
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
                  Forge your <br/>
                  <span className="text-[#903f00]">Creative Core.</span>
                </h2>
                <p className="text-[#564338] font-bold italic opacity-60 leading-relaxed">
                  Our AI architect learns from your unique blend of skills to build the foundation of your digital venture.
                </p>
              </motion.div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#903f00]">Progress</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1f1b12]">{Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#564338]/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
                      className="h-full bg-[#903f00] rounded-full"
                    />
                  </div>
                </div>

                {STEPS.map((step, idx) => (
                  <motion.div 
                    key={step.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.05) }}
                    className="flex items-center gap-4 group"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all duration-500",
                      idx < currentStepIndex ? "bg-[#903f00] scale-125" : 
                      idx === currentStepIndex ? "bg-[#903f00] animate-pulse scale-150" : "bg-[#564338]/20"
                    )} />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                      idx <= currentStepIndex ? "text-[#1f1b12]" : "text-[#564338]/40"
                    )}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-12 border-t border-[#111111]/5"
          >
            <div className="flex items-center gap-3 p-4 bg-[#fcf3e3] rounded-2xl border border-[#903f00]/10">
              <Sparkles className="w-5 h-5 text-[#903f00]" />
              <p className="text-[10px] font-black text-[#903f00] uppercase tracking-widest">AI Synthesis Active</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Panel: Chat Interface */}
        <div className="lg:col-span-8 bg-white rounded-[3rem] shadow-[0px_40px_80px_rgba(17,17,17,0.06)] border border-[#111111]/5 flex flex-col overflow-hidden h-[800px] max-h-[90vh] min-h-[500px]">
          {/* Chat Header */}
          <div className="p-8 border-b border-[#111111]/5 flex items-center justify-between bg-[#fcf3e3]/30 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1f1b12] rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-[#1f1b12] tracking-tight">AI Architect</h3>
                <p className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest">Synthesis Engine v3.0</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-[#111111]/5 shadow-sm">
              <span className="text-[10px] font-black text-[#1f1b12] uppercase tracking-widest">Step {currentStepIndex + 1} / {STEPS.length}</span>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-0 p-8" viewportRef={scrollRef}>
            <div className="max-w-2xl mx-auto space-y-8">
              <AnimatePresence mode="popLayout">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={cn(
                      "flex gap-4",
                      m.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      m.role === 'bot' ? "bg-[#fcf3e3] text-[#903f00]" : "bg-[#1f1b12] text-white"
                    )}>
                      {m.role === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className={cn(
                      "max-w-[85%] p-6 rounded-[2rem] text-sm font-bold leading-relaxed shadow-sm",
                      m.role === 'bot' 
                        ? "bg-[#fcf3e3]/50 text-[#1f1b12] rounded-tl-none border border-[#903f00]/5" 
                        : "bg-[#1f1b12] text-white rounded-tr-none shadow-xl"
                    )}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isProcessing && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#fcf3e3] text-[#903f00] flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-[#fcf3e3]/50 p-6 rounded-3xl rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#903f00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#903f00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#903f00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-8 bg-[#fcf3e3]/30 border-t border-[#111111]/5 shrink-0">
            <div className="max-w-2xl mx-auto">
              {currentStepIndex === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Full Name</label>
                      <Input 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-white border-none h-14 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#564338]/40 font-bold">@</span>
                        <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="johndoe"
                          className="bg-white border-none h-14 pl-10 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {isCheckingUsername ? <Loader2 className="w-4 h-4 animate-spin text-[#903f00]" /> : 
                           usernameStatus === 'available' ? <Check className="w-4 h-4 text-emerald-500" /> :
                           usernameStatus === 'taken' ? <X className="w-4 h-4 text-rose-500" /> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSend}
                    disabled={!displayName.trim() || usernameStatus !== 'available'}
                    className="w-full bg-[#1f1b12] text-white h-14 rounded-2xl font-black text-lg hover:bg-[#903f00] transition-all shadow-xl"
                  >
                    Confirm Identity <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative"
                >
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your response..."
                        disabled={isProcessing}
                        className="w-full bg-white border-none h-16 pl-6 pr-6 rounded-2xl shadow-xl focus-visible:ring-[#903f00] font-bold text-lg"
                      />
                    </div>
                    {(STEPS[currentStepIndex].id === 'skills' || STEPS[currentStepIndex].id === 'projects') && (
                      <Button
                        type="button"
                        onClick={() => {
                          const skipMsg = "Skip for now";
                          setMessages(prev => [...prev, { role: 'user', content: skipMsg }]);
                          proceedToNextStep(skipMsg);
                        }}
                        disabled={isProcessing}
                        variant="outline"
                        className="h-16 px-6 rounded-2xl border-2 border-[#1f1b12]/10 font-black text-[#564338] hover:bg-[#fcf3e3] transition-all"
                      >
                        Skip
                      </Button>
                    )}
                    <Button 
                      type="submit"
                      disabled={isProcessing || !input.trim()}
                      className="bg-[#1f1b12] text-white hover:bg-[#903f00] rounded-2xl px-8 h-16 font-black transition-all shadow-xl flex items-center gap-2"
                    >
                      <span>Send</span>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
                <div className="w-1 h-1 bg-[#564338] rounded-full" />
                <p className="text-[10px] font-black text-[#564338] uppercase tracking-widest">
                  Press Enter to transmit
                </p>
                <div className="w-1 h-1 bg-[#564338] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
