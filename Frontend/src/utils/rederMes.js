import React from "react";

function renderMessageText(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return React.createElement(
        "a",
        {
          key: i,
          href: part,
          target: "_blank",
          rel: "noopener noreferrer",
          style: { color: "#007bff", textDecoration: "underline" },
        },
        part
      );
    }
    return part;
  });
}

export default renderMessageText;