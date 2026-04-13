import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Rocket, 
  ArrowRight, 
  Search, 
  BarChart3, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Plus,
  Download,
  Share2,
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { validateIdea, ValidationResult } from '../services/validationService';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function IdeaValidation() {
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [geography, setGeography] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !targetAudience || !revenueModel || !geography) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsValidating(true);
    try {
      const data = await validateIdea(description, targetAudience, revenueModel, geography);
      setResult(data);
      toast.success("Idea validated successfully!");
    } catch (error: any) {
      console.error("Validation error:", error);
      toast.error(error.message || "Failed to validate idea. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const radarData = result ? [
    { subject: 'Competition', A: result.competition.score, fullMark: 10 },
    { subject: 'Demand', A: result.demand.score, fullMark: 10 },
    { subject: 'Monetization', A: result.monetization.score, fullMark: 10 },
    { subject: 'Risks', A: result.risks.score, fullMark: 10 },
    { subject: 'Future', A: result.future.score, fullMark: 10 },
  ] : [];

  return (
    <div className="min-h-screen bg-[#fff8f1] flex">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-black text-[#1f1b12] tracking-tight">Idea Validation Tool</h1>
            <p className="text-xs font-bold text-[#903f00] uppercase tracking-widest mt-1">Data-driven analysis for your next big thing</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-[#111111]/5 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-[#fcf3e3]/30 border-b border-[#111111]/5">
                  <CardTitle className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Idea Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleValidate} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#564338]/60 uppercase tracking-widest">Idea Description</label>
                      <Textarea 
                        placeholder="e.g. AI-powered CapCut alternative for student Reels creators"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px] border-[#111111]/5 focus:border-[#903f00] focus:ring-[#903f00]/10 rounded-2xl font-medium text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#564338]/60 uppercase tracking-widest">Target Audience</label>
                      <Input 
                        placeholder="e.g. Indian students aged 15-20 making Instagram Reels"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="border-[#111111]/5 focus:border-[#903f00] focus:ring-[#903f00]/10 rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#564338]/60 uppercase tracking-widest">Revenue Model</label>
                      <Input 
                        placeholder="e.g. Freemium with ₹199/month premium"
                        value={revenueModel}
                        onChange={(e) => setRevenueModel(e.target.value)}
                        className="border-[#111111]/5 focus:border-[#903f00] focus:ring-[#903f00]/10 rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#564338]/60 uppercase tracking-widest">Geography</label>
                      <Input 
                        placeholder="e.g. India-first, expand to Southeast Asia"
                        value={geography}
                        onChange={(e) => setGeography(e.target.value)}
                        className="border-[#111111]/5 focus:border-[#903f00] focus:ring-[#903f00]/10 rounded-xl font-bold"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isValidating}
                      className="w-full bg-[#903f00] hover:bg-[#7a3500] text-white font-black uppercase tracking-widest py-6 rounded-2xl shadow-xl shadow-[#903f00]/20"
                    >
                      {isValidating ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Analyzing...</span>
                        </div>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Validate Idea
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {!result && !isValidating && (
                <div className="p-8 border-2 border-dashed border-[#111111]/5 rounded-3xl bg-[#fcf3e3]/10 text-center">
                  <BarChart3 className="w-12 h-12 text-[#903f00]/20 mx-auto mb-4" />
                  <p className="text-sm font-bold text-[#564338]/40 uppercase tracking-widest">Enter your idea details to generate a validation report</p>
                </div>
              )}
            </div>

            {/* Analysis Report */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Visual Dashboard */}
                    <Card className="border-[#111111]/5 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="bg-[#fcf3e3]/30 border-b border-[#111111]/5 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                          <BarChart3 className="w-3 h-3" />
                          Validation Dashboard
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#564338]/40 hover:text-[#903f00]">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#564338]/40 hover:text-[#903f00]">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e5e5e5" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#564338', fontSize: 10, fontWeight: 800 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar
                                  name="Validation"
                                  dataKey="A"
                                  stroke="#903f00"
                                  fill="#903f00"
                                  fillOpacity={0.5}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-4">
                            <div className="p-6 rounded-3xl bg-[#1f1b12] text-white text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#903f00] mb-1">Overall Score</p>
                              <p className="text-5xl font-black">{result.score}/10</p>
                              {result.score >= 8 && (
                                <Badge className="mt-4 bg-green-500 text-white font-black uppercase tracking-widest text-[8px]">
                                  Validated Idea
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-2xl bg-[#fcf3e3]/50 border border-[#903f00]/10">
                                <p className="text-[8px] font-black text-[#564338]/40 uppercase tracking-widest">Competition</p>
                                <p className="text-sm font-black text-[#903f00]">{result.competition.score}/10</p>
                              </div>
                              <div className="p-3 rounded-2xl bg-[#fcf3e3]/50 border border-[#903f00]/10">
                                <p className="text-[8px] font-black text-[#564338]/40 uppercase tracking-widest">Demand</p>
                                <p className="text-sm font-black text-[#903f00]">{result.demand.score}/10</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-[#111111]/5 shadow-sm bg-white">
                        <CardHeader className="p-4 border-b border-[#111111]/5">
                          <CardTitle className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                            <Search className="w-3 h-3" />
                            Market Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-[#564338]/40 uppercase tracking-widest mb-1">Competition</p>
                            <p className="text-xs text-[#564338] leading-relaxed">{result.competition.analysis}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[#564338]/40 uppercase tracking-widest mb-1">Demand</p>
                            <p className="text-xs text-[#564338] leading-relaxed">{result.demand.analysis}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-[#111111]/5 shadow-sm bg-white">
                        <CardHeader className="p-4 border-b border-[#111111]/5">
                          <CardTitle className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            Financial & Risk
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-[#564338]/40 uppercase tracking-widest mb-1">Monetization</p>
                            <p className="text-xs text-[#564338] leading-relaxed">{result.monetization.analysis}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[#564338]/40 uppercase tracking-widest mb-1">Risks</p>
                            <p className="text-xs text-[#564338] leading-relaxed">{result.risks.analysis}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recommendations & Learning */}
                    <Card className="border-[#111111]/5 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="bg-[#fcf3e3]/30 border-b border-[#111111]/5">
                        <CardTitle className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                          <Target className="w-3 h-3" />
                          Strategic Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-[#1f1b12] uppercase tracking-widest">Key Suggestions</h4>
                            <ul className="space-y-3">
                              {result.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-3 text-xs text-[#564338] leading-relaxed">
                                  <div className="w-5 h-5 rounded-full bg-[#fcf3e3] flex items-center justify-center text-[10px] font-black text-[#903f00] shrink-0">
                                    {i + 1}
                                  </div>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-[#1f1b12] uppercase tracking-widest">Learning Paths</h4>
                            <div className="space-y-3">
                              {result.competition.score < 7 && (
                                <div className="p-4 rounded-2xl border border-[#903f00]/10 bg-orange-50/30 flex items-center justify-between group cursor-pointer hover:bg-orange-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <BookOpen className="w-4 h-4 text-[#903f00]" />
                                    <div>
                                      <p className="text-xs font-bold text-[#1f1b12]">Market Research Masterclass</p>
                                      <p className="text-[10px] text-[#564338]/60">Strengthen your competitive edge</p>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-[#564338]/40 group-hover:translate-x-1 transition-transform" />
                                </div>
                              )}
                              {result.monetization.score < 7 && (
                                <div className="p-4 rounded-2xl border border-[#903f00]/10 bg-orange-50/30 flex items-center justify-between group cursor-pointer hover:bg-orange-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <TrendingUp className="w-4 h-4 text-[#903f00]" />
                                    <div>
                                      <p className="text-xs font-bold text-[#1f1b12]">SaaS Pricing Strategies</p>
                                      <p className="text-[10px] text-[#564338]/60">Optimize your revenue model</p>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-[#564338]/40 group-hover:translate-x-1 transition-transform" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Competitors & Next Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-[#111111]/5 shadow-sm bg-white">
                        <CardHeader className="p-4 border-b border-[#111111]/5">
                          <CardTitle className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            Top Competitors
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {result.competitors.map((comp, i) => (
                              <div key={i} className="p-3 rounded-2xl border border-[#111111]/5 hover:border-[#903f00]/20 transition-all bg-white flex items-center justify-between group">
                                <div>
                                  <p className="text-xs font-bold text-[#1f1b12]">{comp.name}</p>
                                  <p className="text-[10px] text-[#564338]/60 line-clamp-1">{comp.description}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-[#564338]/40 group-hover:text-[#903f00]"
                                  onClick={() => window.open(comp.link.startsWith('http') ? comp.link : `https://${comp.link}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-[#111111]/5 shadow-sm bg-[#1f1b12] text-white">
                        <CardHeader className="p-4 border-b border-white/5">
                          <CardTitle className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                            <Rocket className="w-3 h-3" />
                            Next Steps
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {result.nextSteps.map((step, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#903f00]" />
                                <p className="text-xs font-bold text-white/80">{step}</p>
                              </div>
                            ))}
                            <div className="pt-4">
                              <Button asChild className="w-full bg-[#903f00] hover:bg-[#7a3500] text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">
                                <Link to="/create-idea">
                                  Start Project
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                ) : isValidating ? (
                  <div className="h-full flex flex-col items-center justify-center py-24 space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-[#903f00]/10 border-t-[#903f00] rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-[#903f00] animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-[#1f1b12] tracking-tight">Forging Analysis...</h3>
                      <p className="text-sm font-bold text-[#564338]/40 uppercase tracking-widest">Scanning market data, trends, and competitors</p>
                    </div>
                    <div className="max-w-xs w-full space-y-4 pt-8">
                      {[
                        "Analyzing competitive landscape...",
                        "Evaluating market demand...",
                        "Assessing monetization potential...",
                        "Checking technical feasibility..."
                      ].map((text, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.5 }}
                          className="flex items-center gap-3 text-[10px] font-bold text-[#564338]/60 uppercase tracking-widest"
                        >
                          <ShieldCheck className="w-3 h-3 text-green-500" />
                          {text}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
