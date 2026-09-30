import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { InviteMembersDialog } from "@/components/invite-members-dialog";

const InviteButton = () => {
  return (
    <InviteMembersDialog>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite members
        </Button>
    </InviteMembersDialog>
  );
};

export default InviteButton;
