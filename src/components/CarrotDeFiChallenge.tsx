import React, { useEffect, useState } from 'react';
import { CanvasClient } from "@dscvr-one/canvas-client-sdk";

const bountyDescription = `
🚀 Carrot DeFi X Thread Challenge 🥕

Create an engaging X thread about @DeFiCarrot and win $SEND tokens!

Task:
- Craft an 8-tweet thread about Carrot DeFi
- Tag @DeFiCarrot in each tweet
- Include a compelling call-to-action
- Use info from https://deficarrot.com

Prizes:
🥇 1st Place: 2,000 $SEND
🥈 2nd Place: 1,000 $SEND
🥉 3rd Place: 500 $SEND

Deadline: September 2, 2023, 00:00 IST (September 1 midnight)

Submit your X thread link below. May the best thread win! 🏆
`;

export function CarrotDeFiChallenge() {
  const [canvasClient, setCanvasClient] = useState<CanvasClient | null>(null);
  const [threadUrl, setThreadUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isEmbedded, setIsEmbedded] = useState(true);

  useEffect(() => {
    let client: CanvasClient | null = null;
    const initializeClient = async () => {
      try {
        client = new CanvasClient();
        await client.ready();
        setCanvasClient(client);
        setIsEmbedded(true);
      } catch (error) {
        console.error('Failed to initialize CanvasClient:', error);
        setIsEmbedded(false);
      }
    };

    initializeClient();

    return () => {
      if (client) client.destroy();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!isEmbedded) {
      setMessage('This component is not embedded in DSCVR. Submission functionality is disabled.');
      return;
    }

    if (!canvasClient) {
      setMessage('Canvas client not ready. Please try again.');
      return;
    }

    try {
      const response = await fetch('/api/actions/CRT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account: 'dscvr_user', threadUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.fields.message);
      } else {
        setMessage(data.error || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting thread:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ backgroundColor: "#0C0F14", color: "white", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Carrot DeFi X Thread Challenge</h1>
      <p>{bountyDescription}</p>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={threadUrl} 
          onChange={(e) => setThreadUrl(e.target.value)}
          placeholder="Enter your X thread URL"
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />
        <button 
          type="submit" 
          style={{ 
            padding: "10px 20px", 
            backgroundColor: isEmbedded ? "#4CAF50" : "#cccccc", 
            color: "white", 
            border: "none",
            cursor: isEmbedded ? "pointer" : "not-allowed"
          }}
          disabled={!isEmbedded}
        >
          Submit Thread
        </button>
      </form>
      {message && <p>{message}</p>}
      {!isEmbedded && (
        <p style={{ color: "yellow" }}>
          Warning: This component is not embedded in DSCVR. Some functionality may be limited.
        </p>
      )}
    </div>
  );
}