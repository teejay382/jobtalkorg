import { 
  Scissors, 
  Wrench, 
  Shirt, 
  Hammer, 
  Zap, 
  Droplet, 
  PaintBucket, 
  Car, 
  Home, 
  Laptop, 
  Camera, 
  Truck,
  Leaf,
  Sparkles,
  Users,
  Music,
  ChefHat,
  Heart,
  type LucideIcon
} from 'lucide-react';

export interface LocalServiceCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const LOCAL_SERVICE_CATEGORIES: LocalServiceCategory[] = [
  {
    id: 'barber',
    label: 'Barber/Hairstylist',
    icon: Scissors,
    description: 'Hair cutting, styling, and grooming services'
  },
  {
    id: 'plumber',
    label: 'Plumber',
    icon: Wrench,
    description: 'Pipe repairs, installations, and maintenance'
  },
  {
    id: 'tailor',
    label: 'Tailor/Seamstress',
    icon: Shirt,
    description: 'Clothing alterations and custom sewing'
  },
  {
    id: 'carpenter',
    label: 'Carpenter',
    icon: Hammer,
    description: 'Wood working, furniture making, and repairs'
  },
  {
    id: 'electrician',
    label: 'Electrician',
    icon: Zap,
    description: 'Electrical installations and repairs'
  },
  {
    id: 'roofer',
    label: 'Roofer',
    icon: Home,
    description: 'Roof repairs, installations, and maintenance'
  },
  {
    id: 'painter',
    label: 'Painter',
    icon: PaintBucket,
    description: 'Interior and exterior painting services'
  },
  {
    id: 'mechanic',
    label: 'Auto Mechanic',
    icon: Car,
    description: 'Vehicle repairs and maintenance'
  },
  {
    id: 'hvac',
    label: 'HVAC Technician',
    icon: Droplet,
    description: 'Heating, ventilation, and AC services'
  },
  {
    id: 'it-support',
    label: 'IT Support',
    icon: Laptop,
    description: 'Computer repairs and technical support'
  },
  {
    id: 'photographer',
    label: 'Photographer',
    icon: Camera,
    description: 'Event and portrait photography'
  },
  {
    id: 'moving',
    label: 'Moving Services',
    icon: Truck,
    description: 'Packing, moving, and delivery services'
  },
  {
    id: 'gardener',
    label: 'Gardener/Landscaper',
    icon: Leaf,
    description: 'Garden maintenance and landscaping'
  },
  {
    id: 'cleaner',
    label: 'Cleaner',
    icon: Sparkles,
    description: 'House and office cleaning services'
  },
  {
    id: 'tutor',
    label: 'Tutor',
    icon: Users,
    description: 'Private tutoring and teaching'
  },
  {
    id: 'dj',
    label: 'DJ/Musician',
    icon: Music,
    description: 'Event entertainment and music services'
  },
  {
    id: 'chef',
    label: 'Private Chef/Caterer',
    icon: ChefHat,
    description: 'Cooking and catering services'
  },
  {
    id: 'beautician',
    label: 'Beautician',
    icon: Heart,
    description: 'Beauty treatments, nails, and makeup'
  }
];

export const getServiceCategoryById = (id: string): LocalServiceCategory | undefined => {
  return LOCAL_SERVICE_CATEGORIES.find(category => category.id === id);
};

export const getServiceCategoriesByIds = (ids: string[]): LocalServiceCategory[] => {
  return ids
    .map(id => getServiceCategoryById(id))
    .filter(Boolean) as LocalServiceCategory[];
};

// Helper to calculate distance between two coordinates (client-side)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
};
