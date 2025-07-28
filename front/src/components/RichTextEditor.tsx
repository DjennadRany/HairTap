import React, { useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Décrivez votre expérience, vos spécialités...",
  className = "",
  maxLength = 500
}) => {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const toggleFormat = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText = value;
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        if (isBold) {
          newText = value.substring(0, start) + selectedText + value.substring(end);
        } else {
          newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
          newCursorPos = start + 2;
        }
        setIsBold(!isBold);
        break;
      case 'italic':
        if (isItalic) {
          newText = value.substring(0, start) + selectedText + value.substring(end);
        } else {
          newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
          newCursorPos = start + 1;
        }
        setIsItalic(!isItalic);
        break;
      case 'underline':
        if (isUnderline) {
          newText = value.substring(0, start) + selectedText + value.substring(end);
        } else {
          newText = value.substring(0, start) + `__${selectedText}__` + value.substring(end);
          newCursorPos = start + 2;
        }
        setIsUnderline(!isUnderline);
        break;
    }

    onChange(newText);
    
    // Restaurer la sélection
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos + selectedText.length);
      textarea.focus();
    }, 0);
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Barre d'outils */}
      <div className="flex gap-2 p-2 bg-gray-50 rounded-lg border">
        <button
          type="button"
          onClick={() => toggleFormat('bold')}
          className={`p-2 rounded ${isBold ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          title="Gras"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('italic')}
          className={`p-2 rounded ${isItalic ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          title="Italique"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('underline')}
          className={`p-2 rounded ${isUnderline ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          title="Souligné"
        >
          <u>U</u>
        </button>
        <div className="flex-1"></div>
        <span className="text-xs text-gray-500 self-center">
          {value.length}/{maxLength}
        </span>
      </div>

      {/* Zone de texte */}
      <textarea
        id="rich-text-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        rows={6}
      />

      {/* Aperçu */}
      {value && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu :</h4>
          <div 
            className="text-sm text-gray-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatText(value) }}
          />
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 