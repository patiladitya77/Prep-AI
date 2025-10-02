import React from "react";
import { Card } from "../ui/card";

interface ResumeDisplayProps {
  resumeData: {
    id: string;
    file_name: string;
    parsedData: {
      name?: string;
      email?: string;
      phone?: string;
      skills?: string[];
      experience?: Array<{
        company: string;
        position: string;
        duration: string;
        description: string;
      }>;
      education?: Array<{
        institution: string;
        degree: string;
        field: string;
        year: string;
      }>;
      summary?: string;
    };
    createdAt: string;
  };
  onEdit?: () => void;
}

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({
  resumeData,
  onEdit,
}) => {
  const { parsedData } = resumeData;

  return (
    <Card className="p-6 w-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{resumeData.file_name}</h2>
          <p className="text-gray-600 text-sm">
            Uploaded: {new Date(resumeData.createdAt).toLocaleDateString()}
          </p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Change Resume
          </button>
        )}
      </div>

      {/* Personal Information */}
      {(parsedData.name || parsedData.email || parsedData.phone) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
          <div className="space-y-1">
            {parsedData.name && (
              <p>
                <span className="font-medium">Name:</span> {parsedData.name}
              </p>
            )}
            {parsedData.email && (
              <p>
                <span className="font-medium">Email:</span> {parsedData.email}
              </p>
            )}
            {parsedData.phone && (
              <p>
                <span className="font-medium">Phone:</span> {parsedData.phone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {parsedData.summary && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p className="text-gray-700">{parsedData.summary}</p>
        </div>
      )}

      {/* Skills */}
      {parsedData.skills && parsedData.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {parsedData.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {parsedData.experience && parsedData.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Experience</h3>
          <div className="space-y-4">
            {parsedData.experience.map((exp, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <h4 className="font-medium">{exp.position}</h4>
                <p className="text-gray-600">{exp.company}</p>
                <p className="text-sm text-gray-500">{exp.duration}</p>
                {exp.description && (
                  <p className="text-gray-700 mt-1">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {parsedData.education && parsedData.education.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Education</h3>
          <div className="space-y-3">
            {parsedData.education.map((edu, index) => (
              <div key={index} className="border-l-4 border-green-200 pl-4">
                <h4 className="font-medium">
                  {edu.degree} in {edu.field}
                </h4>
                <p className="text-gray-600">{edu.institution}</p>
                {edu.year && (
                  <p className="text-sm text-gray-500">{edu.year}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ResumeDisplay;
