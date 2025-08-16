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
  const [accountType, setAccountType] = useState<'freelancer' | 'employer'>('freelancer');
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
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, account_type')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate('/');
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
    if (currentStep === 1) {
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

      const updateData: any = {
        account_type: accountType,
        onboarding_completed: true
      };

      if (accountType === 'employer') {
        updateData.company_name = companyName;
        updateData.skills = selectedSkills; // Job categories for employers
      } else {
        updateData.skills = selectedSkills;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome to Job Talk!",
        description: "Your profile has been set up successfully.",
      });

      navigate('/');
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
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="freelancer" id="freelancer" />
                      <Label htmlFor="freelancer" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <User className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">I'm a Freelancer</div>
                          <div className="text-sm text-muted-foreground">
                            I want to showcase my skills and find work opportunities
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="employer" id="employer" />
                      <Label htmlFor="employer" className="flex items-center space-x-3 cursor-pointer flex-1">
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