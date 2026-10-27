import React from "react";

/**
 * Strips raw markdown stars/asterisks (* and **) from text
 */
export const stripStars = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*([^\*\n]+)\*/g, "$1")
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    .replace(/\*{2,}/g, "")
    .replace(/(^|\s)\*([^\s\*]+)\*(\s|$)/g, "$1$2$3")
    .trim();
};

/**
 * Renders message content cleanly, parsing **bold** into <strong> and *italic* into <em>
 * so raw asterisk stars never appear to the user.
 */
export const FormattedMessage: React.FC<{ content: string; className?: string }> = ({
  content,
  className = "",
}) => {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {lines.map((line, lineIdx) => {
        // Regex to capture **bold** or *italic*
        const regex = /(\*\*(.+?)\*\*)|(\*([^\*]+)\*)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        let keyCounter = 0;

        while ((match = regex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
          }

          if (match[2]) {
            // **bold** -> strong tag without stars
            parts.push(
              <strong key={keyCounter++} className="font-semibold">
                {match[2]}
              </strong>
            );
          } else if (match[4]) {
            // *italic* -> em tag without stars
            parts.push(
              <em key={keyCounter++} className="italic font-normal">
                {match[4]}
              </em>
            );
          }
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex));
        }

        return (
          <React.Fragment key={lineIdx}>
            {parts.length > 0 ? parts : " "}
            {lineIdx < lines.length - 1 && "\n"}
          </React.Fragment>
        );
      })}
    </span>
  );
};
