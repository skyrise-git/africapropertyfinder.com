"use client";

import { motion } from "motion/react";
import {
  Bath,
  BedDouble,
  Ban,
  Building2,
  Car,
  Clock,
  DollarSign,
  Dumbbell,
  Flame,
  Home,
  MapPin,
  Maximize2,
  PawPrint,
  Shield,
  TreePine,
  Users,
  Waves,
  UtensilsCrossed,
  UserCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/types/property.type";
import { PropertyMapView } from "../_components/property-map-view";
import { formatCurrency } from "@ashirbad/js-core";

type PropertyTabsAndSidebarProps = {
  property: Property;
};

function formatPrice(property: Property) {
  if (property.listingType === "sale" && property.price != null) {
    try {
      return formatCurrency(property.price, "USD");
    } catch {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property.price);
    }
  }

  if (
    (property.listingType === "rent" ||
      property.listingType === "student-housing") &&
    property.rent != null
  ) {
    try {
      const formatted = formatCurrency(property.rent, "USD");
      return `${formatted}${
        property.paymentFrequency ? ` / ${property.paymentFrequency}` : " / monthly"
      }`;
    } catch {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property.rent);
      return `${formatted}${
        property.paymentFrequency ? ` / ${property.paymentFrequency}` : " / monthly"
      }`;
    }
  }

  return "Price on request";
}

const amenitiesConfig = [
  { key: "parkingAvailable", label: "Parking", icon: Car },
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "petsAllowed", label: "Pets Allowed", icon: PawPrint },
  { key: "pool", label: "Pool", icon: Waves },
  { key: "gym", label: "Gym", icon: Dumbbell },
  { key: "elevator", label: "Elevator", icon: Building2 },
  { key: "security", label: "Security", icon: Shield },
  { key: "garden", label: "Garden", icon: TreePine },
  { key: "dishwasher", label: "Dishwasher", icon: UtensilsCrossed },
  { key: "fireplace", label: "Fireplace", icon: Flame },
  { key: "laundry", label: "Laundry", icon: UtensilsCrossed },
  { key: "heatingCooling", label: "Heating & Cooling", icon: Flame },
  { key: "balcony", label: "Balcony", icon: Home },
] as const;

type AmenityConfig = (typeof amenitiesConfig)[number];

// @ts-expect-error Wifi is provided by lucide-react at runtime
import { Wifi } from "lucide-react";

