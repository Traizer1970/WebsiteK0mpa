import React from "react";
type DivProps = React.HTMLAttributes<HTMLDivElement>;
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export declare function Button({ className, children, ...rest }: ButtonProps): any;
export declare function Card({ className, ...props }: DivProps): any;
export declare function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): any;
export declare function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>): any;
export type Brand = {
    name: string;
    tag: "HOT" | "NEW" | "TOP";
    logo: string;
    image: string;
    imagePos?: React.CSSProperties["objectPosition"];
    minDep: string;
    bonus: string;
    cashback: string;
    freeSpins: string;
    code: string;
    link: string;
    theme?: {
        accent: string;
        shadow: string;
        ring?: string;
    };
    payments?: Array<"btc" | "mb" | "mbb" | "visa" | "mc">;
};
export default function CasinoPartnerHub(): any;
export {};
