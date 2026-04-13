import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Settings, Camera, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface EditProfileModalProps {
  profile: any;
  onUpdate: (newProfile: any) => void;
}

export default function EditProfileModal({ profile, onUpdate }: EditProfileModalProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    role: profile.role || '',
    lookingFor: profile.lookingFor || '',
    skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
    interests: Array.isArray(profile.interests) ? profile.interests.join(', ') : '',
    photoURL: profile.photoURL || '',
    coverURL: profile.coverURL || ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Image too large. Please use an image under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          [type === 'photo' ? 'photoURL' : 'coverURL']: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.displayName.trim() || !formData.username.trim()) {
      toast.error('Name and username are required.');
      return;
    }

    setLoading(true);
    try {
      const profileRef = doc(db, 'profiles', profile.uid);
      const updateData = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i !== '')
      };
      await updateDoc(profileRef, updateData);
      onUpdate({ ...profile, ...updateData });
      toast.success('Profile updated successfully!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      // 1. Delete Firestore profile
      await deleteDoc(doc(db, 'profiles', user.uid));
      
      // 2. Delete Auth user
      await deleteUser(user);
      
      toast.success('Account deleted successfully.');
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in to delete your account for security reasons.');
      } else {
        toast.error('Failed to delete account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white/50 backdrop-blur-md border-none text-[#1f1b12] rounded-2xl font-bold px-6 py-6 hover:bg-white transition-all">
          <Settings className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#fff8f1] border-none rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-[#1f1b12]">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 pt-6">
          {/* Cover & Photo Upload */}
          <div className="relative">
            <div className="h-40 w-full rounded-2xl overflow-hidden bg-[#eae1d3] relative group">
              <img 
                src={formData.coverURL || "https://picsum.photos/seed/studio/1200/400"} 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <label className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'cover')} />
              </label>
            </div>
            
            <div className="absolute -bottom-10 left-8">
              <div className="relative group">
                <Avatar className="h-24 w-24 rounded-2xl border-4 border-[#fff8f1] shadow-xl bg-[#fcf3e3]">
                  <AvatarImage src={formData.photoURL} />
                  <AvatarFallback className="bg-[#903f00] text-white text-2xl font-black">
                    {formData.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'photo')} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#564338]/60">Display Name</label>
              <Input 
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="bg-white border-none rounded-xl h-12 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#564338]/60">Username</label>
              <Input 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="bg-white border-none rounded-xl h-12 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#564338]/60">Role</label>
              <Input 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="bg-white border-none rounded-xl h-12 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#564338]/60">Looking For</label>
              <Input 
                value={formData.lookingFor}
                onChange={e => setFormData({...formData, lookingFor: e.target.value})}
                className="bg-white border-none rounded-xl h-12 font-bold"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#564338]/60">Bio</label>
              <Textarea 
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                className="bg-white border-none rounded-xl min-h-[100px] font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#564338]/60">Skills (comma separated)</label>
              <Input 
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
                className="bg-white border-none rounded-xl h-12 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#564338]/60">Interests (comma separated)</label>
              <Input 
                value={formData.interests}
                onChange={e => setFormData({...formData, interests: e.target.value})}
                className="bg-white border-none rounded-xl h-12 font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#1f1b12] text-white hover:bg-[#903f00] h-14 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save Changes'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 font-bold py-6 rounded-2xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#fff8f1] border-none rounded-[2.5rem]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black text-[#1f1b12] flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    Delete Account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#564338] font-bold italic opacity-60">
                    This is permanent. All your ideas, projects, and profile data will be lost forever. Are you absolutely sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3">
                  <AlertDialogCancel variant="outline" size="default" className="rounded-xl font-bold border-none bg-[#fcf3e3]">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold"
                  >
                    Yes, Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
