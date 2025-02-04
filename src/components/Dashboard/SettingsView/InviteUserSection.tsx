import { useState } from "react";
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

export function InviteUserSection() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "supervisor" | "agent">("agent");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("invitations")
        .insert({
          email,
          role,
          invited_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      setEmail("");
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
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Invite User</h2>
      <form onSubmit={handleInviteUser} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(value: "admin" | "supervisor" | "agent") => setRole(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Invitation"}
        </Button>
      </form>
    </Card>
  );
}