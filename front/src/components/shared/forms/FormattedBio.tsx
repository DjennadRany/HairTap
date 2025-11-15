import React from 'react';

interface FormattedBioProps {
  bio: string;
  className?: string;
}

const FormattedBio: React.FC<FormattedBioProps> = ({ bio, className = "" }) => {
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
  };

  if (!bio) {
    return null;
  }

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formatText(bio) }}
    />
  );
};

export default FormattedBio; 