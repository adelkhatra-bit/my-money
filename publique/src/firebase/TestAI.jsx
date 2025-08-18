import React, { useState } from "react";

export default function TestAI() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAskAI() {
    if (!input.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${process.env.REACT_APP_OPENAI_API_KEY},
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: input }],
          temperature: 0.7,
        }),
      });

      const data = await res.json();

      if (data.choices && data.choices.length > 0) {
        setResponse(data.choices[0].message.content);
      } else {
        setResponse("❌ Erreur: pas de réponse reçue.");
      }
    } catch (err) {
      console.error(err);
      setResponse("⚠️ Erreur lors de la requête API.");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>💬 Test OpenAI</h2>
      <textarea
        rows="4"
        style={{ width: "100%", padding: "10px" }}
        placeholder="Écris ta question ici..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <br />
      <button
        onClick={handleAskAI}
        disabled={loading}
        style={{ marginTop: "10px", padding: "10px 20px" }}
      >
        {loading ? "⏳ En cours..." : "Envoyer"}
      </button>
      <div style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
        <strong>Réponse :</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}