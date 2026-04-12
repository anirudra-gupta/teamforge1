import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Sparkles as SparklesIcon, 
  ArrowRight as ArrowRightIcon, 
  Bookmark as BookmarkIcon, 
  TrendingUp as TrendingUpIcon,
  Zap
} from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { cn } from '../lib/utils';

export default function IdeaHub() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Concepts');

  useEffect(() => {
    const q = query(collection(db, 'ideas'), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const categories = ['All Concepts', 'SaaS', 'AI & ML', 'FinTech', 'Clean Energy'];

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (idea.tagline || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeCategory === 'All Concepts') return matchesSearch;
    return matchesSearch && idea.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-[#fff8f1] flex">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-12">
        {/* Hero Section */}
        <header className="mb-16 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#903f00]/10 rounded-full mb-8"
          >
            <Zap className="w-4 h-4 text-[#903f00] fill-[#903f00]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#903f00] font-headline">Idea Hub</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-black tracking-tighter text-[#1f1b12] mb-8 leading-[1.05]"
          >
            Where visionary <span className="text-[#903f00] italic">concepts</span> meet their founding teams.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#564338] font-bold italic opacity-60 leading-relaxed max-w-2xl"
          >
            Explore the next generation of digital infrastructure, creative tools, and impact-driven startups. Curated, vetted, and ready for execution.
          </motion.p>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300",
                  activeCategory === cat 
                    ? "bg-[#1f1b12] text-white shadow-xl shadow-[#1f1b12]/10" 
                    : "bg-white text-[#564338] hover:bg-[#f6edde] border border-[#111111]/5"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-72">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#564338]/40 w-4 h-4" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search concepts..."
              className="pl-12 bg-white border-[#111111]/5 h-12 rounded-2xl shadow-sm focus-visible:ring-[#903f00] font-bold text-sm"
            />
          </div>
        </div>

        {/* Idea Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIdeas.map((idea, index) => {
            const isFeatured = index === 0 && activeCategory === 'All Concepts';
            
            if (isFeatured) {
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-2 group relative bg-white rounded-[3rem] p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0px_40px_80px_rgba(17,17,17,0.08)] flex flex-col md:flex-row gap-10 overflow-hidden border border-[#111111]/5"
                >
                  <div className="flex-1 flex flex-col justify-between relative z-10">
                    <div>
                      <div className="flex justify-between items-start mb-8">
                        <span className="px-4 py-1.5 bg-[#ffdbca] text-[#331200] text-[10px] font-black uppercase tracking-widest rounded-full">
                          {idea.stage || 'Pre-Seed'}
                        </span>
                        <button className="text-[#564338]/20 hover:text-[#903f00] transition-colors">
                          <BookmarkIcon className="w-6 h-6" />
                        </button>
                      </div>
                      <h3 className="text-4xl font-black text-[#1f1b12] mb-4 tracking-tight leading-tight group-hover:text-[#903f00] transition-colors">
                        {idea.title}
                      </h3>
                      <p className="text-lg text-[#564338] font-bold italic opacity-60 mb-8 leading-relaxed">
                        {idea.tagline || idea.problem}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-10">
                        {(idea.tags || ['SaaS', 'AI-Ops', 'React']).map((tag: string, idx: number) => (
                          <span key={`${tag}-${idx}`} className="px-4 py-1.5 bg-[#f6edde] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#564338]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-[#111111]/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarImage src={idea.founderPhoto} />
                          <AvatarFallback className="bg-[#903f00] text-white font-bold">
                            {idea.founderName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#564338]/40">Founder</p>
                          <p className="text-sm font-black text-[#1f1b12]">{idea.founderName}</p>
                        </div>
                      </div>
                      <Link to={`/idea/${idea.id}`}>
                        <Button className="bg-[#1f1b12] hover:bg-[#903f00] text-white px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-[#1f1b12]/10 active:scale-95">
                          Join Startup
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="hidden md:block w-2/5 rounded-[2rem] overflow-hidden relative">
                    <img 
                      src={`https://picsum.photos/seed/${idea.id}/600/800`} 
                      alt="Concept Visual" 
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b12]/20 to-transparent"></div>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[3rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0px_40px_80px_rgba(17,17,17,0.08)] flex flex-col border border-[#111111]/5"
              >
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-8">
                    <span className="px-4 py-1.5 bg-[#fcf3e3] text-[#903f00] text-[10px] font-black uppercase tracking-widest rounded-full">
                      {idea.stage || 'Idea Stage'}
                    </span>
                    <button className="text-[#564338]/20 hover:text-[#903f00] transition-colors">
                      <BookmarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-[#1f1b12] mb-4 tracking-tight leading-tight group-hover:text-[#903f00] transition-colors">
                    {idea.title}
                  </h3>
                  <p className="text-sm text-[#564338] font-bold italic opacity-60 mb-8 leading-relaxed line-clamp-3">
                    {idea.tagline || idea.problem}
                  </p>
                </div>
                
                <div className="mt-auto space-y-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#564338]/40 mb-4">Skills Needed</p>
                    <div className="flex flex-wrap gap-2">
                      {(idea.neededSkills || ['Product Design', 'Growth']).slice(0, 3).map((skill: string, idx: number) => (
                        <span key={`${skill}-${idx}`} className="text-xs font-bold text-[#1f1b12] bg-[#f6edde] px-3 py-1 rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link to={`/idea/${idea.id}`}>
                    <Button variant="outline" className="w-full py-6 border-2 border-[#903f00]/10 text-[#903f00] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#903f00] hover:text-white transition-all active:scale-95">
                      View Idea
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}

          {/* Community Pick Accent Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#903f00] rounded-[3rem] p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0px_40px_80px_rgba(144,63,0,0.2)] overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#903f00] to-[#b45309] opacity-90"></div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUpIcon className="w-4 h-4 text-white/60" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Community Pick</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">DeepHealth VR</h3>
              <p className="text-white/70 font-bold italic leading-relaxed mb-10">
                Virtual reality environments designed specifically for cognitive therapy and trauma recovery sessions.
              </p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-white/60 font-black text-[10px] uppercase tracking-widest">Active Discussions: 14</span>
                <ArrowRightIcon className="text-white w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <section className="mt-24 bg-[#f6edde] rounded-[4rem] p-16 md:p-24 text-center relative overflow-hidden border border-[#111111]/5">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-[#1f1b12] mb-8 tracking-tighter">Have a world-changing idea?</h2>
            <p className="text-xl text-[#564338] font-bold italic opacity-60 mb-12 leading-relaxed">
              Submit your concept to our studio and find the technical partners you need to build the future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create-idea">
                <Button className="bg-[#1f1b12] text-white px-10 py-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#903f00] transition-all shadow-2xl shadow-[#1f1b12]/20 active:scale-95">
                  Forge New Idea
                </Button>
              </Link>
              <Button variant="outline" className="bg-white border-none px-10 py-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#fcf3e3] transition-all">
                Explore Manifesto
              </Button>
            </div>
          </div>
          {/* Decorative Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#903f00]/5 rounded-full blur-[120px] -z-0"></div>
        </section>
      </main>

      {/* AI Aura Floating Utility */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <div className="bg-white/70 backdrop-blur-2xl p-4 rounded-[2rem] shadow-[0px_40px_80px_rgba(144,63,0,0.15)] border border-white flex items-center gap-4 group cursor-pointer hover:scale-105 transition-all">
          <div className="w-12 h-12 bg-[#903f00] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#903f00]/20 group-hover:rotate-12 transition-transform">
            <SparklesIcon className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#903f00]">Forge AI</p>
            <p className="text-xs font-black text-[#1f1b12]">Match me with an idea</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
