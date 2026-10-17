import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'FlexiDuit | Loan Management',description:'Private customer records, loan history and portfolio management.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
