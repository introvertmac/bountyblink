import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import { 
  PublicKey, 
  Connection, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionInstruction
} from "@solana/web3.js";
import Airtable from 'airtable';
import { BlinksightsClient } from 'blinksights-sdk';

// Blinksights setup
const blinksights = new BlinksightsClient(process.env.ANALYTICS || '');

// Airtable setup
const AIRTABLE_PERSONAL_ACCESS_TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE1_ID = process.env.AIRTABLE_BASE1_ID;

if (!AIRTABLE_PERSONAL_ACCESS_TOKEN || !AIRTABLE_BASE1_ID) {
  throw new Error('Airtable configuration is missing. Please check your environment variables.');
}

const base = new Airtable({apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN}).base(AIRTABLE_BASE1_ID);

// Solana connection setup with Helius RPC
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=41cf9b1c-2c4f-477a-9cf6-349393ca6071');

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

Deadline: September 2, 2023, 11:00 PM IST

Submit your X thread link below. May the best thread win! 🏆
`;

export const GET = async (req: Request) => {
  try {
    const basePayload: ActionGetResponse = {
      title: "Carrot DeFi X Thread Challenge",
      icon: new URL("/crt.png", new URL(req.url).origin).toString(),
      description: bountyDescription,
      label: "Submit X Thread",
      links: {
        actions: [
          {
            label: "Submit Thread",
            href: "/api/actions/CRT?threadUrl={threadUrl}",
            parameters: [
              {
                name: "threadUrl",
                label: "Enter your X thread URL",
                required: true,
              },
            ],
          },
        ],
      },
    };

    // Create action get response and track render event
    const payload = await blinksights.createActionGetResponseV1(req.url, basePayload);

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    console.error("Error in GET request:", error);
    return Response.json({ error: "An error occurred processing your request" }, {
      status: 500,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();
    const { account } = body;

    const url = new URL(req.url);
    const threadUrl = url.searchParams.get('threadUrl');

    if (!threadUrl || !account) {
      throw new Error("Missing required fields");
    }

    // Validate wallet address
    let walletAddress: PublicKey;
    try {
      walletAddress = new PublicKey(account);
    } catch (err) {
      throw new Error("Invalid wallet address");
    }

    // Validate X.com URL
    if (!isValidXLink(threadUrl)) {
      throw new Error("Invalid X thread URL. Please submit a valid X.com or Twitter.com URL.");
    }

    // Track interaction event
    await blinksights.trackActionV2(account, req.url);

    // Create a minimal transaction (sending 0 SOL to self)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletAddress,
        toPubkey: walletAddress,
        lamports: 0,
      })
    );

    // Get Blinksights memo instruction
    const blinksightsMemoInstruction = await blinksights.getActionIdentityInstructionV2(account, req.url);

    // Add Blinksights memo instruction to the transaction if it exists
    if (blinksightsMemoInstruction) {
      transaction.add(blinksightsMemoInstruction);
    }

    // Set recent blockhash and fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletAddress;

    // Save to Airtable
    await saveToAirtable(threadUrl, walletAddress.toString());

    const successMessage = "Submission received! Winners will be announced after the challenge ends. Good luck! 🍀";

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: successMessage,
      },
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.error(err);
    let message = "An unknown error occurred";
    if (err instanceof Error) message = err.message;
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...ACTIONS_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
};

function isValidXLink(url: string): boolean {
  const xRegex = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/.+$/i;
  return xRegex.test(url);
}

async function saveToAirtable(threadUrl: string, walletAddress: string) {
  return new Promise((resolve, reject) => {
    base('Submissions').create({
      "X Thread URL": threadUrl,
      "Wallet Address": walletAddress,
      "Submission Time": new Date().toISOString(),
      "Status": "Pending"
    }, function(err, record) {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(record);
    });
  });
}