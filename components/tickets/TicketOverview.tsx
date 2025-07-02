import React from "react";
import {
  Building2,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  PhoneCall,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar } from "../ui/avatar";

interface Client {
  id: string;
  name: string;
  contactEmail?: string;
  contactPerson?: string;
  contactNumber?: string;
  initials?: string;
  gstn?: string;
}

interface Assignee {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  initials?: string;
}

interface TicketOverviewProps {
  client?: Client;
  assignee?: Assignee;
  branch: string;
  priority: string;
  dueDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  holdReason?: string;
}

export const TicketOverview: React.FC<TicketOverviewProps> = ({
  client,
  assignee,
  branch,
  priority,
  dueDate,
  scheduledDate,
  completedDate,
  createdAt,
  description,
  holdReason,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Client Information */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Client Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

        <div className="flex items-center space-x-3">
            <Avatar
              initials={client?.initials || client?.name?.charAt(0)}
              size="md"
            />
             <div>
            <h4 className="font-medium ">
              {client?.name || "No client assigned"}
            </h4>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {branch}
            </p>
          </div>
          </div>


         

          {client?.contactEmail && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              {client.contactEmail}
            </div>
          )}

          {client?.contactNumber && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneCall className="w-4 h-4 mr-2" />
              {client.contactNumber}
            </div>
          )}

          {client?.gstn && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                GSTN {" "} {client.gstn}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment & Timeline */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 text-green-600" />
            Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar
              initials={assignee?.initials || assignee?.name?.charAt(0)}
              size="md"
            />
            <div>
              <p className="font-medium ">{assignee?.name || "Unassigned"}</p>
              {assignee?.email && (
                <p className="text-sm text-gray-500">{assignee.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm font-medium">
                {formatDate(createdAt)}
              </span>
            </div>

            {dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due Date
                </span>
                <span className="text-sm font-medium">
                  {formatDate(dueDate)}
                </span>
              </div>
            )}

            {scheduledDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Scheduled
                </span>
                <span className="text-sm font-medium">
                  {formatDate(scheduledDate)}
                </span>
              </div>
            )}

            {completedDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Completed
                </span>
                <span className="text-sm font-medium">
                  {
                    completedDate === 'N/A' ? 
                    'Pending' : formatDate(completedDate)
                  }
               
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className=" leading-relaxed whitespace-pre-wrap">
            {description || "No description provided."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
