import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { db, sendNotification } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDoc, doc, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { rankCoFounderMatches } from '../lib/gemini';
import { toast } from 'sonner';
import { 
  Rocket, 
  Users, 
  Lightbulb, 
  ArrowRight, 
  Plus, 
  Star, 
  TrendingUp, 
  UserPlus, 
  Mail, 
  Settings2,
  Sparkles,
  Waves,
  Activity,
  Loader2
} from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [myIdeas, setMyIdeas] = useState<any[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [featuredIdeas, setFeaturedIdeas] = useState<any[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const isProfileIncomplete = !profile?.skills?.length || !profile?.interests?.length || !profile?.lookingFor;

  const FILTERS = [
    { name: 'All', icon: Activity },
    { name: 'Technical', icon: Settings2 },
    { name: 'Business', icon: TrendingUp },
    { name: 'Creative', icon: Sparkles },
    { name: 'Validated', icon: Star }
  ];

  useEffect(() => {
    if (user && !profile) {
      const checkOnboarding = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || !userDoc.data().onboardingCompleted) {
          navigate('/onboarding');
        }
      };
      checkOnboarding();
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (user) {
      const qIdeas = query(
        collection(db, 'ideas'),
        where('founderId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const unsubIdeas = onSnapshot(qIdeas, (snap) => {
        setMyIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const qRequests = query(
        collection(db, 'joinRequests'),
        where('status', '==', 'pending'),
        limit(10)
      );
      const unsubRequests = onSnapshot(qRequests, (snap) => {
        setJoinRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const qProfiles = query(
        collection(db, 'profiles'),
        where('uid', '!=', user.uid),
        limit(10)
      );
      
      const fetchAndRankMatches = async () => {
        if (!profile) return;
        setIsMatching(true);
        try {
          const snap = await getDocs(qProfiles);
          const otherProfiles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (otherProfiles.length > 0) {
            const ranked = await rankCoFounderMatches(profile, otherProfiles);
            setSuggestedMatches(ranked);
          }
        } catch (error) {
          console.error("Failed to rank matches:", error);
        } finally {
          setIsMatching(false);
        }
      };

      fetchAndRankMatches();

      const fetchFeed = async () => {
        try {
          const qFeed = query(collection(db, 'ideas'), where('status', '==', 'published'), limit(10));
          const snap = await getDocs(qFeed);
          setFeedItems(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'project' })));
        } catch (error) {
          console.error("Failed to fetch feed:", error);
        }
      };
      fetchFeed();

      const fetchFeatured = async () => {
        try {
          const qFeatured = query(
            collection(db, 'ideas'), 
            where('status', '==', 'published'),
            limit(3)
          );
          const snap = await getDocs(qFeatured);
          setFeaturedIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
          console.error("Failed to fetch featured ideas:", error);
        }
      };
      fetchFeatured();

      return () => {
        unsubIdeas();
        unsubRequests();
      };
    }
  }, [user, profile]);

  const handleAcceptRequest = async (requestId: string, ideaId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'joinRequests', requestId), { status: 'accepted' });
      
      // Add user to idea members (if we had a members array, but for now we just accept the request)
      // In a real app, we might add them to a 'members' collection or array in the idea doc
      
      await sendNotification(
        userId,
        'request_accepted',
        'Join Request Accepted',
        `You have been accepted into the forge for your requested idea!`,
        `/idea/${ideaId}/workspace`
      );
      
      toast.success("Collaborator accepted!");
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast.error("Failed to accept request.");
    }
  };

  const handleRejectRequest = async (requestId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'joinRequests', requestId), { status: 'rejected' });
      
      await sendNotification(
        userId,
        'request_rejected',
        'Join Request Rejected',
        `Your request to join the idea was not accepted at this time.`,
        `/hub`
      );
      
      toast.success("Request rejected.");
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast.error("Failed to reject request.");
    }
  };

  const handleConnect = async (targetUserId: string, targetName: string) => {
    if (!user || !profile) return;
    setConnectingId(targetUserId);
    try {
      await addDoc(collection(db, 'connections'), {
        users: [user.uid, targetUserId],
        status: 'pending',
        createdAt: serverTimestamp()
      });

      await sendNotification(
        targetUserId,
        'invitation',
        'New Connection Request',
        `${profile.displayName} wants to connect with you.`,
        `/profile/${user.uid}`
      );

      toast.success(`Connection request sent to ${targetName}!`);
    } catch (error) {
      console.error("Connect error:", error);
      toast.error("Failed to send connection request.");
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] flex">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10">
        {/* Header Area */}
        <header className="flex justify-between items-end mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-[#1f1b12]">Founder Dashboard</h2>
            <p className="text-[#564338] mt-2 text-lg">Good morning, {profile?.displayName?.split(' ')[0]}. Your studio is humming.</p>
          </motion.div>
          
          <div className="flex gap-4">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-[#903f00] text-white font-bold">
                {profile?.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Profile Completion Prompt */}
        {isProfileIncomplete && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-gradient-to-r from-[#903f00] to-[#b45309] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Level up your matching.</h3>
                  <p className="font-bold opacity-80 max-w-md">
                    Add your specific skills, interests, and what you're looking for to improve co-founder matching accuracy by 40%.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate(`/profile/${user?.uid}`)}
                className="bg-white text-[#903f00] hover:bg-[#fcf3e3] rounded-2xl px-8 h-14 font-black transition-all shadow-lg shrink-0"
              >
                Complete Profile <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          </motion.div>
        )}

        {/* Featured Ideas Section */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-[#1f1b12]">Featured Ideas</h3>
              <p className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest mt-1">Handpicked for potential</p>
            </div>
            <Link to="/hub" className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-1 hover:underline">
              Explore Hub <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#111111]/5 flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[#fcf3e3] rounded-xl flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-[#903f00]" />
                  </div>
                  <div className="bg-[#903f00]/10 text-[#903f00] px-2 py-1 rounded-lg">
                    <span className="text-[8px] font-black uppercase tracking-widest">Featured</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-lg font-black text-[#1f1b12] mb-2 group-hover:text-[#903f00] transition-colors line-clamp-1">{idea.title}</h4>
                  <p className="text-xs text-[#564338] font-medium leading-relaxed mb-4 line-clamp-2 opacity-70 italic">
                    {idea.tagline || idea.problem}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-[#903f00] text-white text-[8px] font-bold">
                        {idea.founderName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-[#564338]/60">by {idea.founderName}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-6">
                    {idea.skills?.slice(0, 3).map((skill: string, idx: number) => (
                      <span key={idx} className="text-[8px] font-black uppercase tracking-tighter bg-[#fcf3e3] text-[#903f00] px-2 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <Button 
                  asChild
                  variant="outline"
                  className="w-full rounded-xl border-[#1f1b12]/10 font-bold text-xs hover:bg-[#1f1b12] hover:text-white transition-all"
                >
                  <Link to={`/idea/${idea.id}`}>View Details</Link>
                </Button>
              </motion.div>
            ))}
            {featuredIdeas.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white/50 rounded-[2rem] border border-dashed border-[#ddc1b3]">
                <p className="text-[#564338]/40 font-bold italic text-sm">No featured ideas yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* AI Co-founder Suggestions */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-[#1f1b12] flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#903f00]" />
                Suggested Co-founders
              </h3>
              <p className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest mt-1">AI-powered matching based on your skills & needs</p>
            </div>
            {isMatching && <Loader2 className="w-4 h-4 animate-spin text-[#903f00]" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedMatches.map((match) => (
              <motion.div
                key={match.id}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-[2rem] border border-[#111111]/5 shadow-sm flex flex-col h-full group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-14 w-14 border-2 border-[#fcf3e3] shadow-sm">
                    <AvatarImage src={match.photoURL} />
                    <AvatarFallback className="bg-[#903f00] text-white font-bold text-xl">
                      {match.displayName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#1f1b12] truncate">{match.displayName}</p>
                    <p className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest">{match.role}</p>
                  </div>
                  <div className="bg-[#fcf3e3] px-2 py-1 rounded-lg shrink-0">
                    <span className="text-[10px] font-black text-[#903f00]">{match.matchScore}%</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-[11px] text-[#564338] font-medium leading-relaxed italic opacity-80 line-clamp-3">
                    "{match.matchReason}"
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {match.skills?.slice(0, 3).map((skill: string, idx: number) => (
                      <span key={`${skill}-${idx}`} className="text-[8px] font-black uppercase tracking-tighter bg-[#f6edde] text-[#564338] px-2 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/profile/${match.uid}`)}
                    className="rounded-xl border-[#1f1b12]/10 font-bold text-[10px] uppercase tracking-widest h-10"
                  >
                    Profile
                  </Button>
                  <Button 
                    onClick={() => handleConnect(match.uid, match.displayName)}
                    disabled={connectingId === match.uid}
                    className="bg-[#1f1b12] text-white hover:bg-[#903f00] rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 shadow-lg"
                  >
                    {connectingId === match.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                  </Button>
                </div>
              </motion.div>
            ))}
            
            {suggestedMatches.length === 0 && !isMatching && (
              <div className="col-span-full py-12 text-center bg-white/50 rounded-[2rem] border border-dashed border-[#ddc1b3]">
                <p className="text-[#564338]/40 font-bold italic text-sm">No matches found yet. Expand your profile to see suggestions!</p>
              </div>
            )}
          </div>
        </section>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div 
            whileHover={{ y: -5 }}
            className="col-span-1 bg-[#fcf3e3] p-6 rounded-3xl flex flex-col justify-between shadow-sm border border-[#111111]/5"
          >
            <div className="flex justify-between items-start">
              <Lightbulb className="w-6 h-6 text-[#903f00]" />
              <span className="text-[10px] font-bold text-[#903f00] uppercase tracking-tighter bg-[#903f00]/10 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-[#564338] font-bold">Active Ideas</p>
              <p className="text-3xl font-black text-[#1f1b12]">{myIdeas.length.toString().padStart(2, '0')}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="col-span-1 bg-[#fcf3e3] p-6 rounded-3xl flex flex-col justify-between shadow-sm border border-[#111111]/5"
          >
            <div className="flex justify-between items-start">
              <UserPlus className="w-6 h-6 text-[#005998]" />
              <span className="text-[10px] font-bold text-[#005998] uppercase tracking-tighter bg-[#005998]/10 px-2 py-1 rounded-full">New</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-[#564338] font-bold">Pending Requests</p>
              <p className="text-3xl font-black text-[#1f1b12]">{joinRequests.length.toString().padStart(2, '0')}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="col-span-1 md:col-span-2 bg-[#903f00] text-white p-6 rounded-3xl relative overflow-hidden shadow-xl"
          >
            <div className="relative z-10">
              <p className="text-sm font-bold opacity-80">Forge Performance Index</p>
              <p className="text-4xl font-black mt-2">84.2</p>
              <div className="mt-6 flex gap-1 items-end h-8">
                {[4, 6, 5, 8, 7].map((h, i) => (
                  <div key={i} className={cn("w-2 bg-white rounded-t-sm", `h-${h}`)} style={{ height: `${h * 4}px` }}></div>
                ))}
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#b45309] rounded-full blur-3xl opacity-50"></div>
          </motion.div>
        </section>

        {/* Main Dashboard Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Smart Feed */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-[#1f1b12]">Smart Feed</h3>
                  <p className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest mt-1">Curated for your expertise</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setActiveFilter(filter.name)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                        activeFilter === filter.name
                          ? "bg-[#1f1b12] text-white shadow-lg shadow-[#1f1b12]/20"
                          : "bg-white text-[#564338] hover:bg-[#fcf3e3] border border-[#111111]/5"
                      )}
                    >
                      <filter.icon className="w-3 h-3" />
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {feedItems.length > 0 ? (
                  feedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-[#111111]/5 hover:shadow-xl transition-all group"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-[#fcf3e3] rounded-2xl flex items-center justify-center shadow-inner">
                            <Rocket className="w-7 h-7 text-[#903f00]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xl font-black text-[#1f1b12] group-hover:text-[#903f00] transition-colors">{item.title}</h4>
                              {item.aiValidation?.score > 80 && (
                                <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span className="text-[8px] font-black uppercase">Validated</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-[#564338] font-bold opacity-60">Founded by {item.founderName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-[#903f00] uppercase tracking-widest">{item.stage}</p>
                          <p className="text-[10px] font-bold text-[#564338]/40 mt-1 italic">{item.geography || 'Global'}</p>
                        </div>
                      </div>

                      <p className="text-[#564338] font-medium leading-relaxed mb-8 line-clamp-2">
                        {item.tagline || item.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {item.skills?.map((skill: string, idx: number) => (
                          <span key={`${skill}-${idx}`} className="bg-[#fcf3e3]/50 text-[#903f00] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-[#111111]/5">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#eae1d3] shadow-sm"></div>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-[#564338]/60 uppercase tracking-widest">3 Members</span>
                        </div>
                        <Button 
                          asChild
                          className="bg-[#1f1b12] text-white hover:bg-[#903f00] rounded-2xl px-6 font-black transition-all shadow-lg"
                        >
                          <Link to={`/idea/${item.id}`}>
                            Join Workspace <ArrowRight className="ml-2 w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-20 border-2 border-dashed border-[#ddc1b3] rounded-[3rem] text-center bg-white/50">
                    <Waves className="w-12 h-12 text-[#903f00]/20 mx-auto mb-4 animate-pulse" />
                    <p className="text-[#564338] font-bold">The feed is currently quiet. Check back in 24 hours.</p>
                  </div>
                )}
              </div>
            </section>

            {/* My Ideas Section */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black tracking-tight text-[#1f1b12]">My Forge</h3>
                <Link to="/hub" className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-1 hover:underline">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myIdeas.length > 0 ? (
                  myIdeas.map((idea) => (
                    <motion.div 
                      key={idea.id}
                      whileHover={{ y: -5 }}
                      className="group bg-white p-6 rounded-3xl shadow-sm border border-[#111111]/5 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#fff8f1] flex items-center justify-center">
                          <Rocket className="w-5 h-5 text-[#903f00]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60">{idea.stage}</span>
                      </div>
                      <Link to={`/idea/${idea.id}`}>
                        <h4 className="text-lg font-black mb-2 group-hover:text-[#903f00] transition-colors">{idea.title}</h4>
                      </Link>
                      <p className="text-xs text-[#564338] font-medium leading-relaxed mb-6 line-clamp-2 italic opacity-80">{idea.tagline || idea.problem}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1, 2].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#eae1d3]"></div>
                          ))}
                        </div>
                        <div className="bg-[#fcf3e3] px-2 py-1 rounded-lg">
                          <span className="text-[8px] font-black text-[#903f00] uppercase">Active</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full p-12 border-2 border-dashed border-[#ddc1b3] rounded-[2rem] text-center bg-white/50">
                    <p className="text-[#564338] font-bold mb-4">You haven't forged any ideas yet.</p>
                    <Button asChild className="bg-[#903f00] text-white rounded-xl font-black">
                      <Link to="/create-idea">Create Your First Idea</Link>
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Join Requests */}
          <aside className="space-y-8">
            <div className="bg-[#eae1d3]/50 p-8 rounded-[2rem] border border-[#111111]/5 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-[#1f1b12] flex items-center justify-between">
                Join Requests
                <span className="bg-[#903f00] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {joinRequests.length}
                </span>
              </h3>
              
              <div className="space-y-6">
                {joinRequests.length > 0 ? (
                  joinRequests.map((req) => (
                    <div key={req.id} className="flex flex-col gap-4">
                      <div className="flex gap-3 items-start">
                        <Avatar className="h-10 w-10 border border-white">
                          <AvatarFallback className="bg-[#903f00] text-white font-bold">{req.userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-[#1f1b12] leading-tight">{req.userName}</p>
                          <p className="text-xs text-[#564338] mt-0.5 font-bold">Applying to <span className="text-[#903f00]">{req.ideaTitle}</span></p>
                        </div>
                      </div>
                      <p className="text-xs text-[#564338] italic leading-relaxed line-clamp-2">
                        "{req.message || 'Passionate about this vision and want to contribute my skills.'}"
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleAcceptRequest(req.id, req.ideaId, req.userId)}
                          className="bg-[#903f00] text-white rounded-xl text-xs font-bold hover:bg-[#b45309] h-9"
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleRejectRequest(req.id, req.userId)}
                          className="bg-white/50 text-[#564338] rounded-xl text-xs font-bold hover:bg-[#ba1a1a]/10 hover:text-[#ba1a1a] h-9 border border-white/20"
                        >
                          Reject
                        </Button>
                      </div>
                      <hr className="border-[#111111]/5 mt-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#564338] italic">No pending requests at the moment.</p>
                )}
              </div>
              
              <button className="w-full mt-8 text-[10px] font-bold uppercase tracking-widest text-[#564338]/40 hover:text-[#903f00] transition-colors">
                Show more history
              </button>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl bg-[#fcf3e3] border border-[#903f00]/20 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-[#903f00]/10 shadow-sm">
                  <Sparkles className="w-3 h-3 text-[#903f00]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#903f00]">Forge Insight</span>
              </div>
              <p className="text-sm font-bold text-[#1f1b12] leading-snug">
                Founders with similar backgrounds to your recent applicants have a 30% higher success rate in deep-tech ventures.
              </p>
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}
