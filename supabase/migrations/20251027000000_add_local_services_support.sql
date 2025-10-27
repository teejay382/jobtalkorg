-- Migration: Add Local Services Support
-- Date: 2025-10-27
-- Description: Adds fields for local service providers including location, service categories

-- Add new fields to profiles table for local services
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('remote', 'local')),
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS service_categories TEXT[];

-- Create index for geospatial queries (using PostGIS-like approach)
-- For efficient nearby provider searches
CREATE INDEX IF NOT EXISTS idx_profiles_location 
  ON public.profiles (latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index on service_type for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_service_type 
  ON public.profiles (service_type) 
  WHERE service_type IS NOT NULL;

-- Create index on service_categories for category-based searches
CREATE INDEX IF NOT EXISTS idx_profiles_service_categories 
  ON public.profiles USING GIN (service_categories) 
  WHERE service_categories IS NOT NULL;

-- Create a function to calculate distance between two points (Haversine formula)
-- Returns distance in kilometers
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R DOUBLE PRECISION := 6371; -- Earth's radius in kilometers
  dLat DOUBLE PRECISION;
  dLon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Convert degrees to radians
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- Create a function to find nearby local service providers
CREATE OR REPLACE FUNCTION public.find_nearby_providers(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  max_distance DOUBLE PRECISION DEFAULT 50, -- Default 50km radius
  service_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  service_categories TEXT[],
  location_city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.service_categories,
    p.location_city,
    p.latitude,
    p.longitude,
    public.calculate_distance(user_lat, user_lon, p.latitude, p.longitude) as distance
  FROM public.profiles p
  WHERE 
    p.service_type = 'local'
    AND p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND (service_category IS NULL OR service_category = ANY(p.service_categories))
    AND public.calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= max_distance
  ORDER BY distance ASC;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.service_type IS 
'Indicates whether the freelancer offers remote or local services';

COMMENT ON COLUMN public.profiles.location_city IS 
'City/location name for local service providers';

COMMENT ON COLUMN public.profiles.latitude IS 
'Latitude coordinate for local service provider location';

COMMENT ON COLUMN public.profiles.longitude IS 
'Longitude coordinate for local service provider location';

COMMENT ON COLUMN public.profiles.service_categories IS 
'Array of service categories (e.g., barber, plumber, tailor) for local service providers';

COMMENT ON FUNCTION public.calculate_distance IS 
'Calculates distance in kilometers between two geographic coordinates using the Haversine formula';

COMMENT ON FUNCTION public.find_nearby_providers IS 
'Finds local service providers within a specified radius of given coordinates';
