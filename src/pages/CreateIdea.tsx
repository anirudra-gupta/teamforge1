import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { validateIdea } from '../lib/gemini';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Rocket, Loader2, Sparkles, Lightbulb, BarChart3, Users, CreditCard, Plus, X, Star, AlertTriangle, TrendingUp, Target, DollarSign, ShieldAlert, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

export default function CreateIdea() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>(['Design', 'React', 'AI/ML']);
  const [newSkill, setNewSkill] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem: '',
    solution: '',
    targetAudience: '',
    revenueModel: '',
    geography: '',
    stage: 'Early Idea',
    equityExpectations: 'Equal Split'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Project title is required.";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Project description is required.";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters.";
    }

    if (skills.length === 0) {
      newErrors.technologies = "At least one technology/skill is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
      if (errors.technologies) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.technologies;
          return newErrors;
        });
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error("Please log in to forge your idea.");
      return;
    }
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setIsValidating(true);
    try {
      const validation = await validateIdea({
        title: formData.title,
        description: formData.description,
        problem: formData.problem,
        solution: formData.solution,
        targetAudience: formData.targetAudience,
        revenueModel: formData.revenueModel,
        geography: formData.geography
      });
      
      setValidationResult(validation);
      toast.success("AI Validation Complete!");
    } catch (error: any) {
      console.error("Failed to validate idea:", error);
      toast.error(error.message || "Validation failed. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!user || !profile || !validationResult) return;

    setIsValidating(true);
    try {
      const ideaPath = 'ideas';
      const ideaRef = await addDoc(collection(db, ideaPath), {
        ...formData,
        skills,
        founderId: user.uid,
        founderName: profile.displayName,
        status: 'published',
        aiValidation: validationResult,
        createdAt: serverTimestamp()
      });

      toast.success("Idea forged and launched!");
      navigate(`/idea/${ideaRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ideas');
      toast.error("Failed to launch idea.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] flex">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        <header className="mb-12">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#903f00] mb-4 block"
          >
            The Digital Atelier
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black text-[#1f1b12] tracking-tight mb-6 leading-none"
          >
            Forge Your <span className="text-[#903f00]">Next Big Idea</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#564338] max-w-2xl font-bold italic opacity-60"
          >
            Translate your intuition into a structured blueprint. We provide the tools; you provide the spark.
          </motion.p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Section 1: The Core */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 p-10 rounded-[2.5rem] bg-white border border-[#111111]/5 space-y-10 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-[#fcf3e3] rounded-2xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-[#903f00]" />
                </div>
                <h2 className="text-2xl font-black text-[#1f1b12]">Core Concept</h2>
              </div>
              
              <div className="space-y-10">
                <div className="group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-3 block">Idea Name</label>
                  <Input 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-[#fcf3e3]/30 border-none focus-visible:ring-[#903f00] h-14 rounded-2xl text-lg font-bold placeholder:text-[#564338]/20",
                      errors.title && "ring-2 ring-rose-500"
                    )} 
                    placeholder="e.g. EcoSphere AI" 
                  />
                  {errors.title && <p className="text-rose-500 text-[10px] font-bold mt-2 uppercase tracking-widest">{errors.title}</p>}
                </div>

                <div className="group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-3 block">Project Description</label>
                  <Textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-[#fcf3e3]/30 border-none focus-visible:ring-[#903f00] rounded-2xl text-lg font-bold placeholder:text-[#564338]/20 min-h-[100px] resize-none",
                      errors.description && "ring-2 ring-rose-500"
                    )} 
                    placeholder="A comprehensive overview of your project..." 
                  />
                  {errors.description && <p className="text-rose-500 text-[10px] font-bold mt-2 uppercase tracking-widest">{errors.description}</p>}
                </div>
                
                <div className="group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-3 block">The Problem (Optional)</label>
                  <Textarea 
                    name="problem"
                    value={formData.problem}
                    onChange={handleInputChange}
                    className="w-full bg-[#fcf3e3]/30 border-none focus-visible:ring-[#903f00] rounded-2xl text-lg font-bold placeholder:text-[#564338]/20 min-h-[100px] resize-none" 
                    placeholder="What friction exists in the world that you're solving?" 
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-3 block">The Solution (Optional)</label>
                  <Textarea 
                    name="solution"
                    value={formData.solution}
                    onChange={handleInputChange}
                    className="w-full bg-[#fcf3e3]/30 border-none focus-visible:ring-[#903f00] rounded-2xl text-lg font-bold placeholder:text-[#564338]/20 min-h-[100px] resize-none" 
                    placeholder="Describe your unique approach and the value it creates." 
                  />
                </div>
              </div>
            </motion.div>

            {/* Section 2: Market Fit */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-1 space-y-8"
            >
              <div className="p-10 rounded-[2.5rem] bg-[#fcf3e3] flex flex-col h-full border border-[#903f00]/5 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-6 h-6 text-[#903f00]" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1f1b12]">Market Fit</h2>
                </div>
                
                <div className="space-y-10 flex-grow">
                  <div className="group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-3 block">Target Audience</label>
                    <Input 
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleInputChange}
                      className="w-full bg-white border-none focus-visible:ring-[#903f00] h-12 rounded-xl text-sm font-bold placeholder:text-[#564338]/20" 
                      placeholder="Who is this for?" 
                    />
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-3 block">Geography</label>
                    <Input 
                      name="geography"
                      value={formData.geography}
                      onChange={handleInputChange}
                      className="w-full bg-white border-none focus-visible:ring-[#903f00] h-12 rounded-xl text-sm font-bold placeholder:text-[#564338]/20" 
                      placeholder="e.g. India-first, Global" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-5 block">Equity Expectations</label>
                    <div className="space-y-4">
                      {['Equal Split', 'Performance-based', 'Cash + Equity'].map((eq) => (
                        <label key={eq} className="flex items-center gap-4 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="equityExpectations"
                            value={eq}
                            checked={formData.equityExpectations === eq}
                            onChange={handleInputChange}
                            className="w-5 h-5 border-2 border-[#903f00]/20 text-[#903f00] focus:ring-[#903f00] bg-white transition-all cursor-pointer" 
                          />
                          <span className="text-sm font-bold text-[#564338] group-hover:text-[#1f1b12] transition-colors">{eq}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 3: Skills & Business Model */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className={cn(
                "p-10 rounded-[2.5rem] bg-white border border-[#111111]/5 shadow-xl",
                errors.technologies && "ring-2 ring-rose-500"
              )}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-[#fcf3e3] rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#903f00]" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1f1b12]">Technologies & Skills</h2>
                </div>
                {errors.technologies && <p className="text-rose-500 text-[10px] font-bold mb-4 uppercase tracking-widest">{errors.technologies}</p>}
                <div className="flex flex-wrap gap-2 mb-6">
                  {skills.map(skill => (
                    <span key={skill} className="bg-[#fcf3e3] px-4 py-2 rounded-xl text-xs font-bold text-[#903f00] flex items-center gap-2 border border-[#903f00]/10">
                      {skill}
                      <X className="w-3 h-3 cursor-pointer hover:text-[#1f1b12] transition-colors" onClick={() => removeSkill(skill)} />
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    className="bg-[#fcf3e3]/30 border-none rounded-xl h-12 text-sm font-bold focus-visible:ring-[#903f00]"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button 
                    type="button"
                    onClick={addSkill}
                    className="bg-[#1f1b12] text-white hover:bg-[#903f00] rounded-xl h-12 px-6 font-bold text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-white border border-[#111111]/5 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-[#fcf3e3] rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-[#903f00]" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1f1b12]">Business Model</h2>
                </div>
                <div className="group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-3 block">Revenue Model</label>
                  <Input 
                    name="revenueModel"
                    value={formData.revenueModel}
                    onChange={handleInputChange}
                    className="w-full bg-[#fcf3e3]/30 border-none focus-visible:ring-[#903f00] h-14 rounded-2xl text-lg font-bold placeholder:text-[#564338]/20" 
                    placeholder="e.g. Freemium, SaaS, Marketplace" 
                  />
                </div>
                <div className="mt-8">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#564338] mb-5 block">Current Stage</label>
                  <div className="flex flex-wrap gap-4">
                    {['Early Idea', 'MVP Build', 'Scaling Phase'].map((stage) => (
                      <label key={stage} className="flex items-center gap-4 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="stage"
                          value={stage}
                          checked={formData.stage === stage}
                          onChange={handleInputChange}
                          className="w-5 h-5 border-2 border-[#903f00]/20 text-[#903f00] focus:ring-[#903f00] bg-white transition-all cursor-pointer" 
                        />
                        <span className="text-sm font-bold text-[#564338] group-hover:text-[#1f1b12] transition-colors">{stage}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-[#903f00]/10"
          >
            <div className="flex items-center gap-4 text-[#564338]">
              <Sparkles className="w-6 h-6 text-[#903f00]" />
              <p className="text-sm font-bold italic opacity-60">"Precision is the foundation of excellence."</p>
            </div>
            <div className="flex items-center gap-6">
              <button 
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm font-bold text-[#564338] hover:text-[#903f00] transition-colors px-6 py-3"
              >
                Cancel
              </button>
              {!validationResult ? (
                <div className="flex flex-col items-end gap-2">
                  <Button 
                    type="submit" 
                    disabled={isValidating}
                    className="bg-[#1f1b12] text-white px-12 py-8 rounded-2xl font-black shadow-2xl hover:bg-[#903f00] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 h-auto text-lg"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        Validate Idea
                        <Sparkles className="w-6 h-6" />
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest">AI Validation Required to Launch</p>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <Button 
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isValidating}
                    className="bg-[#903f00] text-white px-12 py-8 rounded-2xl font-black shadow-2xl hover:bg-[#1f1b12] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 h-auto text-lg ring-4 ring-[#903f00]/20"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        Launch Idea
                        <Rocket className="w-6 h-6" />
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Validation Passed! Ready to Launch</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Validation Results Section */}
          {validationResult && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-[#1f1b12] flex items-center gap-3">
                    <Sparkles className="w-10 h-10 text-[#903f00]" />
                    AI Validation Report
                  </h2>
                  <p className="text-[#564338] font-bold mt-2 opacity-60">A deep analysis of your vision's viability and market potential.</p>
                </div>
                <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[2rem] border border-[#903f00]/10 shadow-xl">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#564338]/40 uppercase tracking-widest">Viability Score</p>
                    <p className="text-2xl font-black text-[#903f00]">{validationResult.score}%</p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "w-6 h-6",
                          i < Math.round(validationResult.score / 20) ? "text-[#903f00] fill-[#903f00]" : "text-[#903f00]/20"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="strengths" className="border border-[#111111]/5 rounded-[2rem] bg-white shadow-sm overflow-hidden px-6">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="text-xl font-black text-[#1f1b12]">Core Strengths</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {validationResult.strengths.map((s: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                              <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                              <p className="text-sm text-[#564338] font-bold leading-relaxed">{s}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="weaknesses" className="border border-[#111111]/5 rounded-[2rem] bg-white shadow-sm overflow-hidden px-6">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                          </div>
                          <span className="text-xl font-black text-[#1f1b12]">Potential Risks</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {validationResult.weaknesses.map((w: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                              <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                              <p className="text-sm text-[#564338] font-bold leading-relaxed">{w}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="suggestions" className="border border-[#111111]/5 rounded-[2rem] bg-white shadow-sm overflow-hidden px-6">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-xl font-black text-[#1f1b12]">Strategic Suggestions</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {validationResult.suggestions.map((s: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/50">
                              <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                              <p className="text-sm text-[#564338] font-bold leading-relaxed">{s}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="bg-[#fcf3e3] p-10 rounded-[2.5rem] border border-[#903f00]/10">
                    <h3 className="text-2xl font-black text-[#1f1b12] mb-10 flex items-center gap-3">
                      <BarChart3 className="w-7 h-7 text-[#903f00]" />
                      Metric Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      {[
                        { label: 'Competition', key: 'competition', icon: Target },
                        { label: 'Demand', key: 'demand', icon: Users },
                        { label: 'Monetization', key: 'monetization', icon: DollarSign },
                        { label: 'Risks', key: 'risks', icon: ShieldAlert },
                        { label: 'Future Potential', key: 'futurePotential', icon: TrendingUp }
                      ].map((metric) => (
                        <div key={metric.key} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm font-black text-[#1f1b12]">
                              <metric.icon className="w-4 h-4 text-[#903f00]" />
                              {metric.label}
                            </div>
                            <span className="text-sm font-black text-[#903f00]">{validationResult.metrics[metric.key]}/10</span>
                          </div>
                          <div className="h-3 w-full bg-white rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${validationResult.metrics[metric.key] * 10}%` }}
                              className="h-full bg-[#903f00] rounded-full shadow-lg"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <Card className="bg-[#1f1b12] border-none rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
                        <Users className="w-6 h-6 text-[#903f00]" /> Top Competitors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                      <div className="flex flex-wrap gap-3">
                        {validationResult.competitors.map((c: string, i: number) => (
                          <span key={i} className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/5">
                            {c}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-white p-10 rounded-[2.5rem] border border-[#111111]/5 shadow-xl">
                    <h3 className="text-xl font-black text-[#1f1b12] mb-8">Next Steps</h3>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-[#564338] font-bold leading-relaxed">Validate with 50 user interviews to refine target audience insights.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-[#564338] font-bold leading-relaxed">Build a landing page for signups to gauge early demand.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </main>
    </div>
  );
}


