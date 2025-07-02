import React from "react";

import { FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface Document {
  label: string;
  available: boolean;

  url?: string;
}

interface DocumentSectionProps {
  documents: Document[];
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  documents,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2 " />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 " />
              <span className="font-medium ">{doc.label}</span>
            </div>

            <div className="flex items-center space-x-2">
              <>
                {doc.url && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_BASE_URL}${doc.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </a>
                )}
              </>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
