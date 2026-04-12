import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, limit, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, sendNotification } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Filter, 
  ArrowUpDown, 
  Sparkles, 
  Eye, 
  MessageSquare,
  Search,
  MapPin,
  Briefcase,
  UserPlus,
  Check,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function DiscoverFounders() {
  const { user, profile } = useAuth();
  const [founders, setFounders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [myConnections, setMyConnections] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'connections'), where('users', 'array-contains', user.uid));
      const unsub = onSnapshot(q, (snap) => {
        setMyConnections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      let q;
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().replace('@', '');
        q = query(
          collection(db, 'profiles'),
          where('username', '>=', searchLower),
          where('username', '<=', searchLower + '\uf8ff'),
          limit(20)
        );
      } else {
        q = query(
          collection(db, 'profiles'),
          where('uid', '!=', user.uid),
          limit(20)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const foundersData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(f => f.uid !== user.uid); // Filter out current user if searching
        setFounders(foundersData);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, searchQuery]);

  const handleConnect = async (targetFounder: any) => {
    if (!user || !profile) return;
    
    setConnecting(targetFounder.uid);
    try {
      const existingConnection = myConnections.find(c => c.users.includes(targetFounder.uid));

      if (existingConnection) {
        toast.error("Connection already exists or is pending.");
        return;
      }

      await addDoc(collection(db, 'connections'), {
        users: [user.uid, targetFounder.uid],
        status: 'pending',
        createdAt: serverTimestamp()
      });

      await sendNotification(
        targetFounder.uid,
        'invitation',
        'New Connection Request',
        `${profile.displayName} wants to connect with you.`,
        `/profile/${user.uid}`
      );

      toast.success(`Connection request sent to ${targetFounder.displayName}!`);
    } catch (error) {
      console.error("Connect error:", error);
      toast.error("Failed to send connection request.");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] flex">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-12">
        {/* Header Section */}
        <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-black tracking-tighter text-[#1f1b12] leading-[0.9] mb-6"
            >
              Meet Your Next <br/> <span className="text-[#903f00]">Co-Founder.</span>
            </motion.h1>
            <div className="relative max-w-md mt-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564338]/40" />
              <input 
                type="text"
                placeholder="Search by username (e.g. @johndoe)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#111111]/5 rounded-2xl h-14 pl-12 pr-6 font-bold text-[#1f1b12] focus:outline-none focus:ring-2 focus:ring-[#903f00] shadow-sm"
              />
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            <Button variant="outline" className="rounded-full px-6 py-6 border-[#111111]/5 bg-white shadow-sm flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#564338]">
              <Filter className="w-4 h-4" />
              Filter Workspace
            </Button>
            <Button variant="outline" className="rounded-full px-6 py-6 border-[#111111]/5 bg-white shadow-sm flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#564338]">
              <ArrowUpDown className="w-4 h-4" />
              Recent
            </Button>
          </motion.div>
        </header>

        {/* Founder Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {founders.map((founder, index) => (
            <motion.div
              key={founder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0px_40px_80px_rgba(17,17,17,0.08)] border border-[#111111]/5"
            >
              <div className="h-64 relative overflow-hidden">
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  src={founder.photoURL || `https://picsum.photos/seed/${founder.uid}/600/400`}
                  alt={founder.displayName}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                
                {/* AI Aura Chip */}
                <div className="absolute top-6 left-6 backdrop-blur-md bg-white/70 border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#903f00] animate-pulse"></span>
                  <span className="text-[10px] font-bold text-[#903f00] font-label uppercase tracking-widest">Active Search</span>
                </div>
              </div>

              <div className="p-8 -mt-12 relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-[#1f1b12] mb-0.5">{founder.displayName}</h3>
                    <p className="text-xs font-bold text-[#903f00]/60">@{founder.username || 'anonymous'}</p>
                  </div>
                  <Badge className="bg-[#1f1b12] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-none shadow-lg">
                    {founder.role || 'Founder'}
                  </Badge>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#903f00] mb-4">{founder.headline || 'Visionary Founder'}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {(founder.skills || ['Strategy', 'Growth', 'Product']).slice(0, 3).map((skill: string, idx: number) => (
                    <span key={`${skill}-${idx}`} className="px-3 py-1 bg-[#fcf3e3] text-[#903f00] text-[10px] font-bold rounded-lg uppercase tracking-tight">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mb-8 space-y-1">
                  <span className="text-[10px] font-bold text-[#564338]/40 uppercase tracking-widest">Looking for</span>
                  <p className="text-[#1f1b12] font-bold text-sm line-clamp-1">
                    {founder.lookingFor || 'Technical co-founder with AI expertise'}
                  </p>
                </div>

                <div className="flex gap-3">
                  {(() => {
                    const conn = myConnections.find(c => c.users.includes(founder.uid));
                    const isPending = conn?.status === 'pending';
                    const isAccepted = conn?.status === 'accepted';

                    return (
                      <Button 
                        onClick={() => handleConnect(founder)}
                        disabled={connecting === founder.uid || !!conn}
                        className={cn(
                          "flex-1 py-6 text-xs font-bold rounded-2xl active:scale-95 transition-all shadow-lg",
                          isAccepted
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : isPending
                              ? "bg-amber-500 text-white hover:bg-amber-600"
                              : "bg-[#1f1b12] hover:bg-[#903f00] text-white shadow-[#1f1b12]/10"
                        )}
                      >
                        {connecting === founder.uid ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isAccepted ? (
                          <><Check className="w-4 h-4 mr-2" /> Connected</>
                        ) : isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2" /> Pending</>
                        ) : (
                          <><UserPlus className="w-4 h-4 mr-2" /> Connect</>
                        )}
                      </Button>
                    );
                  })()}
                  <Link to={`/profile/${founder.uid}`}>
                    <Button variant="outline" className="px-4 py-6 bg-[#fcf3e3] border-none text-[#1f1b12] rounded-2xl hover:bg-[#903f00] hover:text-white transition-all">
                      <Eye className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {/* "Discover More" Asymmetric CTA Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#f6edde] rounded-[2.5rem] p-10 flex flex-col justify-between border-2 border-dashed border-[#903f00]/20"
          >
            <div>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                <Sparkles className="text-[#903f00] w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-[#1f1b12] mb-4">Don't see your match?</h3>
              <p className="text-sm text-[#564338] font-bold italic opacity-60 leading-relaxed mb-6">
                Our Team Forge AI can scan 10,000+ deep-web profiles to find founders that align with your specific methodology and core values.
              </p>
            </div>
            <Button className="w-full py-8 bg-white text-[#1f1b12] font-black text-sm rounded-2xl border border-[#111111]/5 hover:bg-[#903f00] hover:text-white transition-all shadow-xl">
              Activate AI Matchmaking
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
