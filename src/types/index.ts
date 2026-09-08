export * from "./api";
export * from "./contact";
export * from "./lead";
export * from "./campaign";
export * from "./whatsapp";
export * from "./automation";
export * from "./analytics";

/* Marketing modules. `marketing` is imported directly rather than re-exported
   here — it defines `Campaign`, which `campaign.ts` also names. */
export * from "./email";
export * from "./sms";
export * from "./social";
export * from "./segment";
