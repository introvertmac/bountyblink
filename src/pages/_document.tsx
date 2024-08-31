// pages/_document.tsx or src/pages/_document.tsx

import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="dscvr:canvas:version" content="vNext" />
        <meta name="og:image" content="https://www.dappshunt.xyz/crt.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}