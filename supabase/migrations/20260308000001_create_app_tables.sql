-- ============================================================
-- Full application schema — migrating from Firebase RTDB
-- Uses camelCase column names to match existing TypeScript types
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

-- ============================================================
-- Enable Realtime for tables that need live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE "savedProperties";
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
