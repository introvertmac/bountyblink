# Bounty Blink

Bounty Blink is a Solana-based application that allows users to participate in X (formerly Twitter) thread challenges and submit their entries for rewards. This project uses Next.js, Solana Web3.js, Airtable for data storage, and Blinksights for analytics.

## Features

- Displays challenge details and instructions
- Allows users to submit their X thread URLs
- Validates wallet addresses and X thread URLs
- Stores submissions in Airtable
- Tracks user interactions with Blinksights

## Airtable Structure

The Airtable base should have a table named "Submissions" with the following columns:

1. "X Thread URL" (URL): Stores the submitted X thread URL
2. "Wallet Address" (Text): Stores the participant's Solana wallet address
3. "Submission Time" (Date Time): Records the time of submission
4. "Status" (Single Select): Tracks the status of the submission (e.g., "Pending", "Approved", "Rejected")

## Environment Variables

To run this project, you need to set up the following environment variables:

1. `AIRTABLE_PERSONAL_ACCESS_TOKEN`: Your Airtable Personal Access Token
2. `AIRTABLE_BASE1_ID`: The ID of your Airtable base
3. `ANALYTICS`: Your Blinksights access token

Make sure to add these variables to your `.env` file or your hosting platform's environment settings.

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables
4. Run the development server: `npm run dev`

## Usage

1. Access the Bounty Blink challenge page
2. Connect your Solana wallet
3. Submit your X thread URL
4. Wait for the transaction confirmation
5. Check Airtable for your submission record

You can test this blink at:
https://dial.to/?action=solana-action:http://localhost:3000/api/actions/CRT

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the issues page if you want to contribute.

## License

[MIT](https://choosealicense.com/licenses/mit/)