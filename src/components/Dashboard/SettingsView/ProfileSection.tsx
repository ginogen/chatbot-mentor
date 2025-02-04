import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export function ProfileSection() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");
      
      if (user.email) {
        setEmail(user.email);
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name")
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (profile?.first_name) {
        setFirstName(profile.first_name);
      }

      const { data: roleData } = await supabase.rpc('get_highest_role', {
        user_id: user.id
      });
      
      if (roleData) {
        setRole(roleData);
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-secondary/50 backdrop-blur-lg border border-white/10">
      <h2 className="text-2xl font-semibold mb-6 text-white">Profile Settings</h2>
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-gray-200">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            className="bg-secondary/70 border-white/10 text-white placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-200">Email</Label>
          <Input
            id="email"
            value={email}
            disabled
            className="bg-secondary/70 border-white/10 text-white opacity-70"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role" className="text-gray-200">Role</Label>
          <Select value={role} disabled>
            <SelectTrigger className="bg-secondary/70 border-white/10 text-white opacity-70">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent className="bg-secondary border-white/10">
              <SelectItem value="admin" className="text-white">Admin</SelectItem>
              <SelectItem value="supervisor" className="text-white">Supervisor</SelectItem>
              <SelectItem value="agent" className="text-white">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-primary hover:bg-primary-dark text-white"
        >
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </Card>
  );
}