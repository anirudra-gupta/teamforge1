import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  MessageSquare, 
  LayoutDashboard, 
  CheckSquare, 
  Flag, 
  FileText, 
  Users, 
  Settings, 
  Send, 
  Plus, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Search,
  Filter,
  Paperclip,
  Maximize2,
  Minimize2,
  PenTool,
  Save,
  History,
  Zap,
  TrendingUp,
  Star,
  BarChart3,
  Target,
  DollarSign,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { DashboardSidebar } from '../components/DashboardSidebar';

export default function Workspace() {
  const { ideaId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tasks State
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'todo' });

  // Milestones State
  const [milestones, setMilestones] = useState<any[]>([]);

  // Forge Editor State
  const [forgeContent, setForgeContent] = useState('');
  const [isSavingForge, setIsSavingForge] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!ideaId || !user) return;

    const fetchIdea = async () => {
      const docSnap = await getDoc(doc(db, 'ideas', ideaId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIdea({ id: docSnap.id, ...data });
        setForgeContent(data.description || '');
      } else {
        toast.error("Workspace not found.");
        navigate('/dashboard');
      }
      setLoading(false);
    };
    fetchIdea();

    // Real-time Idea Sync (for collaborative editing)
    const unsubIdea = onSnapshot(doc(db, 'ideas', ideaId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // Only update if not currently editing or if it's a remote change
        // For simplicity in this demo, we'll just sync it
        setIdea({ id: snap.id, ...data });
        // We don't want to overwrite the user's local typing if they are the one editing
        // But for a simple collaborative experience, we'll just let it sync
      }
    });

    // Real-time Versions
    const qVersions = query(
      collection(db, 'ideaVersions'),
      where('ideaId', '==', ideaId),
      orderBy('createdAt', 'desc')
    );
    const unsubVersions = onSnapshot(qVersions, (snap) => {
      setVersions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Real-time Chat
    const qChat = query(
      collection(db, 'messages'),
      where('chatId', '==', ideaId),
      orderBy('createdAt', 'asc')
    );
    const unsubChat = onSnapshot(qChat, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Real-time Tasks
    const qTasks = query(
      collection(db, 'tasks'),
      where('ideaId', '==', ideaId),
      orderBy('createdAt', 'desc')
    );
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubIdea();
      unsubVersions();
      unsubChat();
      unsubTasks();
    };
  }, [ideaId, user, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile || !ideaId) return;

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: ideaId,
        senderId: user.uid,
        senderName: profile.displayName,
        senderPhoto: user.photoURL,
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message.");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !user || !ideaId) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        ideaId,
        ...newTask,
        assignedTo: user.uid,
        assignedToName: profile?.displayName,
        createdAt: serverTimestamp()
      });
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
      setIsAddTaskOpen(false);
      toast.success("Task added to the forge.");
    } catch (error) {
      console.error("Failed to add task:", error);
      toast.error("Failed to add task.");
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleSaveForge = async () => {
    if (!ideaId || !user || !profile) return;
    setIsSavingForge(true);
    try {
      // Save current version to history
      await addDoc(collection(db, 'ideaVersions'), {
        ideaId,
        description: forgeContent,
        editedBy: user.uid,
        editedByName: profile.displayName,
        createdAt: serverTimestamp()
      });

      // Update main idea document
      await updateDoc(doc(db, 'ideas', ideaId), {
        description: forgeContent,
        updatedAt: serverTimestamp()
      });

      toast.success("Idea forged and version saved!");
    } catch (error) {
      console.error("Failed to save idea:", error);
      toast.error("Failed to save changes.");
    } finally {
      setIsSavingForge(false);
    }
  };

  const handleRevertVersion = async (versionContent: string) => {
    if (!ideaId) return;
    try {
      await updateDoc(doc(db, 'ideas', ideaId), {
        description: versionContent,
        updatedAt: serverTimestamp()
      });
      setForgeContent(versionContent);
      toast.success("Idea reverted to selected version!");
    } catch (error) {
      console.error("Failed to revert version:", error);
      toast.error("Failed to revert version.");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#fff8f1] flex">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 flex flex-col h-screen">
        {/* Workspace Header */}
        <header className="p-6 bg-white border-b border-[#111111]/5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate(`/idea/${ideaId}`)} className="text-[#564338]/60 hover:text-[#903f00] font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-10 w-px bg-[#111111]/5" />
            <div>
              <h1 className="text-xl font-black text-[#1f1b12] tracking-tight">{idea?.title}</h1>
              <p className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest">Collaboration Workspace</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <Avatar key={i} className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-[#903f00] text-white text-[10px] font-bold">U{i}</AvatarFallback>
                </Avatar>
              ))}
              <div className="h-8 w-8 rounded-full bg-[#fcf3e3] border-2 border-white flex items-center justify-center text-[10px] font-black text-[#903f00] shadow-sm">
                +2
              </div>
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl border-[#903f00]/20 text-[#903f00] font-bold text-[10px] uppercase tracking-widest h-10 px-4"
              onClick={() => navigate(`/idea/${ideaId}/funding`)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Funding
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl border-[#111111]/5 text-[#564338]">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Area */}
          <div className="flex-1 flex flex-col bg-[#fff8f1]/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-6 pt-4 bg-white border-b border-[#111111]/5">
                <TabsList className="bg-transparent gap-8 h-auto p-0">
                  {[
                    { id: 'forge', label: 'Idea Forge', icon: PenTool },
                    { id: 'chat', label: 'Forge Chat', icon: MessageSquare },
                    { id: 'tasks', label: 'Kanban Board', icon: CheckSquare },
                    { id: 'validation', label: 'AI Analysis', icon: Sparkles },
                    { id: 'milestones', label: 'Milestones', icon: Flag },
                    { id: 'files', label: 'Blueprint Files', icon: FileText }
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#903f00] data-[state=active]:border-b-2 data-[state=active]:border-[#903f00] rounded-none px-0 py-4 text-[10px] font-black uppercase tracking-widest text-[#564338]/40 transition-all flex items-center gap-2"
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <TabsContent value="forge" className="absolute inset-0 m-0 flex flex-col p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      <Card className="flex-1 flex flex-col border-[#111111]/5 shadow-sm overflow-hidden bg-white">
                        <div className="p-4 border-b border-[#111111]/5 flex items-center justify-between bg-[#fcf3e3]/30">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-[#903f00] uppercase tracking-widest">Live Forge Editor</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowHistory(!showHistory)}
                              className="text-[#564338] hover:text-[#903f00] font-bold text-[10px] uppercase tracking-wider"
                            >
                              <History className="w-3 h-3 mr-2" />
                              {showHistory ? "Close History" : "View History"}
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={handleSaveForge}
                              disabled={isSavingForge}
                              className="bg-[#903f00] hover:bg-[#7a3500] text-white shadow-sm font-bold text-[10px] uppercase tracking-wider px-4"
                            >
                              {isSavingForge ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-2" />
                                  Save Version
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <textarea
                          value={forgeContent}
                          onChange={(e) => setForgeContent(e.target.value)}
                          placeholder="Refine your startup idea here..."
                          className="flex-1 p-8 resize-none focus:outline-none text-base leading-relaxed text-[#1f1b12] bg-white font-serif"
                        />
                      </Card>
                    </div>

                    <div className="flex flex-col gap-6">
                      {showHistory ? (
                        <Card className="flex-1 border-[#111111]/5 shadow-sm overflow-hidden flex flex-col bg-white">
                          <div className="p-4 border-b border-[#111111]/5 bg-[#fcf3e3]/30">
                            <h3 className="text-[10px] font-black text-[#903f00] uppercase tracking-widest flex items-center gap-2">
                              <History className="w-3 h-3" />
                              Version History
                            </h3>
                          </div>
                          <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                              {versions.length === 0 ? (
                                <div className="text-center py-8 text-[#564338]/40 italic text-xs">
                                  No versions saved yet.
                                </div>
                              ) : (
                                versions.map((v) => (
                                  <div key={v.id} className="p-4 rounded-xl border border-[#111111]/5 hover:border-[#903f00]/20 transition-all bg-white group shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-bold text-[#903f00]">
                                        {v.createdAt?.toDate ? format(v.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                                      </span>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => setForgeContent(v.description)}
                                        >
                                          Preview
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity border-[#903f00]/20 text-[#903f00]"
                                          onClick={() => handleRevertVersion(v.description)}
                                        >
                                          Revert
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-[#564338] line-clamp-3 mb-3 leading-relaxed">{v.description}</p>
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-[#fcf3e3] flex items-center justify-center text-[8px] font-black text-[#903f00] border border-[#903f00]/10">
                                        {v.editedByName?.[0]}
                                      </div>
                                      <span className="text-[10px] font-bold text-[#564338]/40">by {v.editedByName}</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </Card>
                      ) : (
                        <>
                          <Card className="p-6 border-[#111111]/5 shadow-sm bg-gradient-to-br from-[#fcf3e3]/50 to-white">
                            <h3 className="text-[10px] font-black text-[#903f00] uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Zap className="w-3 h-3 text-[#903f00]" />
                              Forge Tips
                            </h3>
                            <ul className="text-xs text-[#564338] space-y-3 font-medium">
                              <li className="flex gap-3">
                                <span className="text-[#903f00]">•</span>
                                Focus on the core problem you're solving.
                              </li>
                              <li className="flex gap-3">
                                <span className="text-[#903f00]">•</span>
                                Define your unique value proposition clearly.
                              </li>
                              <li className="flex gap-3">
                                <span className="text-[#903f00]">•</span>
                                Keep your target audience specific.
                              </li>
                            </ul>
                          </Card>
                          
                          <Card className="p-6 border-[#111111]/5 shadow-sm bg-white">
                            <h3 className="text-[10px] font-black text-[#903f00] uppercase tracking-widest mb-4">Team Presence</h3>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-[#903f00] text-white text-xs font-bold">
                                      {profile?.displayName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#1f1b12]">{profile?.displayName} (You)</p>
                                  <p className="text-[10px] font-bold text-[#903f00] italic">Forging now...</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="absolute inset-0 m-0 flex flex-col">
                  <ScrollArea className="flex-1 p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                      {messages.map((m, i) => (
                        <div key={m.id} className={cn(
                          "flex gap-4",
                          m.senderId === user?.uid ? "flex-row-reverse" : "flex-row"
                        )}>
                          <Avatar className="h-10 w-10 border border-white shadow-sm shrink-0">
                            <AvatarImage src={m.senderPhoto} />
                            <AvatarFallback className="bg-[#903f00] text-white font-bold">{m.senderName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "max-w-[70%] space-y-1",
                            m.senderId === user?.uid ? "items-end" : "items-start"
                          )}>
                            <div className="flex items-center gap-2 px-2">
                              <span className="text-[10px] font-black text-[#1f1b12]">{m.senderName}</span>
                              <span className="text-[8px] font-bold text-[#564338]/40 uppercase">
                                {m.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                              m.senderId === user?.uid 
                                ? "bg-[#1f1b12] text-white rounded-tr-none shadow-xl" 
                                : "bg-white text-[#1f1b12] rounded-tl-none border border-[#111111]/5 shadow-sm"
                            )}>
                              {m.text}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="p-6 bg-white border-t border-[#111111]/5">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-3">
                      <div className="flex-1 relative">
                        <Input 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message to the team..."
                          className="w-full bg-[#fcf3e3]/30 border-none h-14 pl-6 pr-12 rounded-2xl font-bold focus-visible:ring-[#903f00]"
                        />
                        <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#564338]/40 hover:text-[#903f00] transition-colors">
                          <Paperclip className="w-5 h-5" />
                        </button>
                      </div>
                      <Button type="submit" disabled={!newMessage.trim()} className="bg-[#1f1b12] text-white hover:bg-[#903f00] rounded-2xl px-8 h-14 font-black transition-all shadow-xl">
                        <Send className="w-5 h-5" />
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="absolute inset-0 m-0 flex flex-col p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black text-[#1f1b12]">Kanban Board</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white border-[#111111]/5 text-[10px] font-black uppercase tracking-widest text-[#564338]/60">
                          {tasks.length} Tasks
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={() => setIsAddTaskOpen(true)} className="bg-[#903f00] text-white hover:bg-[#b45309] rounded-xl font-black text-xs uppercase tracking-widest px-6">
                      <Plus className="w-4 h-4 mr-2" /> Add Task
                    </Button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-x-auto pb-4 no-scrollbar">
                    {['todo', 'in-progress', 'done'].map((status) => (
                      <div key={status} className="flex flex-col gap-6 min-w-[320px]">
                        <div className="flex items-center justify-between px-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              status === 'todo' ? "bg-[#564338]/40" : status === 'in-progress' ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f1b12]">
                              {status.replace('-', ' ')}
                            </h4>
                          </div>
                          <span className="text-[10px] font-black text-[#564338]/40">
                            {tasks.filter(t => t.status === status).length}
                          </span>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          {tasks.filter(t => t.status === status).map((task) => (
                            <motion.div
                              layoutId={task.id}
                              key={task.id}
                              className="bg-white p-6 rounded-3xl border border-[#111111]/5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <Badge className={cn(
                                  "text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md",
                                  task.priority === 'high' ? "bg-rose-100 text-rose-700" : task.priority === 'medium' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                )}>
                                  {task.priority}
                                </Badge>
                                <button className="text-[#564338]/20 hover:text-[#903f00] transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                              <h5 className="font-bold text-[#1f1b12] mb-2 leading-tight">{task.title}</h5>
                              <p className="text-[11px] text-[#564338] opacity-60 line-clamp-2 mb-6 italic">{task.description}</p>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-[#111111]/5">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-[#fcf3e3] text-[#903f00] text-[8px] font-black">
                                    {task.assignedToName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex gap-1">
                                  {status !== 'todo' && (
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, status === 'done' ? 'in-progress' : 'todo')}
                                      className="p-1.5 rounded-lg hover:bg-[#fcf3e3] text-[#564338]/40 hover:text-[#903f00] transition-all"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {status !== 'done' && (
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, status === 'todo' ? 'in-progress' : 'done')}
                                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-[#564338]/40 hover:text-emerald-600 transition-all"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          
                          {tasks.filter(t => t.status === status).length === 0 && (
                            <div className="p-8 border-2 border-dashed border-[#111111]/5 rounded-3xl text-center">
                              <p className="text-[10px] font-bold text-[#564338]/20 uppercase tracking-widest italic">No tasks here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="absolute inset-0 m-0 flex flex-col p-8 overflow-y-auto custom-scrollbar">
                  <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">
                    {!idea?.aiValidation ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-[#fcf3e3] rounded-[2rem] flex items-center justify-center">
                          <AlertCircle className="w-10 h-10 text-[#903f00]/20" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-[#1f1b12]">No AI Analysis Found</h3>
                          <p className="text-[#564338] font-bold italic opacity-60 mt-2">This idea hasn't been validated by our AI engine yet.</p>
                        </div>
                        <Button className="bg-[#1f1b12] text-white rounded-2xl px-8 h-12 font-black shadow-lg">
                          Run Validation Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-12">
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
                              <p className="text-2xl font-black text-[#903f00]">{idea.aiValidation.score}%</p>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "w-6 h-6",
                                    i < Math.round(idea.aiValidation.score / 20) ? "text-[#903f00] fill-[#903f00]" : "text-[#903f00]/20"
                                  )} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card className="p-8 rounded-[2.5rem] bg-white border border-[#111111]/5 shadow-sm">
                                <h3 className="text-lg font-black text-[#1f1b12] mb-6 flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                                  Core Strengths
                                </h3>
                                <div className="space-y-4">
                                  {idea.aiValidation.strengths.map((s: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                      <p className="text-xs text-[#564338] font-bold leading-relaxed">{s}</p>
                                    </div>
                                  ))}
                                </div>
                              </Card>

                              <Card className="p-8 rounded-[2.5rem] bg-white border border-[#111111]/5 shadow-sm">
                                <h3 className="text-lg font-black text-[#1f1b12] mb-6 flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5 text-rose-600" />
                                  Potential Risks
                                </h3>
                                <div className="space-y-4">
                                  {idea.aiValidation.weaknesses.map((w: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3">
                                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                      <p className="text-xs text-[#564338] font-bold leading-relaxed">{w}</p>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            </div>

                            <Card className="p-10 rounded-[2.5rem] bg-[#fcf3e3] border border-[#903f00]/10">
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
                                      <span className="text-sm font-black text-[#903f00]">{idea.aiValidation.metrics[metric.key]}/10</span>
                                    </div>
                                    <div className="h-3 w-full bg-white rounded-full overflow-hidden shadow-inner">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${idea.aiValidation.metrics[metric.key] * 10}%` }}
                                        className="h-full bg-[#903f00] rounded-full shadow-lg"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Card>
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
                                  {idea.aiValidation.competitors.map((c: string, i: number) => (
                                    <span key={i} className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/5">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            <div className="bg-white p-10 rounded-[2.5rem] border border-[#111111]/5 shadow-xl">
                              <h3 className="text-xl font-black text-[#1f1b12] mb-8">Strategic Suggestions</h3>
                              <div className="space-y-6">
                                {idea.aiValidation.suggestions.map((s: string, i: number) => (
                                  <div key={i} className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                      <Sparkles className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs text-[#564338] font-bold leading-relaxed">{s}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="milestones" className="absolute inset-0 m-0 flex flex-col p-8">
                  <div className="max-w-4xl mx-auto w-full space-y-12">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-3xl font-black text-[#1f1b12]">Project Milestones</h3>
                        <p className="text-sm text-[#564338] font-bold italic opacity-60 mt-1">The strategic roadmap for {idea?.title}</p>
                      </div>
                      <Button className="bg-[#1f1b12] text-white rounded-xl font-black text-xs uppercase tracking-widest px-6">
                        Define Milestone
                      </Button>
                    </div>

                    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-[#903f00]/10">
                      {[
                        { title: 'MVP Prototype', date: 'Oct 2023', status: 'completed', desc: 'Initial core features and database architecture.' },
                        { title: 'Beta Testing', date: 'Nov 2023', status: 'in-progress', desc: 'Onboarding 50 early adopters for feedback loop.' },
                        { title: 'Public Launch', date: 'Jan 2024', status: 'pending', desc: 'Full release to the global founder community.' }
                      ].map((m, i) => (
                        <div key={i} className="flex gap-8 relative z-10">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg",
                            m.status === 'completed' ? "bg-emerald-500 text-white" : m.status === 'in-progress' ? "bg-amber-500 text-white animate-pulse" : "bg-white border-2 border-[#111111]/5 text-[#564338]/20"
                          )}>
                            {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-[#111111]/5 shadow-sm flex-1 group hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="text-xl font-black text-[#1f1b12] group-hover:text-[#903f00] transition-colors">{m.title}</h4>
                              <span className="text-[10px] font-black text-[#903f00] uppercase tracking-widest">{m.date}</span>
                            </div>
                            <p className="text-[#564338] font-medium leading-relaxed italic opacity-70">{m.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="absolute inset-0 m-0 flex flex-col p-8">
                  <div className="max-w-5xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-12">
                      <h3 className="text-2xl font-black text-[#1f1b12]">Blueprint Repository</h3>
                      <Button className="bg-[#1f1b12] text-white rounded-xl font-black text-xs uppercase tracking-widest px-6">
                        Upload Asset
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'Pitch_Deck_v2.pdf', size: '4.2 MB', type: 'PDF', date: '2 days ago' },
                        { name: 'Architecture_Diagram.png', size: '1.8 MB', type: 'IMAGE', date: '5 days ago' },
                        { name: 'Revenue_Model.xlsx', size: '850 KB', type: 'EXCEL', date: '1 week ago' }
                      ].map((file, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-[#111111]/5 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                          <div className="w-12 h-12 bg-[#fcf3e3] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#903f00] transition-colors">
                            <FileText className="w-6 h-6 text-[#903f00] group-hover:text-white" />
                          </div>
                          <h4 className="font-bold text-[#1f1b12] mb-1 truncate">{file.name}</h4>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-[10px] font-black text-[#564338]/40 uppercase">{file.size}</span>
                            <span className="text-[10px] font-bold text-[#903f00] uppercase tracking-widest">{file.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Sidebar: Team & Activity */}
          <aside className="w-80 bg-white border-l border-[#111111]/5 flex flex-col">
            <div className="p-8 border-b border-[#111111]/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#564338]/40 mb-8">Active Forgers</h3>
              <div className="space-y-6">
                {[
                  { name: 'Sarah Chen', role: 'Lead Architect', status: 'Online', color: 'bg-emerald-500' },
                  { name: 'Marcus Thorne', role: 'Strategist', status: 'Away', color: 'bg-amber-500' },
                  { name: profile?.displayName, role: profile?.role, status: 'Online', color: 'bg-emerald-500' }
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-[#fcf3e3]">
                          <AvatarFallback className="bg-[#903f00] text-white font-bold">{member.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white", member.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1f1b12] leading-tight">{member.name}</p>
                        <p className="text-[10px] text-[#564338]/60 font-bold">{member.role}</p>
                      </div>
                    </div>
                    <button className="text-[#564338]/20 hover:text-[#903f00] transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-8 border-2 border-dashed border-[#111111]/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#564338]/40 hover:text-[#903f00] hover:bg-[#fcf3e3] transition-all">
                Invite Collaborator
              </Button>
            </div>

            <div className="flex-1 p-8 overflow-hidden flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#564338]/40 mb-8">Recent Activity</h3>
              <ScrollArea className="flex-1">
                <div className="space-y-8 pr-4">
                  {[
                    { user: 'Sarah', action: 'updated the', target: 'MVP Blueprint', time: '2h ago', icon: FileText },
                    { user: 'Marcus', action: 'completed', target: 'Market Research', time: '5h ago', icon: CheckCircle2 },
                    { user: 'Sarah', action: 'added a new', target: 'Task', time: '1d ago', icon: Plus }
                  ].map((act, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-[#fcf3e3] flex items-center justify-center shrink-0">
                        <act.icon className="w-4 h-4 text-[#903f00]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#1f1b12] leading-relaxed">
                          <span className="font-black">{act.user}</span> {act.action} <span className="text-[#903f00] font-black">{act.target}</span>
                        </p>
                        <p className="text-[10px] font-bold text-[#564338]/40 uppercase mt-1">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>
        </div>

        {/* Add Task Modal */}
        <AnimatePresence>
          {isAddTaskOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddTaskOpen(false)}
                className="absolute inset-0 bg-[#1f1b12]/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-[#1f1b12]">Add New Task</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsAddTaskOpen(false)} className="rounded-xl">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <form onSubmit={handleAddTask} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Task Title</label>
                      <Input 
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="e.g. Design Landing Page"
                        className="bg-[#fcf3e3]/30 border-none h-14 rounded-2xl font-bold focus-visible:ring-[#903f00]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Description</label>
                      <Textarea 
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="What needs to be done?"
                        className="bg-[#fcf3e3]/30 border-none rounded-2xl font-bold focus-visible:ring-[#903f00] min-h-[100px] resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Priority</label>
                        <select 
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          className="w-full bg-[#fcf3e3]/30 border-none h-14 rounded-2xl font-bold focus:ring-[#903f00] px-4 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#564338]/60 ml-2">Initial Status</label>
                        <select 
                          value={newTask.status}
                          onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                          className="w-full bg-[#fcf3e3]/30 border-none h-14 rounded-2xl font-bold focus:ring-[#903f00] px-4 text-sm"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-[#1f1b12] text-white h-14 rounded-2xl font-black text-lg hover:bg-[#903f00] transition-all shadow-xl mt-4">
                      Add to Board
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const X = ({ className, onClick }: { className?: string, onClick?: () => void }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    onClick={onClick}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
