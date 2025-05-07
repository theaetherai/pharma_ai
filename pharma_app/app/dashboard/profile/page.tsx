"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Bell,
  Calendar,
  Edit,
  FileLock,
  FileText,
  Key,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function ProfilePage() {
  const { user } = useUser();
  const [editMode, setEditMode] = useState(false);
  
  // Sample user profile data
  const profile = {
    name: user?.fullName || "John Doe",
    email: user?.primaryEmailAddress?.emailAddress || "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Apt 4B, New York, NY 10001",
    dateOfBirth: "1985-05-15",
    bloodType: "O+",
    allergies: ["Penicillin", "Peanuts"],
    conditions: ["Hypertension", "Asthma"],
    emergencyContact: {
      name: "Jane Doe",
      relationship: "Spouse",
      phone: "+1 (555) 987-6543"
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground">
              Manage your account and health information
            </p>
          </div>
          <Button variant={editMode ? "default" : "outline"} onClick={() => setEditMode(!editMode)}>
            {editMode ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="medical">Medical History</TabsTrigger>
            <TabsTrigger value="security">Security & Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Manage your personal details</CardDescription>
                  </div>
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={user?.imageUrl} alt={profile.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      defaultValue={profile.name}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={profile.email}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      defaultValue={profile.phone}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input 
                      id="dob" 
                      type="date" 
                      defaultValue={profile.dateOfBirth}
                      disabled={!editMode}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    defaultValue={profile.address}
                    disabled={!editMode}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency-name">Contact Name</Label>
                      <Input 
                        id="emergency-name" 
                        defaultValue={profile.emergencyContact.name}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency-relationship">Relationship</Label>
                      <Input 
                        id="emergency-relationship" 
                        defaultValue={profile.emergencyContact.relationship}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency-phone">Phone Number</Label>
                      <Input 
                        id="emergency-phone" 
                        defaultValue={profile.emergencyContact.phone}
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="medical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>Your health profile and history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-base font-medium mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      Medical Conditions
                    </h3>
                    <div className="space-y-3">
                      {profile.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2">
                          <span>{condition}</span>
                          {editMode && (
                            <Button variant="ghost" size="sm" className="h-7 text-red-500">
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      {editMode && (
                        <div className="flex items-center gap-2 mt-3">
                          <Input placeholder="Add new condition" />
                          <Button size="sm">Add</Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      Allergies
                    </h3>
                    <div className="space-y-3">
                      {profile.allergies.map((allergy, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2">
                          <span>{allergy}</span>
                          {editMode && (
                            <Button variant="ghost" size="sm" className="h-7 text-red-500">
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      {editMode && (
                        <div className="flex items-center gap-2 mt-3">
                          <Input placeholder="Add new allergy" />
                          <Button size="sm">Add</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-base font-medium mb-3 flex items-center">
                    <FileLock className="h-4 w-4 mr-2 text-primary" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="blood-type">Blood Type</Label>
                      <Input 
                        id="blood-type" 
                        defaultValue={profile.bloodType}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input 
                        id="height" 
                        placeholder="e.g., 5'10&quot; or 178cm"
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline">Download Medical Record</Button>
                <Button variant="outline">Share with Doctor</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security & Privacy</CardTitle>
                <CardDescription>Manage your account security and data privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <Key className="h-4 w-4 mr-2 text-primary" />
                    Account Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="font-medium">Password</div>
                        <div className="text-sm text-muted-foreground">Last updated 30 days ago</div>
                      </div>
                      <Button variant="outline" size="sm">Change Password</Button>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="font-medium">Two-Factor Authentication</div>
                        <div className="text-sm text-muted-foreground">Secure your account with 2FA</div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    Privacy Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Share Medical Data with Doctors</div>
                        <div className="text-sm text-muted-foreground">Allow doctors to access your medical records</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Share Data for Research</div>
                        <div className="text-sm text-muted-foreground">Anonymized data sharing for medical research</div>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Third-Party App Access</div>
                        <div className="text-sm text-muted-foreground">Allow trusted third-party apps to access your data</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  <FileLock className="mr-2 h-4 w-4" />
                  Request Data Export
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how and when we notify you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-primary" />
                    Email Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-appointments" defaultChecked />
                      <Label htmlFor="email-appointments">Appointment Reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-prescriptions" defaultChecked />
                      <Label htmlFor="email-prescriptions">Prescription Refill Reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-news" />
                      <Label htmlFor="email-news">Health Tips & News</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    SMS Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sms-appointments" defaultChecked />
                      <Label htmlFor="sms-appointments">Appointment Reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sms-prescriptions" defaultChecked />
                      <Label htmlFor="sms-prescriptions">Prescription Refill Reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sms-delivery" />
                      <Label htmlFor="sms-delivery">Order Delivery Updates</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Calendar Sync
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sync with Google Calendar</div>
                      <div className="text-sm text-muted-foreground">Add appointments to your Google Calendar</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
} 