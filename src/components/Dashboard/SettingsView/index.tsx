import { useEffect, useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { InviteUserSection } from "./InviteUserSection";
import { supabase } from "@/integrations/supabase/client";

export function SettingsView() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.rpc('has_role', {
      user_id: user.id,
      role: 'admin'
    });
    
    setIsAdmin(!!data);
  };

  return (
    <div className="space-y-6">
      <ProfileSection />
      {isAdmin && <InviteUserSection />}
    </div>
  );
}