export function PropertyTabsAndSidebar({ property }: PropertyTabsAndSidebarProps) {
  const amenities: AmenityConfig[] = amenitiesConfig.filter(
    (amenity) => property[amenity.key as keyof Property],
  );

  return (
    <>
      <div className="lg:col-span-2 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Property Type
                      </div>
                      <div className="font-semibold capitalize">
                        {property.propertyType.replace("-", " ")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Furnishing
                      </div>
                      <div className="font-semibold capitalize">
                        {property.furnishing.replace("-", " ")}
                      </div>
                    </div>
                    {property.floorNumber && (
                      <div>
                        <div className="text-sm text-muted-foreground">Floor</div>
                        <div className="font-semibold">
                          {property.floorNumber}
                          {property.totalFloors && ` of ${property.totalFloors}`}
                        </div>
                      </div>
                    )}
                    {property.availableFrom && (
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Available From
                        </div>
                        <div className="font-semibold">
                          {new Date(
                            property.availableFrom,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {property.isShared && property.sharingDetails && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Shared Property</span>
                        </div>
                        {property.sharingDetails.sharingType && (
                          <div className="text-sm text-muted-foreground ml-6">
                            Sharing Type:{" "}
                            <span className="capitalize">
                              {property.sharingDetails.sharingType}
                            </span>
                          </div>
                        )}
                        {property.sharingDetails.currentOccupants !== undefined && (
                          <div className="text-sm text-muted-foreground ml-6">
                            Current Occupants:{" "}
                            {property.sharingDetails.currentOccupants}
                          </div>
                        )}
                        {property.sharingDetails.preferredTenantType && (
                          <div className="text-sm text-muted-foreground ml-6">
                            Preferred:{" "}
                            <span className="capitalize">
                              {property.sharingDetails.preferredTenantType}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6 mt-6">
              {amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenities.map((amenity) => {
                        const Icon = amenity.icon;
                        return (
                          <div
                            key={amenity.key}
                            className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                          >
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              {amenity.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {property.otherAmenities && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Other Amenities
                          </div>
                          <p className="text-sm">{property.otherAmenities}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="location" className="space-y-6 mt-6">
              {property.location && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Address
                        </div>
                        <div className="font-semibold">
                          {property.address}, {property.city}, {property.state}{" "}
                          {property.zipCode}
                        </div>
                      </div>
                      {property.nearbyTransit && (
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Nearby Transit
                          </div>
                          <div className="font-semibold">
                            {property.nearbyTransit}
                          </div>
                        </div>
                      )}
                      <div className="h-[400px] rounded-lg overflow-hidden">
                        <PropertyMapView properties={[property]} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {formatPrice(property)}
                  </div>
                  {property.securityDeposit && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Security Deposit
                      </div>
                      <div className="font-semibold">
                        {(() => {
                          try {
                            return formatCurrency(
                              property.securityDeposit,
                              "USD",
                            );
                          } catch {
                            return new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(property.securityDeposit);
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  {property.leaseLength && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Lease Length
                      </div>
                      <div className="font-semibold">
                        {property.leaseLength} months
                      </div>
                    </div>
                  )}
                  {property.utilitiesIncluded !== undefined && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Utilities
                      </div>
                      <div className="font-semibold">
                        {property.utilitiesIncluded
                          ? "Included"
                          : "Not Included"}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Policies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {property.smokingAllowed !== undefined && (
                      <div className="flex items-center gap-2">
                        {property.smokingAllowed ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          Smoking:{" "}
                          {property.smokingAllowed ? "Allowed" : "Not Allowed"}
                        </span>
                      </div>
                    )}
                    {property.petsAllowed !== undefined && (
                      <div className="flex items-center gap-2">
                        {property.petsAllowed ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          Pets:{" "}
                          {property.petsAllowed ? "Allowed" : "Not Allowed"}
                        </span>
                      </div>
                    )}
                    {property.guestsAllowed !== undefined && (
                      <div className="flex items-center gap-2">
                        {property.guestsAllowed ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          Guests:{" "}
                          {property.guestsAllowed ? "Allowed" : "Not Allowed"}
                        </span>
                      </div>
                    )}
                    {property.sublettingAllowed !== undefined && (
                      <div className="flex items-center gap-2">
                        {property.sublettingAllowed ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          Subletting:{" "}
                          {property.sublettingAllowed
                            ? "Allowed"
                            : "Not Allowed"}
                        </span>
                      </div>
                    )}
                    {property.partiesAllowed !== undefined && (
                      <div className="flex items-center gap-2">
                        {property.partiesAllowed ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          Parties:{" "}
                          {property.partiesAllowed ? "Allowed" : "Not Allowed"}
                        </span>
                      </div>
                    )}
                    {property.quietHours !== undefined && (
                      <div className="flex items-center gap-2">
                        {property.quietHours ? (
                          <Clock className="h-4 w-4 text-blue-600" />
                        ) : null}
                        <span className="text-sm">
                          Quiet Hours: {property.quietHours ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {property.maintenanceResponsibility !== undefined && (
                <div>
                  <div className="text-muted-foreground">
                    Maintenance Responsibility
                  </div>
                  <div className="font-semibold">
                    {property.maintenanceResponsibility ? "Tenant" : "Landlord"}
                  </div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Listed</div>
                <div className="font-semibold">
                  {new Date(property.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}


