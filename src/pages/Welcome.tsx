import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Users, Briefcase, Search, Upload, MessageSquare } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import heroImage from '@/assets/hero-image.jpg';

const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: 'Video Showcases',
      description: 'Showcase your skills through authentic video portfolios that stand out'
    },
    {
      icon: Users,
      title: 'Connect Directly',
      description: 'Bridge the gap between talented freelancers and employers'
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find the perfect match with intelligent filtering and recommendations'
    },
    {
      icon: MessageSquare,
      title: 'Real-time Chat',
      description: 'Communicate instantly with potential clients or talent'
    },
    {
      icon: Upload,
      title: 'Easy Upload',
      description: 'Upload and compress videos seamlessly with our built-in tools'
    },
    {
      icon: Briefcase,
      title: 'Hire with Confidence',
      description: 'Make informed decisions based on real video demonstrations'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-elegant opacity-90" />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left space-y-6">
              <div className="flex justify-center md:justify-start">
                <img src={logoImage} alt="JobTolk Logo" className="h-20 w-20 md:h-24 md:w-24" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Welcome to <span className="text-primary">JobTolk</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Connect freelancers and employers through authentic video showcases
              </p>
              <p className="text-lg text-muted-foreground">
                Discover talent beyond resumes. See skills in action. Make better hiring decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => navigate('/auth?signup=true')}
                >
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="hidden md:block">
              <div className="relative rounded-2xl overflow-hidden shadow-elegant">
                <img 
                  src={heroImage} 
                  alt="JobTolk Platform" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            JobTolk provides powerful tools for freelancers to showcase their work and for employers to find the perfect talent
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Career or Business?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of freelancers and employers already using JobTolk to connect and succeed
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate('/auth?signup=true')}
            >
              Create Your Account
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              Already Have an Account?
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 JobTolk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
