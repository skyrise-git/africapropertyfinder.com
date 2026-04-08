-- ============================================================
-- Africa Property Finder — Complete Database Setup
-- Run this ONCE in the Supabase SQL Editor on a fresh project
-- ============================================================

-- ============================================================
-- PART 1: Crime Stations Table
-- ============================================================

CREATE TABLE crime_stations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  station text NOT NULL UNIQUE,
  district text NOT NULL,
  province text NOT NULL,
  safety_rating smallint NOT NULL CHECK (safety_rating BETWEEN 1 AND 5),
  safety_label text NOT NULL CHECK (
    safety_label IN ('Very Safe', 'Safe', 'Moderate', 'High Risk', 'Very High Risk')
  ),
  crime_index numeric(5,1) NOT NULL CHECK (crime_index >= 0 AND crime_index <= 100),
  total_serious_crimes_q1_2025 integer NOT NULL DEFAULT 0,
  total_serious_crimes_q1_2024 integer NOT NULL DEFAULT 0,
  trend text NOT NULL CHECK (trend IN ('Improving', 'Stable', 'Worsening')),
  crime_breakdown jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crime_stations_province ON crime_stations (province);
CREATE INDEX idx_crime_stations_district ON crime_stations (district);
CREATE INDEX idx_crime_stations_safety_rating ON crime_stations (safety_rating);
CREATE INDEX idx_crime_stations_trend ON crime_stations (trend);
CREATE INDEX idx_crime_stations_station_lower ON crime_stations (lower(station));

ALTER TABLE crime_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON crime_stations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crime_stations_updated_at
  BEFORE UPDATE ON crime_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE crime_stations IS 'SAPS crime statistics per police station — Q1 2025/2026';
COMMENT ON COLUMN crime_stations.safety_rating IS '1 = Very High Risk, 5 = Very Safe';
COMMENT ON COLUMN crime_stations.crime_index IS 'Normalised index 0–100 (100 = highest crime)';
COMMENT ON COLUMN crime_stations.crime_breakdown IS 'JSON object mapping crime category → count';


-- ============================================================
-- PART 2: Application Tables
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  uid text GENERATED ALWAYS AS (id::text) STORED,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  "profilePicture" text,
  "profilePictureFileKey" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Properties
CREATE TABLE properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  "listingType" text NOT NULL CHECK ("listingType" IN ('sale', 'rent', 'student-housing')),
  "propertyType" text NOT NULL CHECK ("propertyType" IN ('apartment', 'house', 'condo', 'townhouse', 'studio', 'room', 'other')),
  "numBedrooms" integer NOT NULL DEFAULT 0,
  "numBathrooms" integer NOT NULL DEFAULT 0,
  furnishing text NOT NULL DEFAULT 'unfurnished' CHECK (furnishing IN ('furnished', 'semi-furnished', 'unfurnished')),
  area numeric,
  "floorNumber" integer,
  "totalFloors" integer,
  price numeric,
  rent numeric,
  "securityDeposit" numeric,
  "leaseLength" integer,
  "availableFrom" text,
  "paymentFrequency" text CHECK ("paymentFrequency" IS NULL OR "paymentFrequency" IN ('monthly', 'weekly', 'yearly')),
  "utilitiesIncluded" boolean DEFAULT false,
  "isShared" boolean DEFAULT false,
  "sharingDetails" jsonb,
  "parkingAvailable" boolean DEFAULT false,
  laundry boolean DEFAULT false,
  "heatingCooling" boolean DEFAULT false,
  balcony boolean DEFAULT false,
  wifi boolean DEFAULT false,
  gym boolean DEFAULT false,
  pool boolean DEFAULT false,
  elevator boolean DEFAULT false,
  security boolean DEFAULT false,
  garden boolean DEFAULT false,
  dishwasher boolean DEFAULT false,
  fireplace boolean DEFAULT false,
  "otherAmenities" text,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  "zipCode" text DEFAULT '',
  "nearbyTransit" text,
  location jsonb NOT NULL DEFAULT '{"latitude":0,"longitude":0}',
  "smokingAllowed" boolean DEFAULT false,
  "petsAllowed" boolean DEFAULT false,
  "guestsAllowed" boolean DEFAULT false,
  "sublettingAllowed" boolean DEFAULT false,
  "partiesAllowed" boolean DEFAULT false,
  "quietHours" boolean DEFAULT false,
  "maintenanceResponsibility" boolean DEFAULT false,
  "contactName" text NOT NULL DEFAULT '',
  "preferredContactMethod" jsonb DEFAULT '[]',
  "contactInfo" jsonb DEFAULT '{}',
  "viewingAvailability" text,
  images jsonb NOT NULL DEFAULT '[]',
  "videoTourUrl" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create properties"
  ON properties FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE TO authenticated
  USING (auth.uid() = "userId" OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE TO authenticated
  USING (auth.uid() = "userId" OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE INDEX idx_properties_userId ON properties ("userId");
CREATE INDEX idx_properties_listingType ON properties ("listingType");
CREATE INDEX idx_properties_city ON properties (city);
CREATE INDEX idx_properties_state ON properties (state);

-- 3. Saved Properties
CREATE TABLE "savedProperties" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "propertyId" uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  UNIQUE ("userId", "propertyId")
);

ALTER TABLE "savedProperties" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved properties"
  ON "savedProperties" FOR SELECT TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Users can save properties"
  ON "savedProperties" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can unsave properties"
  ON "savedProperties" FOR DELETE TO authenticated
  USING (auth.uid() = "userId");

-- 4. Contacts
CREATE TABLE contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  "repliedAt" timestamptz,
  "repliedBy" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact"
  ON contacts FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and staff can view contacts"
  ON contacts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Admins and staff can update contacts"
  ON contacts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Admins can delete contacts"
  ON contacts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Blogs
CREATE TABLE blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}',
  excerpt text NOT NULL DEFAULT '',
  "coverImage" text,
  "coverImageFileKey" text,
  author text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('health', 'news', 'tips', 'wellness', 'research', 'general')),
  tags jsonb DEFAULT '[]',
  "publishedAt" bigint,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published blogs are viewable by everyone"
  ON blogs FOR SELECT USING (true);

CREATE POLICY "Admins and staff can create blogs"
  ON blogs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Admins and staff can update blogs"
  ON blogs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Admins can delete blogs"
  ON blogs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_blogs_slug ON blogs (slug);
CREATE INDEX idx_blogs_status ON blogs (status);
CREATE INDEX idx_blogs_category ON blogs (category);

