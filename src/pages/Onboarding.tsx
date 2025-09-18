import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, CheckCircle, ArrowRight, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import logoImage from '@/assets/logo.png';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<'freelancer' | 'employer' | ''>('');
  const [roleSupported, setRoleSupported] = useState(true);
  const [selectionError, setSelectionError] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const popularSkills = [
    'Web Development', 'Graphic Design', 'Video Editing', 'Copywriting',
    'Digital Marketing', 'Sales', 'Data Analysis', 'Customer Service',
    'Mobile Development', 'UI/UX Design', 'Content Writing', 'SEO',
    'Social Media Management', 'Photography', 'Project Management',
    'Translation', 'Voice Over', 'Accounting', 'Virtual Assistant'
  ];

  const jobCategories = [
    'Technology', 'Design', 'Marketing', 'Sales', 'Customer Support',
    'Operations', 'Finance', 'HR', 'Content', 'Engineering'
  ];

  useEffect(() => {
    // Check if user is authenticated and whether onboarding completed
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has already completed onboarding. Use user_id filter.
      // Try fetching the role column first; if the remote DB doesn't have it
      // (PGRST204), fall back to querying only onboarding_completed.
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, role')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          // If the error indicates the `role` column isn't present, fall back
          // to selecting only onboarding_completed and mark role unsupported.
          // Supabase/postgrest surface PGRST204 for missing column in some cases.
          // Treat any select failure as a hint that `role` might not exist.
          console.warn('profiles select with role failed, falling back:', error);
          setRoleSupported(false);

          const { data: profileNoRole } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('user_id', session.user.id)
            .single();

          if (profileNoRole?.onboarding_completed) {
            // No role available; redirect to freelancer by default
            navigate('/?role=freelancer');
          }
        } else {
          if (profile?.onboarding_completed) {
            // Redirect based on role if available
            if (profile.role === 'employer') navigate('/?role=employer');
            else navigate('/?role=freelancer');
          }
        }
      } catch (err) {
        // Network or unexpected error. Log and try a minimal select as fallback.
        console.warn('Error while checking onboarding/profile, attempting fallback:', err);
        setRoleSupported(false);
        try {
          const { data: profileNoRole } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('user_id', session.user.id)
            .single();

          if (profileNoRole?.onboarding_completed) {
            navigate('/?role=freelancer');
          }
        } catch (err2) {
          console.error('Fallback profile check failed:', err2);
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      removeSkill(skill);
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleNext = () => {
    setSelectionError('');
    if (currentStep === 1) {
      // Ensure a role was selected before proceeding
      if (!accountType) {
        setSelectionError('Please select a role to continue.');
        return;
      }
      setCurrentStep(2);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Ensure role was selected
      if (!accountType) {
        setSelectionError('Please select a role to continue.');
        setLoading(false);
        return;
      }

      const updateData: any = {
        // Only include `role` if the remote DB supports it. If not, we'll
        // omit it to avoid PGRST204 errors and retry without role below.
        ...(roleSupported ? { role: accountType } : {}),
        onboarding_completed: true
      };

      if (accountType === 'employer') {
        updateData.company_name = companyName;
        updateData.skills = selectedSkills; // Job categories for employers
      } else {
        updateData.skills = selectedSkills;
      }

      // Use upsert and request the representation so we can verify the saved role
      const username = (session.user.user_metadata && (session.user.user_metadata.user_name || session.user.user_metadata.full_name)) || session.user.email?.split('@')[0] || null;
      const email = session.user.email ?? '';

      const payload: any = {
        user_id: session.user.id,
        email,
        username,
        ...(roleSupported ? { role: accountType } : {}),
        onboarding_completed: true,
        ...updateData,
      };

      // Ensure email is a string (never null) to satisfy NOT NULL constraint
      payload.email = payload.email ?? '';
      payload.email = String(payload.email);

      // Remove undefined/null values for required fields (but keep empty strings)
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
        if (payload[k] === null) delete payload[k];
      });

      // Debug: log payload being sent to Supabase for diagnostics
      // (will be visible in the browser console)
      try {
        // eslint-disable-next-line no-console
        console.debug('[Onboarding] upsert payload:', { ...payload });
      } catch (e) {}

      // Try upsert including role (if supported). If the request fails due to
      // a missing column (PGRST204) or similar, retry without the role field.
      let upserted: any = null;
      try {
        const res = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'user_id' })
          .select()
          .single();

        if ((res as any).error) throw (res as any).error;
        upserted = (res as any).data;
      } catch (err: any) {
        console.error('Supabase upsert error:', err);

        // If the error indicates the `role` column is missing in the schema,
        // mark role as unsupported and retry without it.
        if (err?.code === 'PGRST204' || /Could not find the 'role' column/.test(err?.message || '')) {
          console.warn('Detected missing `role` column in remote DB. Retrying upsert without role.');
          setRoleSupported(false);

          // Remove role if it causes issues; ensure email remains to satisfy NOT NULL
          const fallbackPayload = { ...payload };
          if ('role' in fallbackPayload) delete fallbackPayload.role;
          // Guarantee email is string on the fallback path too
          fallbackPayload.email = fallbackPayload.email ?? '';
          fallbackPayload.email = String(fallbackPayload.email);
          try {
            // eslint-disable-next-line no-console
            console.debug('[Onboarding] fallback upsert payload:', { ...fallbackPayload });
          } catch (e) {}

          try {
            const res2 = await supabase
              .from('profiles')
              .upsert(fallbackPayload, { onConflict: 'user_id' })
              .select()
              .single();

            if ((res2 as any).error) throw (res2 as any).error;
            upserted = (res2 as any).data;
          } catch (err2) {
            console.error('Supabase fallback upsert error:', err2);
            throw err2;
          }
        } else {
          throw err;
        }
      }

      // Validate the saved role only if the DB supports it.
      if (roleSupported) {
        if (!upserted || upserted.role !== accountType) {
          console.error('Role mismatch after upsert', upserted);
          throw new Error('Failed to persist selected role');
        }
      }

      toast({
        title: "Welcome to Job Talk!",
        description: "Your profile has been set up successfully.",
      });

      // Redirect based on role. If you have dedicated employer/freelancer dashboards,
      // replace these with the correct routes (e.g. '/employer' or '/freelancer').
      // Redirect to role-specific areas (replace with your real routes)
      if (accountType === 'employer') {
        navigate('/hire');
      } else {
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return true;
    if (accountType === 'employer') {
      return companyName.trim() && selectedSkills.length > 0;
    }
    return selectedSkills.length > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-elegant flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImage} alt="Job Talk" className="h-16 w-16" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              Welcome to Job Talk!
            </CardTitle>
            <CardDescription>
              Let's set up your profile to get you started
            </CardDescription>
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">What describes you best?</h3>
                <RadioGroup 
                  value={accountType} 
                  onValueChange={(value: string) => setAccountType(value as 'freelancer' | 'employer')}
                >
                  <div className="space-y-4">
                    <div
                      role="radio"
                      tabIndex={0}
                      aria-checked={accountType === 'freelancer'}
                      onClick={() => setAccountType('freelancer')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAccountType('freelancer'); } }}
                      className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${accountType === 'freelancer' ? 'border-primary bg-primary/5' : ''}`}
                    >
                      {/* Native hidden radio to ensure checked/onChange work reliably */}
                      <input
                        id="freelancer-radio"
                        name="accountType"
                        type="radio"
                        className="sr-only"
                        checked={accountType === 'freelancer'}
                        onChange={() => setAccountType('freelancer')}
                      />
                      <RadioGroupItem value="freelancer" id="freelancer" />
                      <Label htmlFor="freelancer-radio" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <User className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">I'm a Freelancer</div>
                          <div className="text-sm text-muted-foreground">
                            I want to showcase my skills and find work opportunities
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div
                      role="radio"
                      tabIndex={0}
                      aria-checked={accountType === 'employer'}
                      onClick={() => setAccountType('employer')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAccountType('employer'); } }}
                      className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${accountType === 'employer' ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <input
                        id="employer-radio"
                        name="accountType"
                        type="radio"
                        className="sr-only"
                        checked={accountType === 'employer'}
                        onChange={() => setAccountType('employer')}
                      />
                      <RadioGroupItem value="employer" id="employer" />
                      <Label htmlFor="employer-radio" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <Building2 className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">I'm an Employer</div>
                          <div className="text-sm text-muted-foreground">
                            I want to find and hire talented freelancers
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                {selectionError && (
                  <p className="text-sm text-destructive mt-2">{selectionError}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {accountType === 'employer' && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {accountType === 'freelancer' 
                    ? 'What are your skills?' 
                    : 'What job categories do you hire for?'
                  }
                </h3>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(accountType === 'freelancer' ? popularSkills : jobCategories).map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/20"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && (
                          <CheckCircle className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>

                  {selectedSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Selected:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="pr-1">
                            {skill}
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add custom ${accountType === 'freelancer' ? 'skill' : 'category'}`}
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSkill();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addCustomSkill}
                      disabled={!customSkill.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="ml-auto"
            >
              {loading ? 'Saving...' : (currentStep === 2 ? 'Complete Setup' : 'Next')}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;