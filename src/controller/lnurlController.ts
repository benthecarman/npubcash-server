import { NextFunction, Request, Response } from "express";
import { nip19 } from "nostr-tools";

import { wallet } from "..";
import { User } from "../models";

const metadata = "A cashu lightning address! Neat!";

export async function lnurlController(
  req: Request<{ user: string }, unknown, unknown, { amount?: number }>,
  res: Response,
  next: NextFunction,
) {
  const { amount } = req.query;
  const userParam = req.params.user;
  let username: string | User | undefined;
  if (userParam.startsWith("npub")) {
    try {
      nip19.decode(userParam as `npub1${string}`);
      username = userParam;
    } catch {
      res.status(401);
      return next(new Error("Invalid npub / public key"));
    }
  } else {
    const userObj = await User.getUserByName(userParam);
    if (!userObj) {
      res.status(404);
      return next(new Error("User not found"));
    }
    username = userObj.name;
  }
  if (!amount) {
    return res.json({
      callback: `https://cashu.my2sats.space/.well-known/lnurlp/${username}`,
      maxSendable: 250000,
      minSendable: 10000,
      metadata: [["text/plain", metadata]],
      tag: "payRequest",
    });
  }
  if (amount > 250000 || amount < 10000) {
    const err = new Error("Invalid amount");
    return next(err);
  }
  const { pr } = await wallet.requestMint(Math.floor(amount / 1000));
  // TO-DO add polling here
  res.json({
    pr,
    routes: [],
  });
}
