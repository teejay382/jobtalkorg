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
      <section className="relative overflow-hidden bg-gradient-elegant">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left space-y-8">
              <div className="flex justify-center md:justify-start">
                <div className="p-3 rounded-3xl bg-white shadow-elegant">
                  <img src={logoImage} alt="JobTolk Logo" className="h-16 w-16 md:h-20 md:w-20" />
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
                  👋 Welcome to{' '}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    JobTolk
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
                  Find work. Show your skill.
                </p>
                <p className="text-base md:text-lg text-muted-foreground">
                  JobTolk helps you find real jobs — online or around you. Just show what you can do.
                </p>
                <p className="text-sm text-muted-foreground/80 italic">
                  No long forms. Just tell us what you do — we'll help people find you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Button 
                  size="lg" 
                  className="text-lg px-10 py-6 rounded-2xl shadow-strong hover:shadow-glow transition-smooth font-semibold"
                  onClick={() => navigate('/auth?signup=true')}
                >
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-6 rounded-2xl font-semibold border-2"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="hidden md:block">
              <div className="relative rounded-3xl overflow-hidden shadow-elegant hover:shadow-strong transition-smooth">
                <img 
                  src={heroImage} 
                  alt="JobTolk Platform" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            JobTolk provides powerful tools for freelancers to showcase their work and for employers to find the perfect talent
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-8 hover:shadow-strong transition-smooth border-2 rounded-2xl group">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-smooth">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-24">
        <div className="container mx-auto px-4 text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Career or Business?
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join thousands of freelancers and employers already using JobTolk to connect and succeed
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 rounded-2xl shadow-strong hover:shadow-glow transition-smooth font-semibold"
              onClick={() => navigate('/auth?signup=true')}
            >
              Create Your Account
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-10 py-6 rounded-2xl font-semibold border-2"
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
          <p className="text-sm">Powered by JobTolk community • &copy; 2025 JobTolk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