-- 6. Appointments
CREATE TABLE appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "propertyId" uuid REFERENCES properties(id) ON DELETE CASCADE,
  "propertyTitle" text,
  date text NOT NULL,
  time text NOT NULL,
  "tourType" text DEFAULT 'in-person',
  "contactName" text,
  "contactEmail" text,
  "contactPhone" text,
  "requestedBy" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT TO authenticated
  USING (
    ("requestedBy" ->> 'uid') = auth.uid()::text
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- 7. Attendance
CREATE TABLE attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "staffId" uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "staffName" text NOT NULL,
  date text NOT NULL,
  "punchInTime" bigint NOT NULL,
  "punchOutTime" bigint,
  "punchInLocation" jsonb NOT NULL,
  "punchOutLocation" jsonb,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent')),
  notes text,
  "totalHours" numeric,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own attendance"
  ON attendance FOR SELECT TO authenticated
  USING (
    auth.uid() = "staffId"
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can create own attendance"
  ON attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "staffId");

CREATE POLICY "Staff can update own attendance"
  ON attendance FOR UPDATE TO authenticated
  USING (auth.uid() = "staffId" OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_attendance_staffId ON attendance ("staffId");
CREATE INDEX idx_attendance_date ON attendance (date);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE "savedProperties";
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;


-- ============================================================
-- PART 3: Seed Data
-- ============================================================

-- 1. AUTH USERS & PROFILES
-- Password for all seed users: Password123!

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'admin@africapropertyfinder.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"Thabo Mokoena","role":"admin"}', '2025-01-10T08:00:00Z', now(), false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'naledi@africapropertyfinder.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"Naledi Dlamini","role":"staff"}', '2025-02-01T09:00:00Z', now(), false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'james@africapropertyfinder.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"James van der Merwe","role":"staff"}', '2025-02-15T10:00:00Z', now(), false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'sipho@gmail.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"Sipho Ndlovu","role":"user"}', '2025-03-01T12:00:00Z', now(), false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
   'zanele@outlook.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"Zanele Khumalo","role":"user"}', '2025-03-10T14:00:00Z', now(), false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
   'david.t@gmail.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"David Thompson","role":"user"}', '2025-04-05T08:30:00Z', now(), false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated',
   'fatima.patel@yahoo.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"Fatima Patel","role":"user"}', '2025-04-20T16:00:00Z', now(), false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated',
   'lerato.m@icloud.com', crypt('Password123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"name":"Lerato Molefe","role":"user"}', '2025-05-01T11:00:00Z', now(), false, false)
ON CONFLICT (id) DO NOTHING;

UPDATE profiles SET phone = '+27 11 234 5678', role = 'admin'  WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE profiles SET phone = '+27 21 345 6789', role = 'staff'  WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE profiles SET phone = '+27 31 456 7890', role = 'staff'  WHERE id = '00000000-0000-0000-0000-000000000003';
UPDATE profiles SET phone = '+27 82 100 2001' WHERE id = '00000000-0000-0000-0000-000000000004';
UPDATE profiles SET phone = '+27 83 200 3002' WHERE id = '00000000-0000-0000-0000-000000000005';
UPDATE profiles SET phone = '+27 84 300 4003' WHERE id = '00000000-0000-0000-0000-000000000006';
UPDATE profiles SET phone = '+27 72 400 5004' WHERE id = '00000000-0000-0000-0000-000000000007';
UPDATE profiles SET phone = '+27 61 500 6005' WHERE id = '00000000-0000-0000-0000-000000000008';


-- 2. PROPERTIES (20 listings across South Africa)

INSERT INTO properties (
  id, "userId", title, "listingType", "propertyType",
  "numBedrooms", "numBathrooms", furnishing, area, price, rent,
  "securityDeposit", "leaseLength", "paymentFrequency",
  "parkingAvailable", wifi, security, pool, gym, garden, balcony, elevator, laundry,
  "heatingCooling", dishwasher, fireplace,
  address, city, state, "zipCode", location,
  "contactName", "preferredContactMethod", "contactInfo",
  images, "createdAt"
) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
 'Modern Sea Point Apartment with Ocean Views', 'rent', 'apartment',
 2, 2, 'furnished', 85, NULL, 28000, 28000, 12, 'monthly',
 true, true, true, true, true, false, true, true, true, true, true, false,
 '45 Beach Road, Sea Point', 'Cape Town Central', 'Western Cape', '8005',
 '{"latitude":-33.9173,"longitude":18.3882}',
 'Sipho Ndlovu', '["phone","email"]', '{"phone":"+27 82 100 2001","email":"sipho@gmail.com"}',
 '[{"url":"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop","path":"properties/1","fileKey":"seed-1"}]',
 '2025-06-01T10:00:00Z'),

('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006',
 'Stellenbosch Wine Estate Family Home', 'sale', 'house',
 5, 3, 'unfurnished', 320, 8500000, NULL, NULL, NULL, NULL,
 true, true, true, true, false, true, false, false, true, true, true, true,
 '12 Dorp Street, Stellenbosch Central', 'Stellenbosch', 'Western Cape', '7600',
 '{"latitude":-33.9346,"longitude":18.8602}',
 'David Thompson', '["email"]', '{"email":"david.t@gmail.com"}',
 '[{"url":"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop","path":"properties/2","fileKey":"seed-2"}]',
 '2025-05-20T14:00:00Z'),

('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005',
 'Camps Bay Luxury Villa with Private Pool', 'sale', 'house',
 4, 4, 'furnished', 280, 15900000, NULL, NULL, NULL, NULL,
 true, true, true, true, false, true, true, false, true, true, true, true,
 '8 Theresa Avenue, Camps Bay', 'Camps Bay', 'Western Cape', '8040',
 '{"latitude":-33.9505,"longitude":18.3779}',
 'David Thompson', '["phone","email"]', '{"phone":"+27 84 300 4003","email":"david.t@gmail.com"}',
 '[{"url":"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop","path":"properties/3","fileKey":"seed-3"}]',
 '2025-06-10T09:00:00Z'),

('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007',
 'George Garden Route Townhouse', 'sale', 'townhouse',
 3, 2, 'semi-furnished', 145, 2200000, NULL, NULL, NULL, NULL,
 true, true, true, false, false, true, false, false, false, false, false, false,
 '23 York Street, George', 'George', 'Western Cape', '6530',
 '{"latitude":-33.9631,"longitude":22.4617}',
 'Fatima Patel', '["phone"]', '{"phone":"+27 72 400 5004"}',
 '[{"url":"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop","path":"properties/4","fileKey":"seed-4"}]',
 '2025-04-15T11:00:00Z'),

('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004',
 'Sandton Executive Penthouse', 'rent', 'apartment',
 3, 2, 'furnished', 180, NULL, 45000, 45000, 12, 'monthly',
 true, true, true, true, true, false, true, true, true, true, true, false,
 '135 Rivonia Road, Sandton', 'Sandton', 'Gauteng', '2196',
 '{"latitude":-26.1076,"longitude":28.0567}',
 'Sipho Ndlovu', '["phone","email"]', '{"phone":"+27 82 100 2001","email":"sipho@gmail.com"}',
 '[{"url":"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop","path":"properties/5","fileKey":"seed-5"}]',
 '2025-06-05T08:00:00Z'),

('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005',
 'Midrand Modern Family Home with Garden', 'sale', 'house',
 4, 3, 'unfurnished', 240, 3200000, NULL, NULL, NULL, NULL,
 true, true, true, false, false, true, false, false, true, false, false, false,
 '88 Lever Road, Midrand', 'Midrand', 'Gauteng', '1685',
 '{"latitude":-25.9891,"longitude":28.1279}',
 'Zanele Khumalo', '["phone","email"]', '{"phone":"+27 83 200 3002","email":"zanele@outlook.com"}',
 '[{"url":"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop","path":"properties/6","fileKey":"seed-6"}]',
 '2025-05-25T13:00:00Z'),

('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006',
 'Kempton Park 2-Bed near OR Tambo', 'rent', 'apartment',
 2, 1, 'semi-furnished', 72, NULL, 12000, 12000, 6, 'monthly',
 true, true, false, false, false, false, false, false, true, false, false, false,
 '5 Atlas Road, Kempton Park', 'Kempton Park', 'Gauteng', '1619',
 '{"latitude":-26.0996,"longitude":28.2350}',
 'David Thompson', '["email"]', '{"email":"david.t@gmail.com"}',
 '[{"url":"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop","path":"properties/7","fileKey":"seed-7"}]',
 '2025-06-12T10:00:00Z'),

('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008',
 'Pretoria East Secure Estate Home', 'sale', 'house',
 3, 2, 'unfurnished', 195, 2800000, NULL, NULL, NULL, NULL,
 true, true, true, true, false, true, false, false, false, true, false, true,
 '14 Garsfontein Drive, Pretoria', 'Akasia', 'Gauteng', '0081',
 '{"latitude":-25.7479,"longitude":28.1877}',
 'Lerato Molefe', '["phone"]', '{"phone":"+27 61 500 6005"}',
 '[{"url":"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop","path":"properties/8","fileKey":"seed-8"}]',
 '2025-03-28T15:00:00Z'),

('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000007',
 'Krugersdorp Cozy Studio Apartment', 'rent', 'studio',
 0, 1, 'furnished', 35, NULL, 5500, 5500, 3, 'monthly',
 false, true, false, false, false, false, false, false, false, false, false, false,
 '22 Luipaard Street, Krugersdorp', 'Krugersdorp', 'Gauteng', '1739',
 '{"latitude":-26.1015,"longitude":27.7745}',
 'Fatima Patel', '["phone","email"]', '{"phone":"+27 72 400 5004","email":"fatima.patel@yahoo.com"}',
 '[{"url":"https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop","path":"properties/9","fileKey":"seed-9"}]',
 '2025-06-15T09:30:00Z'),

('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000005',
 'Durban Beachfront Condo with Sea Views', 'sale', 'condo',
 3, 2, 'furnished', 130, 4200000, NULL, NULL, NULL, NULL,
 true, true, true, true, true, false, true, true, true, true, true, false,
 '100 Snell Parade, Durban Central', 'Durban Central', 'KwaZulu-Natal', '4001',
 '{"latitude":-29.8587,"longitude":31.0218}',
 'Zanele Khumalo', '["phone","email"]', '{"phone":"+27 83 200 3002","email":"zanele@outlook.com"}',
 '[{"url":"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop","path":"properties/10","fileKey":"seed-10"}]',
 '2025-05-10T12:00:00Z'),

('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004',
 'Pietermaritzburg Student Accommodation', 'student-housing', 'room',
 1, 1, 'furnished', 18, NULL, 3500, 3500, 12, 'monthly',
 false, true, true, false, false, false, false, false, true, false, false, false,
 '55 Langalibalele Street, PMB', 'Pietermaritzburg', 'KwaZulu-Natal', '3201',
 '{"latitude":-29.5989,"longitude":30.3791}',
 'Sipho Ndlovu', '["phone"]', '{"phone":"+27 82 100 2001"}',
 '[{"url":"https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop","path":"properties/11","fileKey":"seed-11"}]',
 '2025-06-08T11:00:00Z'),

('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000008',
 'Richards Bay Family Home near Beach', 'sale', 'house',
 4, 2, 'unfurnished', 200, 1850000, NULL, NULL, NULL, NULL,
 true, true, false, false, false, true, false, false, false, false, false, false,
 '31 Dorado Drive, Richards Bay', 'Richards Bay', 'KwaZulu-Natal', '3900',
 '{"latitude":-28.7830,"longitude":32.0558}',
 'Lerato Molefe', '["email"]', '{"email":"lerato.m@icloud.com"}',
 '[{"url":"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop","path":"properties/12","fileKey":"seed-12"}]',
 '2025-04-22T16:00:00Z'),

('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000006',
 'East London Nahoon Beach House', 'sale', 'house',
 3, 2, 'semi-furnished', 175, 2950000, NULL, NULL, NULL, NULL,
 true, true, true, false, false, true, true, false, false, false, false, true,
 '7 Beach Road, Nahoon', 'East London', 'Eastern Cape', '5241',
 '{"latitude":-32.9884,"longitude":27.9402}',
 'David Thompson', '["phone","email"]', '{"phone":"+27 84 300 4003","email":"david.t@gmail.com"}',
 '[{"url":"https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop","path":"properties/13","fileKey":"seed-13"}]',
 '2025-05-05T10:00:00Z'),

('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000007',
 'Mthatha Central 3-Bed Apartment', 'rent', 'apartment',
 3, 1, 'unfurnished', 90, NULL, 8500, 8500, 12, 'monthly',
 true, true, false, false, false, false, true, false, false, false, false, false,
 '19 Sutherland Street, Mthatha', 'Mthatha', 'Eastern Cape', '5099',
 '{"latitude":-31.5889,"longitude":28.7844}',
 'Fatima Patel', '["phone"]', '{"phone":"+27 72 400 5004"}',
 '[{"url":"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop","path":"properties/14","fileKey":"seed-14"}]',
 '2025-06-02T14:00:00Z'),

('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000005',
 'Bloemfontein Westdene Charming Home', 'sale', 'house',
 3, 2, 'unfurnished', 160, 1450000, NULL, NULL, NULL, NULL,
 true, true, false, false, false, true, false, false, false, false, false, true,
 '42 President Brand Street, Westdene', 'Bloemspruit', 'Free State', '9301',
 '{"latitude":-29.1188,"longitude":26.2096}',
 'Zanele Khumalo', '["email"]', '{"email":"zanele@outlook.com"}',
 '[{"url":"https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop","path":"properties/15","fileKey":"seed-15"}]',
 '2025-04-10T09:00:00Z'),

('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000008',
 'Polokwane CBD Modern Flat', 'rent', 'apartment',
 2, 1, 'furnished', 65, NULL, 9000, 9000, 6, 'monthly',
 true, true, true, false, false, false, false, true, false, false, false, false,
 '10 Thabo Mbeki Street, Polokwane CBD', 'Polokwane', 'Limpopo', '0700',
 '{"latitude":-23.9045,"longitude":29.4689}',
 'Lerato Molefe', '["phone","email"]', '{"phone":"+27 61 500 6005","email":"lerato.m@icloud.com"}',
 '[{"url":"https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop","path":"properties/16","fileKey":"seed-16"}]',
 '2025-05-30T10:30:00Z'),

('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000004',
 'Nelspruit Riverside Townhouse', 'sale', 'townhouse',
 3, 2, 'semi-furnished', 140, 2100000, NULL, NULL, NULL, NULL,
 true, true, true, false, false, true, false, false, false, false, false, false,
 '6 Ferreira Street, Nelspruit', 'Nelspruit', 'Mpumalanga', '1200',
 '{"latitude":-25.4753,"longitude":30.9694}',
 'Sipho Ndlovu', '["phone"]', '{"phone":"+27 82 100 2001"}',
 '[{"url":"https://images.unsplash.com/photo-1625602812206-5ec545ca1231?w=800&h=600&fit=crop","path":"properties/17","fileKey":"seed-17"}]',
 '2025-03-15T13:00:00Z'),

('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000006',
 'Rustenburg Bush Estate with Pool', 'sale', 'house',
 4, 3, 'unfurnished', 260, 3800000, NULL, NULL, NULL, NULL,
 true, true, true, true, false, true, false, false, true, true, false, true,
 '99 Beyers Naude Drive, Rustenburg', 'Rustenburg', 'North West', '0299',
 '{"latitude":-25.6715,"longitude":27.2420}',
 'David Thompson', '["phone","email"]', '{"phone":"+27 84 300 4003","email":"david.t@gmail.com"}',
 '[{"url":"https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop","path":"properties/18","fileKey":"seed-18"}]',
 '2025-04-30T15:30:00Z'),

('10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000007',
 'Kimberley Heritage Cottage', 'sale', 'house',
 2, 1, 'unfurnished', 110, 890000, NULL, NULL, NULL, NULL,
 true, true, false, false, false, true, false, false, false, false, false, true,
 '15 Du Toitspan Road, Kimberley', 'Kimberley', 'Northern Cape', '8301',
 '{"latitude":-28.7384,"longitude":24.7637}',
 'Fatima Patel', '["email"]', '{"email":"fatima.patel@yahoo.com"}',
 '[{"url":"https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop","path":"properties/19","fileKey":"seed-19"}]',
 '2025-05-15T08:00:00Z'),

('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000005',
 'Hatfield Student Commune near UP', 'student-housing', 'room',
 1, 1, 'furnished', 16, NULL, 4200, 4200, 12, 'monthly',
 false, true, true, false, false, false, false, false, true, false, false, false,
 '220 Festival Street, Hatfield', 'Akasia', 'Gauteng', '0083',
 '{"latitude":-25.7479,"longitude":28.2293}',
 'Zanele Khumalo', '["phone","email"]', '{"phone":"+27 83 200 3002","email":"zanele@outlook.com"}',
 '[{"url":"https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop","path":"properties/20","fileKey":"seed-20"}]',
 '2025-06-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- 3. BLOGS (6 articles)

INSERT INTO blogs (
  id, title, slug, excerpt, content, author, category, tags,
  status, featured, "publishedAt", "createdAt"
) VALUES
('20000000-0000-0000-0000-000000000001',
 'Top 10 Safest Neighbourhoods in South Africa for 2025',
 'top-10-safest-neighbourhoods-south-africa-2025',
 'Discover the safest areas to buy property in South Africa based on the latest SAPS crime statistics and our safety rating system.',
 '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Based on our analysis of the latest SAPS Q1 2025 crime statistics covering 1,172 police station areas, we have identified the safest neighbourhoods across all nine provinces. Areas like Camps Bay in the Western Cape, Clarens in the Free State, and Aberdeen in the Eastern Cape top the list with safety ratings of 5/5."}]},{"type":"paragraph","content":[{"type":"text","text":"Our safety rating system considers total serious crimes, year-on-year trends, and crime index scores to give each area a rating from 1 (Very High Risk) to 5 (Very Safe). When buying property, safety should be a top consideration alongside price, amenities, and location."}]}]}',
 '00000000-0000-0000-0000-000000000001', 'tips', '["safety","property","investment"]',
 'published', true, 1717200000000, '2025-06-01T08:00:00Z'),

('20000000-0000-0000-0000-000000000002',
 'Property Market Trends: Cape Town vs Johannesburg 2025',
 'property-market-trends-cape-town-vs-johannesburg-2025',
 'A detailed comparison of property market dynamics in South Africa''s two largest metro areas.',
 '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"The South African property market continues to show divergent trends between Cape Town and Johannesburg. Cape Town''s Atlantic Seaboard remains the premium market with prices exceeding R15 million for luxury homes, while Johannesburg''s Sandton district leads the Gauteng market for high-end rentals."}]},{"type":"paragraph","content":[{"type":"text","text":"Key findings: Cape Town average price growth is 8% YoY, Johannesburg suburban areas show strong rental demand, and first-time buyer activity is increasing in both metros. Safety ratings also play a growing role in property valuations."}]}]}',
 '00000000-0000-0000-0000-000000000002', 'news', '["market","cape-town","johannesburg","trends"]',
 'published', true, 1716508800000, '2025-05-24T10:00:00Z'),

('20000000-0000-0000-0000-000000000003',
 'First-Time Buyer''s Guide to South African Property',
 'first-time-buyers-guide-south-african-property',
 'Everything you need to know about purchasing your first home in South Africa, from bond applications to transfer costs.',
 '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Buying your first property is one of the biggest financial decisions you will ever make. In South Africa, the process involves several steps: getting pre-qualified for a bond, finding the right property, making an offer, and navigating the transfer process."}]},{"type":"paragraph","content":[{"type":"text","text":"Transfer costs typically range from 8-13% of the purchase price for properties below R1.1 million (transfer duty exempt). Always factor in bond registration costs, attorney fees, and moving expenses. Use our safety ratings to ensure you are investing in a secure neighbourhood."}]}]}',
 '00000000-0000-0000-0000-000000000003', 'tips', '["buying","guide","first-time"]',
 'published', false, 1715817600000, '2025-05-16T14:00:00Z'),

('20000000-0000-0000-0000-000000000004',
 'Understanding Crime Statistics: How We Rate Area Safety',
 'understanding-crime-statistics-how-we-rate-area-safety',
 'A deep dive into our safety rating methodology, data sources, and what the numbers mean for property buyers.',
 '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Africa Property Finder''s safety ratings are derived from official SAPS (South African Police Service) crime statistics released quarterly. We analyse data from 1,172 police station areas across all nine provinces, covering 17 categories of serious crime."}]},{"type":"paragraph","content":[{"type":"text","text":"Our 5-point rating scale: 5 (Very Safe) = crime index below 15, 4 (Safe) = index 15-25, 3 (Moderate) = index 25-50, 2 (High Risk) = index 50-80, 1 (Very High Risk) = index above 80. The trend indicator (Improving/Stable/Worsening) compares Q1 2025 vs Q1 2024 totals."}]}]}',
 '00000000-0000-0000-0000-000000000001', 'research', '["safety","methodology","data"]',
 'published', false, 1715126400000, '2025-05-08T09:00:00Z'),

('20000000-0000-0000-0000-000000000005',
 'Student Housing Guide: Best Areas Near SA Universities',
 'student-housing-guide-best-areas-near-sa-universities',
 'Find safe and affordable student accommodation near South Africa''s top universities.',
 '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"With university fees rising, finding affordable yet safe student accommodation is crucial. We highlight the best areas near UCT, Wits, University of Pretoria, Stellenbosch University, and UKZN."}]},{"type":"paragraph","content":[{"type":"text","text":"Top picks: Hatfield (Pretoria) for UP students, Braamfontein for Wits, Rondebosch for UCT, and Stellenbosch Central for Maties. Always check the area safety rating before signing a lease — your safety is non-negotiable."}]}]}',
 '00000000-0000-0000-0000-000000000002', 'tips', '["students","accommodation","universities"]',
 'published', false, 1714435200000, '2025-04-30T12:00:00Z'),

('20000000-0000-0000-0000-000000000006',
 'Investing in Rental Properties: Gauteng Hotspots',
 'investing-rental-properties-gauteng-hotspots',
 'Draft analysis of the best suburbs in Gauteng for rental property investment returns.',
 '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Gauteng continues to be South Africa''s rental property hub. Key investment areas include Sandton, Midrand, Kempton Park, and emerging suburbs in Tshwane. Rental yields average 7-9% in these areas."}]}]}',
 '00000000-0000-0000-0000-000000000003', 'tips', '["investment","rental","gauteng"]',
 'draft', false, NULL, '2025-06-10T16:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- 4. CONTACTS (6 submissions)

INSERT INTO contacts (
  id, name, email, phone, subject, message, status, "repliedAt", "repliedBy", "createdAt"
) VALUES
('30000000-0000-0000-0000-000000000001',
 'Andile Mthembu', 'andile@gmail.com', '+27 78 111 2222',
 'Property Viewing Request',
 'Hi, I would like to schedule a viewing for the Sandton Penthouse listed on your site. I am available on weekday evenings. Please advise.',
 'replied', '2025-06-06T10:00:00Z', '00000000-0000-0000-0000-000000000002', '2025-06-05T14:30:00Z'),

('30000000-0000-0000-0000-000000000002',
 'Sarah de Villiers', 'sarah.dv@outlook.com', '+27 82 333 4444',
 'Question about Safety Ratings',
 'How often are your safety ratings updated? I am comparing suburbs in the Western Cape and want to make sure the data is current.',
 'read', NULL, NULL, '2025-06-08T09:15:00Z'),

('30000000-0000-0000-0000-000000000003',
 'Mohammed Khan', 'mkhan@yahoo.com', NULL,
 'Partnership Inquiry',
 'I am a property developer based in Durban and would like to discuss a partnership to list our new development on Africa Property Finder. Please contact me.',
 'new', NULL, NULL, '2025-06-12T16:45:00Z'),

('30000000-0000-0000-0000-000000000004',
 'Precious Nkosi', 'precious.n@gmail.com', '+27 71 555 6666',
 'Report Incorrect Listing',
 'The property at 88 Lever Road, Midrand seems to have incorrect pricing. I visited the property and the agent quoted a different amount. Please verify.',
 'new', NULL, NULL, '2025-06-14T11:20:00Z'),

('30000000-0000-0000-0000-000000000005',
 'Jean-Pierre Joubert', 'jp.joubert@icloud.com', '+27 83 777 8888',
 'Advertising Enquiry',
 'I am an estate agent in the Garden Route area. I would like to know about advertising options on your platform for my listings.',
 'archived', '2025-06-02T08:00:00Z', '00000000-0000-0000-0000-000000000001', '2025-05-30T10:00:00Z'),

('30000000-0000-0000-0000-000000000006',
 'Thandi Zulu', 'thandi.z@student.ac.za', NULL,
 'Student Housing Help',
 'I am a second-year student at UKZN and struggling to find safe accommodation near campus. Do you have any student housing options in Pietermaritzburg?',
 'replied', '2025-06-10T09:00:00Z', '00000000-0000-0000-0000-000000000003', '2025-06-09T13:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- 5. APPOINTMENTS (5 viewing bookings)

INSERT INTO appointments (
  id, "propertyId", "propertyTitle", date, time, "tourType",
  "contactName", "contactEmail", "contactPhone", "requestedBy", "createdAt"
) VALUES
('40000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000005', 'Sandton Executive Penthouse',
 '2025-06-20', '14:00', 'in-person',
 'Andile Mthembu', 'andile@gmail.com', '+27 78 111 2222',
 '{"uid":"00000000-0000-0000-0000-000000000006","name":"David Thompson","email":"david.t@gmail.com"}',
 '2025-06-13T10:00:00Z'),

('40000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000003', 'Camps Bay Luxury Villa with Private Pool',
 '2025-06-22', '10:00', 'video',
 'Sarah de Villiers', 'sarah.dv@outlook.com', '+27 82 333 4444',
 '{"uid":"00000000-0000-0000-0000-000000000007","name":"Fatima Patel","email":"fatima.patel@yahoo.com"}',
 '2025-06-14T08:00:00Z'),

('40000000-0000-0000-0000-000000000003',
 '10000000-0000-0000-0000-000000000010', 'Durban Beachfront Condo with Sea Views',
 '2025-06-25', '11:30', 'in-person',
 'Thandi Zulu', 'thandi.z@student.ac.za', NULL,
 '{"uid":"00000000-0000-0000-0000-000000000008","name":"Lerato Molefe","email":"lerato.m@icloud.com"}',
 '2025-06-14T15:00:00Z'),

('40000000-0000-0000-0000-000000000004',
 '10000000-0000-0000-0000-000000000002', 'Stellenbosch Wine Estate Family Home',
 '2025-06-18', '09:00', 'in-person',
 'Jean-Pierre Joubert', 'jp.joubert@icloud.com', '+27 83 777 8888',
 '{"uid":"00000000-0000-0000-0000-000000000004","name":"Sipho Ndlovu","email":"sipho@gmail.com"}',
 '2025-06-10T12:00:00Z'),

('40000000-0000-0000-0000-000000000005',
 '10000000-0000-0000-0000-000000000006', 'Midrand Modern Family Home with Garden',
 '2025-06-28', '16:00', 'video',
 'Precious Nkosi', 'precious.n@gmail.com', '+27 71 555 6666',
 '{"uid":"00000000-0000-0000-0000-000000000005","name":"Zanele Khumalo","email":"zanele@outlook.com"}',
 '2025-06-15T09:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- 6. SAVED PROPERTIES (8 saves by various users)

INSERT INTO "savedProperties" (id, "userId", "propertyId", "createdAt") VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', '2025-06-10T08:00:00Z'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000010', '2025-06-11T09:00:00Z'),
('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '2025-06-12T10:00:00Z'),
('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '2025-06-12T11:00:00Z'),
('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '2025-06-13T14:00:00Z'),
('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000012', '2025-06-14T08:30:00Z'),
('50000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', '2025-06-14T10:00:00Z'),
('50000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000017', '2025-06-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- 7. ATTENDANCE (8 records for staff over several days)

INSERT INTO attendance (
  id, "staffId", "staffName", date, "punchInTime", "punchOutTime",
  "punchInLocation", "punchOutLocation", status, "totalHours", "createdAt"
) VALUES
('60000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000002', 'Naledi Dlamini',
 '2025-06-10', 1718006400000, 1718035200000,
 '{"lat":-33.9249,"lng":18.4241,"address":"Cape Town Office, 12 Long Street"}',
 '{"lat":-33.9249,"lng":18.4241,"address":"Cape Town Office, 12 Long Street"}',
 'present', 8.0, '2025-06-10T08:00:00Z'),

('60000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000003', 'James van der Merwe',
 '2025-06-10', 1718008200000, 1718037000000,
 '{"lat":-26.1076,"lng":28.0567,"address":"Sandton Office, 135 Rivonia Road"}',
 '{"lat":-26.1076,"lng":28.0567,"address":"Sandton Office, 135 Rivonia Road"}',
 'present', 8.0, '2025-06-10T08:30:00Z'),

('60000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000002', 'Naledi Dlamini',
 '2025-06-11', 1718092800000, 1718121600000,
 '{"lat":-33.9249,"lng":18.4241,"address":"Cape Town Office, 12 Long Street"}',
 '{"lat":-33.9249,"lng":18.4241,"address":"Cape Town Office, 12 Long Street"}',
 'present', 8.0, '2025-06-11T08:00:00Z'),

('60000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000003', 'James van der Merwe',
 '2025-06-11', 1718094600000, 1718123400000,
 '{"lat":-26.1076,"lng":28.0567,"address":"Sandton Office, 135 Rivonia Road"}',
 '{"lat":-26.1076,"lng":28.0567,"address":"Sandton Office, 135 Rivonia Road"}',
 'present', 8.0, '2025-06-11T08:30:00Z'),

('60000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000002', 'Naledi Dlamini',
 '2025-06-12', 1718179200000, 1718208000000,
 '{"lat":-33.9249,"lng":18.4241,"address":"Cape Town Office, 12 Long Street"}',
 '{"lat":-33.9249,"lng":18.4241,"address":"Cape Town Office, 12 Long Street"}',
 'present', 8.0, '2025-06-12T08:00:00Z'),

('60000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000003', 'James van der Merwe',
 '2025-06-12', 1718181000000, 1718209800000,
 '{"lat":-26.1076,"lng":28.0567,"address":"Sandton Office, 135 Rivonia Road"}',
 '{"lat":-26.1076,"lng":28.0567,"address":"Sandton Office, 135 Rivonia Road"}',
 'present', 8.0, '2025-06-12T08:30:00Z'),

('60000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000002', 'Naledi Dlamini',
 '2025-06-13', 1718265600000, NULL,
 '{"lat":-33.9249,"lng":18.4241,"address":"Cape Town Office, 12 Long Street"}',
 NULL,
 'present', NULL, '2025-06-13T08:00:00Z'),

('60000000-0000-0000-0000-000000000008',
 '00000000-0000-0000-0000-000000000003', 'James van der Merwe',
 '2025-06-13', 1718267400000, NULL,
 '{"lat":-26.1076,"lng":28.0567,"address":"Sandton Office, 135 Rivonia Road"}',
 NULL,
 'present', NULL, '2025-06-13T08:30:00Z')
ON CONFLICT (id) DO NOTHING;


-- 8. CRIME STATIONS (78 police station records)

INSERT INTO crime_stations (station, district, province, safety_rating, safety_label, crime_index, total_serious_crimes_q1_2025, total_serious_crimes_q1_2024, trend, crime_breakdown)
VALUES
  ('Aberdeen', 'Sarah Baartman District', 'Eastern Cape', 5, 'Very Safe', 6.8, 32, 24, 'Worsening', '{"All theft not mentioned elsewhere":18,"Arson":1,"Assault with the intent to inflict grievous bodily harm":13,"Burglary at non-residential premises":3,"Burglary at residential premises":14,"Commercial crime":3,"Common assault":9}'::jsonb),
  ('Acornhoek', 'Ehlanzeni District', 'Mpumalanga', 3, 'Moderate', 33.2, 156, 180, 'Improving', '{"All theft not mentioned elsewhere":28,"Arson":3,"Assault with the intent to inflict grievous bodily harm":82,"Attempted murder":2,"Burglary at non-residential premises":30,"Burglary at residential premises":25}'::jsonb),
  ('Actonville', 'Ekurhuleni District', 'Gauteng', 4, 'Safe', 18.7, 88, 88, 'Stable', '{"All theft not mentioned elsewhere":13,"Assault with the intent to inflict grievous bodily harm":23,"Attempted murder":3,"Burglary at non-residential premises":1,"Burglary at residential premises":10,"Carjacking":10}'::jsonb),
  ('Akasia', 'Tshwane District', 'Gauteng', 1, 'Very High Risk', 100, 704, 634, 'Worsening', '{"All theft not mentioned elsewhere":293,"Arson":2,"Assault with the intent to inflict grievous bodily harm":98,"Attempted murder":12,"Burglary at non-residential premises":23,"Burglary at residential premises":167,"Carjacking":38}'::jsonb),
  ('Alberton', 'Ekurhuleni District', 'Gauteng', 2, 'High Risk', 69.9, 329, 308, 'Worsening', '{"All theft not mentioned elsewhere":90,"Assault with the intent to inflict grievous bodily harm":38,"Attempted murder":11,"Burglary at non-residential premises":22,"Burglary at residential premises":30,"Carjacking":66,"Commercial crime":42}'::jsonb),
  ('Alexandra', 'Johannesburg District', 'Gauteng', 1, 'Very High Risk', 100, 529, 498, 'Worsening', '{"All theft not mentioned elsewhere":99,"Arson":2,"Assault with the intent to inflict grievous bodily harm":141,"Attempted murder":26,"Burglary at non-residential premises":6,"Burglary at residential premises":34,"Carjacking":27}'::jsonb),
  ('Athlone', 'City of Cape Town District', 'Western Cape', 2, 'High Risk', 71, 334, 399, 'Improving', '{"All theft not mentioned elsewhere":113,"Arson":1,"Assault with the intent to inflict grievous bodily harm":32,"Attempted murder":12,"Burglary at non-residential premises":12,"Burglary at residential premises":26}'::jsonb),
  ('Atlantis', 'City of Cape Town District', 'Western Cape', 1, 'Very High Risk', 79.9, 376, 394, 'Improving', '{"All theft not mentioned elsewhere":155,"Arson":1,"Assault with the intent to inflict grievous bodily harm":48,"Attempted murder":17,"Burglary at non-residential premises":20,"Burglary at residential premises":47}'::jsonb),
  ('Bloemspruit', 'Mangaung District', 'Free State', 1, 'Very High Risk', 100, 472, 440, 'Worsening', '{"All theft not mentioned elsewhere":80,"Arson":4,"Assault with the intent to inflict grievous bodily harm":156,"Attempted murder":34,"Burglary at non-residential premises":14,"Burglary at residential premises":111}'::jsonb),
  ('Bethlehem', 'Thabo Mofutsanyana District', 'Free State', 4, 'Safe', 20.8, 98, 96, 'Stable', '{"All theft not mentioned elsewhere":64,"Assault with the intent to inflict grievous bodily harm":12,"Attempted murder":5,"Burglary at non-residential premises":17,"Burglary at residential premises":32,"Commercial crime":66}'::jsonb),
  ('Chatsworth', 'eThekwini District', 'KwaZulu-Natal', 1, 'Very High Risk', 100, 734, 624, 'Worsening', '{"All theft not mentioned elsewhere":381,"Arson":1,"Assault with the intent to inflict grievous bodily harm":110,"Attempted murder":24,"Burglary at non-residential premises":19,"Burglary at residential premises":98}'::jsonb),
  ('Durban Central', 'eThekwini District', 'KwaZulu-Natal', 1, 'Very High Risk', 100, 690, 794, 'Improving', '{"All theft not mentioned elsewhere":306,"Arson":1,"Assault with the intent to inflict grievous bodily harm":65,"Attempted murder":13,"Burglary at non-residential premises":46,"Burglary at residential premises":10}'::jsonb),
  ('Bergville', 'Uthukela District', 'KwaZulu-Natal', 4, 'Safe', 13.4, 63, 70, 'Improving', '{"All theft not mentioned elsewhere":18,"Assault with the intent to inflict grievous bodily harm":21,"Attempted murder":2,"Burglary at non-residential premises":10,"Burglary at residential premises":12,"Commercial crime":7}'::jsonb),
  ('Polokwane', 'Capricorn District', 'Limpopo', 1, 'Very High Risk', 85, 400, 418, 'Improving', '{"All theft not mentioned elsewhere":323,"Assault with the intent to inflict grievous bodily harm":32,"Attempted murder":4,"Burglary at non-residential premises":104,"Burglary at residential premises":69,"Carjacking":4}'::jsonb),
  ('Thohoyandou', 'Vhembe District', 'Limpopo', 1, 'Very High Risk', 100, 702, 683, 'Worsening', '{"All theft not mentioned elsewhere":208,"Arson":3,"Assault with the intent to inflict grievous bodily harm":131,"Attempted murder":20,"Burglary at non-residential premises":79,"Burglary at residential premises":136}'::jsonb),
  ('Bela-Bela', 'Waterberg District', 'Limpopo', 3, 'Moderate', 49.3, 232, 190, 'Worsening', '{"All theft not mentioned elsewhere":107,"Arson":2,"Assault with the intent to inflict grievous bodily harm":49,"Attempted murder":6,"Burglary at non-residential premises":20,"Burglary at residential premises":104}'::jsonb),
  ('Alldays', 'Capricorn District', 'Limpopo', 5, 'Very Safe', 2.6, 12, 15, 'Improving', '{"All theft not mentioned elsewhere":15,"Assault with the intent to inflict grievous bodily harm":7,"Burglary at non-residential premises":2,"Burglary at residential premises":2,"Commercial crime":1,"Common assault":4}'::jsonb),
  ('Nelspruit', 'Ehlanzeni District', 'Mpumalanga', 2, 'High Risk', 72.7, 342, 388, 'Improving', '{"All theft not mentioned elsewhere":151,"Assault with the intent to inflict grievous bodily harm":55,"Attempted murder":7,"Burglary at non-residential premises":24,"Burglary at residential premises":87,"Carjacking":9}'::jsonb),
  ('Witbank', 'Nkangala District', 'Mpumalanga', 1, 'Very High Risk', 100, 473, 539, 'Improving', '{"All theft not mentioned elsewhere":186,"Arson":1,"Assault with the intent to inflict grievous bodily harm":41,"Attempted murder":8,"Burglary at non-residential premises":30,"Burglary at residential premises":109,"Carjacking":29}'::jsonb),
  ('Amsterdam', 'Gert Sibande District', 'Mpumalanga', 5, 'Very Safe', 9.6, 45, 60, 'Improving', '{"All theft not mentioned elsewhere":11,"Assault with the intent to inflict grievous bodily harm":22,"Attempted murder":2,"Burglary at non-residential premises":6,"Burglary at residential premises":16,"Commercial crime":7}'::jsonb),
  ('Rustenburg', 'Bojanala District', 'North West', 1, 'Very High Risk', 100, 529, 678, 'Improving', '{"All theft not mentioned elsewhere":234,"Arson":1,"Assault with the intent to inflict grievous bodily harm":67,"Attempted murder":11,"Burglary at non-residential premises":62,"Burglary at residential premises":146}'::jsonb),
  ('Potchefstroom', 'Dr Kenneth Kaunda District', 'North West', 2, 'High Risk', 55.1, 259, 298, 'Improving', '{"All theft not mentioned elsewhere":177,"Assault with the intent to inflict grievous bodily harm":35,"Burglary at non-residential premises":28,"Burglary at residential premises":59,"Carjacking":4,"Commercial crime":221}'::jsonb),
  ('Mahikeng', 'Ngaka Modiri Molema District', 'North West', 2, 'High Risk', 62.9, 296, 312, 'Improving', '{"All theft not mentioned elsewhere":209,"Assault with the intent to inflict grievous bodily harm":107,"Attempted murder":5,"Burglary at non-residential premises":27,"Burglary at residential premises":70,"Carjacking":5}'::jsonb),
  ('Boons', 'Bojanala District', 'North West', 5, 'Very Safe', 2.8, 13, 18, 'Improving', '{"All theft not mentioned elsewhere":6,"Assault with the intent to inflict grievous bodily harm":1,"Burglary at non-residential premises":2,"Burglary at residential premises":6,"Common assault":4}'::jsonb),
  ('Kimberley', 'Frances Baard District', 'Northern Cape', 1, 'Very High Risk', 95.2, 448, 479, 'Improving', '{"All theft not mentioned elsewhere":210,"Arson":3,"Assault with the intent to inflict grievous bodily harm":77,"Attempted murder":34,"Burglary at non-residential premises":39,"Burglary at residential premises":104,"Commercial crime":153}'::jsonb),
  ('Upington', 'ZF Mgcawu District', 'Northern Cape', 3, 'Moderate', 33.6, 158, 192, 'Improving', '{"All theft not mentioned elsewhere":103,"Arson":3,"Assault with the intent to inflict grievous bodily harm":74,"Attempted murder":25,"Burglary at non-residential premises":27,"Burglary at residential premises":57}'::jsonb),
  ('Calvinia', 'Namakwa District', 'Northern Cape', 5, 'Very Safe', 9.6, 45, 72, 'Improving', '{"All theft not mentioned elsewhere":13,"Assault with the intent to inflict grievous bodily harm":6,"Attempted murder":5,"Burglary at non-residential premises":1,"Burglary at residential premises":9,"Commercial crime":6}'::jsonb),
  ('Cape Town Central', 'City of Cape Town District', 'Western Cape', 1, 'Very High Risk', 100, 757, 768, 'Improving', '{"All theft not mentioned elsewhere":795,"Arson":2,"Assault with the intent to inflict grievous bodily harm":30,"Attempted murder":2,"Burglary at non-residential premises":29,"Burglary at residential premises":51,"Carjacking":4}'::jsonb),
  ('Stellenbosch', 'Cape Winelands District', 'Western Cape', 1, 'Very High Risk', 100, 493, 440, 'Worsening', '{"All theft not mentioned elsewhere":298,"Assault with the intent to inflict grievous bodily harm":53,"Attempted murder":21,"Burglary at non-residential premises":24,"Burglary at residential premises":120,"Carjacking":5}'::jsonb),
  ('Knysna', 'Garden Route District', 'Western Cape', 1, 'Very High Risk', 81.9, 385, 385, 'Stable', '{"All theft not mentioned elsewhere":192,"Arson":5,"Assault with the intent to inflict grievous bodily harm":157,"Attempted murder":3,"Burglary at non-residential premises":32,"Burglary at residential premises":119}'::jsonb),
  ('Hermanus', 'Overberg District', 'Western Cape', 2, 'High Risk', 52.9, 249, 307, 'Improving', '{"All theft not mentioned elsewhere":88,"Arson":1,"Assault with the intent to inflict grievous bodily harm":54,"Attempted murder":5,"Burglary at non-residential premises":6,"Burglary at residential premises":90}'::jsonb),
  ('Camps Bay', 'City of Cape Town District', 'Western Cape', 5, 'Very Safe', 6.4, 30, 39, 'Improving', '{"All theft not mentioned elsewhere":29,"Burglary at non-residential premises":5,"Burglary at residential premises":12,"Commercial crime":23,"Common assault":3,"Common robbery":2}'::jsonb),
  ('East London', 'Buffalo City District', 'Eastern Cape', 1, 'Very High Risk', 92.3, 434, 504, 'Improving', '{"All theft not mentioned elsewhere":176,"Arson":1,"Assault with the intent to inflict grievous bodily harm":102,"Attempted murder":9,"Burglary at non-residential premises":79,"Burglary at residential premises":71,"Carjacking":7}'::jsonb),
  ('Mthatha', 'OR Tambo District', 'Eastern Cape', 1, 'Very High Risk', 94.2, 443, 534, 'Improving', '{"All theft not mentioned elsewhere":82,"Arson":2,"Assault with the intent to inflict grievous bodily harm":160,"Attempted murder":17,"Burglary at non-residential premises":22,"Burglary at residential premises":83,"Carjacking":19}'::jsonb),
  ('Addo', 'Sarah Baartman District', 'Eastern Cape', 4, 'Safe', 17.9, 84, 59, 'Worsening', '{"All theft not mentioned elsewhere":28,"Assault with the intent to inflict grievous bodily harm":42,"Attempted murder":4,"Burglary at non-residential premises":13,"Burglary at residential premises":15,"Commercial crime":5}'::jsonb),
  ('Inanda', 'eThekwini District', 'KwaZulu-Natal', 1, 'Very High Risk', 100, 1017, 962, 'Worsening', '{"All theft not mentioned elsewhere":120,"Arson":1,"Assault with the intent to inflict grievous bodily harm":157,"Attempted murder":89,"Burglary at non-residential premises":20,"Burglary at residential premises":190}'::jsonb),
  ('Ladysmith', 'Uthukela District', 'KwaZulu-Natal', 1, 'Very High Risk', 100, 529, 553, 'Improving', '{"All theft not mentioned elsewhere":205,"Arson":3,"Assault with the intent to inflict grievous bodily harm":112,"Attempted murder":19,"Burglary at non-residential premises":41,"Burglary at residential premises":92}'::jsonb),
  ('Kokstad', 'Harry Gwala District', 'KwaZulu-Natal', 3, 'Moderate', 43.2, 203, 237, 'Improving', '{"All theft not mentioned elsewhere":51,"Arson":1,"Assault with the intent to inflict grievous bodily harm":70,"Attempted murder":9,"Burglary at non-residential premises":13,"Burglary at residential premises":64}'::jsonb),
  ('Galeshewe', 'Frances Baard District', 'Northern Cape', 1, 'Very High Risk', 97.4, 458, 380, 'Worsening', '{"All theft not mentioned elsewhere":115,"Arson":1,"Assault with the intent to inflict grievous bodily harm":132,"Attempted murder":50,"Burglary at non-residential premises":26,"Burglary at residential premises":138}'::jsonb),
  ('Park Road', 'Mangaung District', 'Free State', 1, 'Very High Risk', 100, 584, 625, 'Improving', '{"All theft not mentioned elsewhere":459,"Assault with the intent to inflict grievous bodily harm":46,"Attempted murder":25,"Burglary at non-residential premises":65,"Burglary at residential premises":106,"Carjacking":5}'::jsonb),
  ('Welkom', 'Lejweleputswa District', 'Free State', 2, 'High Risk', 73.1, 344, 528, 'Improving', '{"All theft not mentioned elsewhere":195,"Arson":2,"Assault with the intent to inflict grievous bodily harm":42,"Attempted murder":20,"Burglary at non-residential premises":52,"Burglary at residential premises":89}'::jsonb),
  ('Clarens', 'Thabo Mofutsanyana District', 'Free State', 5, 'Very Safe', 3, 14, 17, 'Improving', '{"All theft not mentioned elsewhere":5,"Assault with the intent to inflict grievous bodily harm":4,"Burglary at non-residential premises":2,"Burglary at residential premises":3,"Commercial crime":10}'::jsonb),
  ('Barberton', 'Ehlanzeni District', 'Mpumalanga', 2, 'High Risk', 57.6, 271, 222, 'Worsening', '{"All theft not mentioned elsewhere":152,"Arson":1,"Assault with the intent to inflict grievous bodily harm":81,"Attempted murder":11,"Burglary at non-residential premises":12,"Burglary at residential premises":53,"Carjacking":3}'::jsonb),
  ('Seshego', 'Capricorn District', 'Limpopo', 1, 'Very High Risk', 100, 573, 531, 'Worsening', '{"All theft not mentioned elsewhere":191,"Arson":3,"Assault with the intent to inflict grievous bodily harm":138,"Attempted murder":7,"Burglary at non-residential premises":59,"Burglary at residential premises":166}'::jsonb),
  ('Mankweng', 'Capricorn District', 'Limpopo', 1, 'Very High Risk', 100, 631, 639, 'Improving', '{"All theft not mentioned elsewhere":199,"Arson":1,"Assault with the intent to inflict grievous bodily harm":108,"Attempted murder":5,"Burglary at non-residential premises":41,"Burglary at residential premises":160}'::jsonb),
  ('Boitekong', 'Bojanala District', 'North West', 1, 'Very High Risk', 80.4, 378, 385, 'Improving', '{"All theft not mentioned elsewhere":77,"Assault with the intent to inflict grievous bodily harm":127,"Attempted murder":33,"Burglary at non-residential premises":10,"Burglary at residential premises":61,"Carjacking":11}'::jsonb),
  ('Vryburg', 'Dr Ruth Segomotsi Mompati District', 'North West', 4, 'Safe', 22.1, 104, 135, 'Improving', '{"All theft not mentioned elsewhere":51,"Assault with the intent to inflict grievous bodily harm":37,"Attempted murder":1,"Burglary at non-residential premises":26,"Burglary at residential premises":25,"Commercial crime":10}'::jsonb),
  ('Ceres', 'Cape Winelands District', 'Western Cape', 3, 'Moderate', 39.5, 186, 152, 'Worsening', '{"All theft not mentioned elsewhere":72,"Arson":1,"Assault with the intent to inflict grievous bodily harm":53,"Attempted murder":12,"Burglary at non-residential premises":16,"Burglary at residential premises":43}'::jsonb),
  ('George', 'Garden Route District', 'Western Cape', 2, 'High Risk', 51.7, 243, 284, 'Improving', '{"All theft not mentioned elsewhere":211,"Assault with the intent to inflict grievous bodily harm":31,"Attempted murder":2,"Burglary at non-residential premises":36,"Burglary at residential premises":74}'::jsonb),
  ('Malmesbury', 'West Coast District', 'Western Cape', 3, 'Moderate', 45.9, 216, 237, 'Improving', '{"All theft not mentioned elsewhere":82,"Assault with the intent to inflict grievous bodily harm":44,"Attempted murder":20,"Burglary at non-residential premises":19,"Burglary at residential premises":53}'::jsonb),
  ('Beaufort West', 'Central Karoo District', 'Western Cape', 3, 'Moderate', 43.4, 204, 197, 'Worsening', '{"All theft not mentioned elsewhere":88,"Arson":1,"Assault with the intent to inflict grievous bodily harm":70,"Attempted murder":2,"Burglary at non-residential premises":2,"Burglary at residential premises":59}'::jsonb),
  ('Sandton', 'Johannesburg District', 'Gauteng', 1, 'Very High Risk', 100, 490, 442, 'Worsening', '{"All theft not mentioned elsewhere":306,"Arson":1,"Assault with the intent to inflict grievous bodily harm":8,"Attempted murder":15,"Burglary at non-residential premises":32,"Burglary at residential premises":87,"Carjacking":34}'::jsonb),
  ('Midrand', 'Johannesburg District', 'Gauteng', 1, 'Very High Risk', 100, 528, 568, 'Improving', '{"All theft not mentioned elsewhere":283,"Assault with the intent to inflict grievous bodily harm":15,"Attempted murder":15,"Burglary at non-residential premises":66,"Burglary at residential premises":46,"Carjacking":55}'::jsonb),
  ('Kempton Park', 'Ekurhuleni District', 'Gauteng', 1, 'Very High Risk', 100, 482, 528, 'Improving', '{"All theft not mentioned elsewhere":186,"Assault with the intent to inflict grievous bodily harm":34,"Attempted murder":16,"Burglary at non-residential premises":26,"Burglary at residential premises":47,"Carjacking":44}'::jsonb),
  ('Tembisa', 'Ekurhuleni District', 'Gauteng', 1, 'Very High Risk', 100, 727, 769, 'Improving', '{"All theft not mentioned elsewhere":139,"Arson":2,"Assault with the intent to inflict grievous bodily harm":162,"Attempted murder":39,"Burglary at non-residential premises":20,"Burglary at residential premises":92,"Carjacking":46}'::jsonb),
  ('Soshanguve', 'Tshwane District', 'Gauteng', 1, 'Very High Risk', 100, 523, 448, 'Worsening', '{"All theft not mentioned elsewhere":153,"Assault with the intent to inflict grievous bodily harm":92,"Attempted murder":13,"Burglary at non-residential premises":36,"Burglary at residential premises":113,"Carjacking":43}'::jsonb),
  ('Vanderbijlpark', 'Sedibeng District', 'Gauteng', 1, 'Very High Risk', 83.1, 391, 494, 'Improving', '{"All theft not mentioned elsewhere":227,"Arson":2,"Assault with the intent to inflict grievous bodily harm":81,"Attempted murder":6,"Burglary at non-residential premises":28,"Burglary at residential premises":98,"Carjacking":13}'::jsonb),
  ('Krugersdorp', 'West Rand District', 'Gauteng', 2, 'High Risk', 74.8, 352, 371, 'Improving', '{"All theft not mentioned elsewhere":149,"Arson":1,"Assault with the intent to inflict grievous bodily harm":77,"Attempted murder":5,"Burglary at non-residential premises":40,"Burglary at residential premises":105,"Carjacking":14}'::jsonb),
  ('Empangeni', 'King Cetshwayo District', 'KwaZulu-Natal', 1, 'Very High Risk', 100, 707, 604, 'Worsening', '{"All theft not mentioned elsewhere":151,"Arson":7,"Assault with the intent to inflict grievous bodily harm":128,"Attempted murder":30,"Burglary at non-residential premises":43,"Burglary at residential premises":155}'::jsonb),
  ('Newcastle', 'Amajuba District', 'KwaZulu-Natal', 1, 'Very High Risk', 83.1, 391, 422, 'Improving', '{"All theft not mentioned elsewhere":244,"Assault with the intent to inflict grievous bodily harm":58,"Attempted murder":19,"Burglary at non-residential premises":18,"Burglary at residential premises":103}'::jsonb),
  ('Pietermaritzburg', 'Umgungundlovu District', 'KwaZulu-Natal', 2, 'High Risk', 69.3, 326, 347, 'Improving', '{"All theft not mentioned elsewhere":199,"Assault with the intent to inflict grievous bodily harm":51,"Attempted murder":6,"Burglary at non-residential premises":48,"Burglary at residential premises":15,"Carjacking":2}'::jsonb),
  ('Richards Bay', 'King Cetshwayo District', 'KwaZulu-Natal', 2, 'High Risk', 68.9, 324, 382, 'Improving', '{"All theft not mentioned elsewhere":159,"Assault with the intent to inflict grievous bodily harm":62,"Attempted murder":18,"Burglary at non-residential premises":17,"Burglary at residential premises":80}'::jsonb),
  ('Port Shepstone', 'Ugu District', 'KwaZulu-Natal', 2, 'High Risk', 66.3, 312, 339, 'Improving', '{"All theft not mentioned elsewhere":124,"Assault with the intent to inflict grievous bodily harm":84,"Attempted murder":8,"Burglary at non-residential premises":19,"Burglary at residential premises":89}'::jsonb),
  ('KwaDukuza', 'Ilembe District', 'KwaZulu-Natal', 1, 'Very High Risk', 100, 616, 719, 'Improving', '{"All theft not mentioned elsewhere":253,"Arson":2,"Assault with the intent to inflict grievous bodily harm":171,"Attempted murder":20,"Burglary at non-residential premises":25,"Burglary at residential premises":138}'::jsonb),
  ('Nongoma', 'Zululand District', 'KwaZulu-Natal', 2, 'High Risk', 54.9, 258, 229, 'Worsening', '{"All theft not mentioned elsewhere":43,"Arson":2,"Assault with the intent to inflict grievous bodily harm":147,"Attempted murder":9,"Burglary at non-residential premises":33,"Burglary at residential premises":53}'::jsonb),
  ('Hluhluwe', 'Umkhanyakude District', 'KwaZulu-Natal', 4, 'Safe', 13.4, 63, 85, 'Improving', '{"All theft not mentioned elsewhere":21,"Arson":3,"Assault with the intent to inflict grievous bodily harm":43,"Attempted murder":9,"Burglary at non-residential premises":9,"Burglary at residential premises":11}'::jsonb),
  ('Babanango', 'Zululand District', 'KwaZulu-Natal', 5, 'Very Safe', 6.6, 31, 33, 'Stable', '{"All theft not mentioned elsewhere":6,"Assault with the intent to inflict grievous bodily harm":8,"Attempted murder":3,"Burglary at non-residential premises":6,"Commercial crime":1,"Common assault":8}'::jsonb),
  ('Giyani', 'Mopani District', 'Limpopo', 3, 'Moderate', 43.6, 205, 284, 'Improving', '{"All theft not mentioned elsewhere":92,"Arson":2,"Assault with the intent to inflict grievous bodily harm":53,"Attempted murder":3,"Burglary at non-residential premises":29,"Burglary at residential premises":60}'::jsonb),
  ('Tzaneen', 'Mopani District', 'Limpopo', 3, 'Moderate', 38.7, 182, 273, 'Improving', '{"All theft not mentioned elsewhere":110,"Assault with the intent to inflict grievous bodily harm":31,"Attempted murder":6,"Burglary at non-residential premises":18,"Burglary at residential premises":70}'::jsonb),
  ('Burgersfort', 'Sekhukhune District', 'Limpopo', 4, 'Safe', 21.9, 103, 116, 'Improving', '{"All theft not mentioned elsewhere":45,"Assault with the intent to inflict grievous bodily harm":18,"Attempted murder":2,"Burglary at non-residential premises":10,"Burglary at residential premises":20,"Commercial crime":59}'::jsonb),
  ('Delmas', 'Nkangala District', 'Mpumalanga', 2, 'High Risk', 60.2, 283, 363, 'Improving', '{"All theft not mentioned elsewhere":77,"Arson":1,"Assault with the intent to inflict grievous bodily harm":56,"Attempted murder":23,"Burglary at non-residential premises":14,"Burglary at residential premises":47}'::jsonb),
  ('Ermelo', 'Gert Sibande District', 'Mpumalanga', 3, 'Moderate', 47, 221, 237, 'Improving', '{"All theft not mentioned elsewhere":65,"Arson":1,"Assault with the intent to inflict grievous bodily harm":62,"Attempted murder":3,"Burglary at non-residential premises":18,"Burglary at residential premises":75,"Commercial crime":66}'::jsonb),
  ('Klerksdorp', 'Dr Kenneth Kaunda District', 'North West', 2, 'High Risk', 73.8, 347, 481, 'Improving', '{"All theft not mentioned elsewhere":188,"Arson":4,"Assault with the intent to inflict grievous bodily harm":36,"Attempted murder":4,"Burglary at non-residential premises":23,"Burglary at residential premises":87}'::jsonb),
  ('Mothibistad', 'John Taolo Gaetsewe District', 'Northern Cape', 3, 'Moderate', 45.3, 213, 139, 'Worsening', '{"All theft not mentioned elsewhere":48,"Assault with the intent to inflict grievous bodily harm":53,"Attempted murder":38,"Burglary at non-residential premises":30,"Burglary at residential premises":53}'::jsonb),
  ('De Aar', 'Pixley ka Seme District', 'Northern Cape', 4, 'Safe', 13.6, 64, 69, 'Improving', '{"All theft not mentioned elsewhere":32,"Assault with the intent to inflict grievous bodily harm":18,"Burglary at non-residential premises":11,"Burglary at residential premises":17,"Commercial crime":19,"Common assault":27}'::jsonb),
  ('Kroonstad', 'Fezile Dabi District', 'Free State', 3, 'Moderate', 36.1, 170, 224, 'Improving', '{"All theft not mentioned elsewhere":146,"Assault with the intent to inflict grievous bodily harm":15,"Attempted murder":3,"Burglary at non-residential premises":43,"Burglary at residential premises":47}'::jsonb),
  ('Sasolburg', 'Fezile Dabi District', 'Free State', 3, 'Moderate', 27.9, 131, 209, 'Improving', '{"All theft not mentioned elsewhere":100,"Assault with the intent to inflict grievous bodily harm":13,"Attempted murder":2,"Burglary at non-residential premises":15,"Burglary at residential premises":47}'::jsonb),
  ('Zastron', 'Xhariep District', 'Free State', 5, 'Very Safe', 9.1, 43, 67, 'Improving', '{"All theft not mentioned elsewhere":16,"Arson":1,"Assault with the intent to inflict grievous bodily harm":19,"Burglary at non-residential premises":7,"Burglary at residential premises":10,"Commercial crime":5}'::jsonb)
ON CONFLICT (station) DO UPDATE SET
  district = EXCLUDED.district,
  province = EXCLUDED.province,
  safety_rating = EXCLUDED.safety_rating,
  safety_label = EXCLUDED.safety_label,
  crime_index = EXCLUDED.crime_index,
  total_serious_crimes_q1_2025 = EXCLUDED.total_serious_crimes_q1_2025,
  total_serious_crimes_q1_2024 = EXCLUDED.total_serious_crimes_q1_2024,
  trend = EXCLUDED.trend,
  crime_breakdown = EXCLUDED.crime_breakdown,
  updated_at = now();
