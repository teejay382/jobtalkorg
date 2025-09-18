import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth, Profile, getProfileRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';

type FormValues = {
  username: string;
  full_name: string;
  bio: string;
  account_type: 'freelancer' | 'employer';
  skills: string; // comma separated
  location: string;
  portfolio: string;
  availability: boolean;
  company_name?: string;
};

// Use Profile type for update payloads
type UpdateProfilePayload = Partial<Profile>;

const ProfileSettings: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();

  // Use Profile type for safer access
  const profileTyped = profile as Profile | undefined;

  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: {
      username: profileTyped?.username || '',
      full_name: profileTyped?.full_name || '',
      bio: profileTyped?.bio || '',
      account_type: (profileTyped?.role as 'freelancer' | 'employer') || (profileTyped?.account_type as 'freelancer' | 'employer') || 'freelancer',
      skills: Array.isArray(profileTyped?.skills) ? (profileTyped?.skills || []).join(', ') : '',
      location: profileTyped?.location || '',
      portfolio: profileTyped?.portfolio || '',
      availability: !!profileTyped?.available,
      company_name: profileTyped?.company_name || ''
    }
  });

  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadToStorage = async (file: File | null, bucket: string) => {
    if (!file || !user) return null;
    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // SDK returns { publicUrl }
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path || filePath);
      const publicUrl = (publicData as { publicUrl?: string } | undefined)?.publicUrl ?? null;
      return publicUrl;
    } catch (err) {
      console.error('Upload error', err);
      return null;
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSaving(true);

    try {
      const updates: UpdateProfilePayload = {
        username: values.username || null,
        full_name: values.full_name || null,
        bio: values.bio || null,
    account_type: values.account_type,
    // also set role field in DB if your schema uses `role`
    role: values.account_type,
        skills: values.skills ? values.skills.split(',').map(s => s.trim()).filter(Boolean) : null,
        location: values.location || null,
        portfolio: values.portfolio || null,
        available: !!values.availability,
        company_name: values.account_type === 'employer' ? values.company_name || null : null
      };

      if (avatarFile) {
        const url = await uploadToStorage(avatarFile, 'avatars');
        if (url) updates.avatar_url = url;
      }

      if (companyLogo && values.account_type === 'employer') {
        const url = await uploadToStorage(companyLogo, 'company-logos');
        if (url) updates.company_logo = url;
      }

      const result = await updateProfile(updates);
      const { data, error } = result;

      if (error) {
        console.error(error);
        toast({ title: 'Save failed', description: 'Could not update profile', variant: 'destructive' });
      } else {
        toast({ title: 'Profile updated ✅' });
        // reflect updated values in form
        reset({
          username: data?.username || values.username,
          full_name: data?.full_name || values.full_name,
          bio: data?.bio || values.bio,
          account_type: data?.account_type || values.account_type,
          skills: Array.isArray(data?.skills) ? (data!.skills as string[]).join(', ') : values.skills,
          location: data?.location || values.location,
          portfolio: data?.portfolio || values.portfolio,
          availability: !!(data?.available ?? values.availability),
          company_name: data?.company_name || values.company_name
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Unexpected error saving profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <p className="text-muted-foreground">You need to sign in to edit your profile.</p>
          <Button onClick={() => (window.location.href = '/auth')} className="mt-4">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Profile Settings</h1>

          <section className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-4">
              <Avatar>
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile?.full_name || profile?.username || 'avatar'} />
                ) : (
                  <AvatarFallback>{(profile?.full_name || profile?.username || 'U').charAt(0)}</AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1">
                <Label className="text-sm">Profile picture</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                  <Button size="sm" onClick={() => setAvatarFile(null)}>Remove</Button>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <section className="bg-card rounded-xl p-6 border border-border grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register('username')} />
              </div>

              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" {...register('full_name')} />
              </div>

              <div>
                <Label htmlFor="bio">Short bio</Label>
                <Textarea id="bio" {...register('bio')} rows={3} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label>Role</Label>
                  <div className="flex gap-2 mt-2">
                    <label className={`px-3 py-2 rounded-md border ${getProfileRole(profile) === 'freelancer' ? 'bg-primary text-white' : 'bg-transparent'}`}>
                      <input type="radio" value="freelancer" {...register('account_type')} className="hidden" /> Freelancer
                    </label>
                    <label className={`px-3 py-2 rounded-md border ${getProfileRole(profile) === 'employer' ? 'bg-primary text-white' : 'bg-transparent'}`}>
                      <input type="radio" value="employer" {...register('account_type')} className="hidden" /> Employer
                    </label>
                  </div>
                </div>

                <div className="flex flex-col items-end"> 
                  <Label className="text-sm">Availability</Label>
                  <div className="mt-2">
                    <Controller
                      control={control}
                      name="availability"
                      render={({ field }) => (
                        <Switch checked={!!field.value} onCheckedChange={(v: boolean) => field.onChange(!!v)} />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input id="skills" {...register('skills')} />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register('location')} />
              </div>

              <div>
                <Label htmlFor="portfolio">Portfolio link</Label>
                <Input id="portfolio" {...register('portfolio')} />
              </div>

              <div>
                <Label htmlFor="company_name">Company name (employers)</Label>
                <Input id="company_name" {...register('company_name')} />
                <div className="mt-2 flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={(e) => setCompanyLogo(e.target.files?.[0] || null)} />
                  <Button size="sm" onClick={() => setCompanyLogo(null)}>Remove</Button>
                </div>
              </div>
            </section>

            <div className="flex gap-3 flex-col">
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
              <Button variant="outline" className="flex-1" onClick={() => signOut()}>Sign Out</Button>
              <Button variant="link" className="flex-1" onClick={() => window.open('https://docs.google.com/forms/e/1FAIpQLSdsbSoo4B3Vg1k7dW3KVY1tyVYnqzGKBPE518k9Kn6ue7ni4Q/viewform?usp=dialog', '_blank', 'noopener,noreferrer')}>
                Feedback
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Danger: <button className="text-destructive" onClick={async () => {
                if (!confirm('Delete account? This action cannot be undone.')) return;
                toast({ title: 'Client cannot delete accounts', description: 'Please delete the account from the admin dashboard or contact support.', variant: 'destructive' });
              }}>Delete account</button></p>
            </div>
          </form>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default ProfileSettings;
